import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenAI } from '@google/genai';

@Injectable()
export class EmbeddingService {
  private readonly logger = new Logger(EmbeddingService.name);
  private geminiClient: GoogleGenAI | null = null;
  private readonly vectorDim = 128;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      this.geminiClient = new GoogleGenAI({ apiKey });
    }
  }

  /**
   * Generates a dense vector embedding for the given text.
   * Uses Gemini text-embedding-004 if API key is configured,
   * falls back to Ollama, or uses a deterministic normalized hash vector if offline.
   */
  async generateEmbedding(text: string): Promise<number[]> {
    const cleanText = text.trim();
    if (!cleanText) {
      return new Array(this.vectorDim).fill(0);
    }

    // 1. Try Gemini text-embedding-004
    if (this.geminiClient) {
      try {
        const response = await this.geminiClient.models.embedContent({
          model: 'text-embedding-004',
          contents: cleanText,
        });

        const firstValues = response.embeddings?.[0]?.values;
        if (firstValues && firstValues.length > 0) {
          return firstValues;
        }
      } catch (err) {
        this.logger.warn(`Gemini embedding failed, falling back: ${err}`);
      }
    }

    // 2. Try Local Ollama Embedding
    try {
      const ollamaUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
      const res = await fetch(`${ollamaUrl}/api/embeddings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'all-minilm', prompt: cleanText }),
        signal: AbortSignal.timeout(2000),
      });

      if (res.ok) {
        const data = (await res.json()) as { embedding?: number[] };
        if (data.embedding && data.embedding.length > 0) {
          return data.embedding;
        }
      }
    } catch {
      // Ollama not running; proceed to deterministic fallback
    }

    // 3. Deterministic Hashed Semantic Vectorizer (Offline / Free Fallback)
    return this.generateDeterministicVector(cleanText);
  }

  /**
   * Computes Cosine Similarity between two vector embeddings.
   * Returns a score between -1.0 and 1.0 (typically 0.0 to 1.0).
   */
  cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (!vecA.length || !vecB.length || vecA.length !== vecB.length) {
      // If dimensions mismatch, compare common length
      const minLen = Math.min(vecA.length, vecB.length);
      if (minLen === 0) return 0;
      let dot = 0;
      let normA = 0;
      let normB = 0;
      for (let i = 0; i < minLen; i++) {
        dot += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
      }
      const denom = Math.sqrt(normA) * Math.sqrt(normB);
      return denom === 0 ? 0 : dot / denom;
    }

    let dot = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dot += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    const denom = Math.sqrt(normA) * Math.sqrt(normB);
    return denom === 0 ? 0 : dot / denom;
  }

  /**
   * Splits a long text document into semantic chunks with overlap.
   */
  chunkText(text: string, chunkSize: number = 400, overlap: number = 80): string[] {
    const clean = text.replace(/\r\n/g, '\n').trim();
    if (clean.length <= chunkSize) {
      return [clean];
    }

    const chunks: string[] = [];
    const paragraphs = clean.split(/\n\s*\n/);
    let currentChunk = '';

    for (const para of paragraphs) {
      if ((currentChunk + '\n\n' + para).length <= chunkSize) {
        currentChunk = currentChunk ? currentChunk + '\n\n' + para : para;
      } else {
        if (currentChunk) {
          chunks.push(currentChunk.trim());
          // Retain overlap from end of previous chunk
          const words = currentChunk.split(/\s+/);
          const overlapWords = words.slice(-Math.floor(overlap / 6)).join(' ');
          currentChunk = overlapWords ? overlapWords + ' ' + para : para;
        } else {
          // Paragraph itself exceeds chunkSize, split by sentences
          const sentences = para.split(/(?<=[.?!])\s+/);
          let sentenceChunk = '';
          for (const s of sentences) {
            if ((sentenceChunk + ' ' + s).length <= chunkSize) {
              sentenceChunk = sentenceChunk ? sentenceChunk + ' ' + s : s;
            } else {
              if (sentenceChunk) chunks.push(sentenceChunk.trim());
              sentenceChunk = s;
            }
          }
          if (sentenceChunk) currentChunk = sentenceChunk;
        }
      }
    }

    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }

    return chunks.filter((c) => c.length > 10);
  }

  /**
   * Creates a normalized hash vector using term frequency and n-gram hashing.
   */
  private generateDeterministicVector(text: string): number[] {
    const vector = new Array(this.vectorDim).fill(0);
    const words = text.toLowerCase().match(/\b\w+\b/g) || [];

    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      const hash1 = this.hashString(word) % this.vectorDim;
      const hash2 = this.hashString(word + '_suffix') % this.vectorDim;
      vector[Math.abs(hash1)] += 1.0 / (1.0 + Math.log(1 + i));
      vector[Math.abs(hash2)] += 0.5;
    }

    // Normalize vector to unit length
    let norm = 0;
    for (let i = 0; i < this.vectorDim; i++) {
      norm += vector[i] * vector[i];
    }
    const magnitude = Math.sqrt(norm);
    if (magnitude > 0) {
      for (let i = 0; i < this.vectorDim; i++) {
        vector[i] = vector[i] / magnitude;
      }
    }

    return vector;
  }

  private hashString(str: string): number {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
      hash = (hash * 33) ^ str.charCodeAt(i);
    }
    return hash >>> 0;
  }
}
