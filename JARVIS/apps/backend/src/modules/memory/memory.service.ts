import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EmbeddingService } from '../knowledge/embedding.service';
import { KnowledgeService } from '../knowledge/knowledge.service';
import { CreateMemoryDto, UpdateMemoryDto } from './dto/memory.dto';
import { UserMemory, MemorySearchResult } from '@jarvis/shared-types';

interface MemoryCacheItem {
  id: string;
  userId: string;
  category: string;
  content: string;
  importance: number;
  embedding: number[];
}

@Injectable()
export class MemoryService {
  private readonly logger = new Logger(MemoryService.name);
  private readonly memoryCache = new Map<string, MemoryCacheItem>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly embeddingService: EmbeddingService,
    private readonly knowledgeService: KnowledgeService,
  ) {}

  /**
   * Sanitizes text to prevent accidental storage of sensitive personal data
   * (e.g. credit card numbers, passwords, recovery seeds, SSNs).
   */
  private sanitizeContent(content: string): { cleanContent: string; redacted: boolean } {
    let clean = content;
    let redacted = false;

    // Credit card regex (Visa, MC, Amex, Discover)
    const ccRegex = /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|6(?:011|5[0-9]{2})[0-9]{12})\b/g;
    if (ccRegex.test(clean)) {
      clean = clean.replace(ccRegex, '[REDACTED_CREDIT_CARD]');
      redacted = true;
    }

    // Passwords & private keys
    const secretRegex = /\b(?:password|passwd|private_key|seed_phrase|mnemonic)\s*[:=]\s*[^\s,]+/gi;
    if (secretRegex.test(clean)) {
      clean = clean.replace(secretRegex, '$1: [REDACTED_SECRET]');
      redacted = true;
    }

    // SSN
    const ssnRegex = /\b\d{3}-\d{2}-\d{4}\b/g;
    if (ssnRegex.test(clean)) {
      clean = clean.replace(ssnRegex, '[REDACTED_SSN]');
      redacted = true;
    }

    if (redacted) {
      this.logger.warn('Sensitive information detected and redacted from user memory entry.');
    }

    return { cleanContent: clean.trim(), redacted };
  }

  async create(userId: string, dto: CreateMemoryDto): Promise<UserMemory> {
    const { cleanContent } = this.sanitizeContent(dto.content);
    const category = dto.category?.toLowerCase() || 'general';
    const importance = dto.importance !== undefined ? dto.importance : 0.5;

    const memory = await this.prisma.memory.create({
      data: {
        userId,
        category,
        content: cleanContent,
        importance,
      },
    });

    const embedding = await this.embeddingService.generateEmbedding(cleanContent);
    this.memoryCache.set(memory.id, {
      id: memory.id,
      userId,
      category,
      content: cleanContent,
      importance,
      embedding,
    });

    return {
      id: memory.id,
      userId: memory.userId,
      category: memory.category,
      content: memory.content,
      importance: memory.importance,
      createdAt: memory.createdAt.toISOString(),
      lastAccessed: memory.lastAccessed.toISOString(),
    };
  }

  async list(userId: string, category?: string): Promise<UserMemory[]> {
    const where: { userId: string; category?: string } = { userId };
    if (category && category !== 'all') {
      where.category = category.toLowerCase();
    }

    const memories = await this.prisma.memory.findMany({
      where,
      orderBy: [{ importance: 'desc' }, { lastAccessed: 'desc' }],
    });

    return memories.map((m) => ({
      id: m.id,
      userId: m.userId,
      category: m.category,
      content: m.content,
      importance: m.importance,
      createdAt: m.createdAt.toISOString(),
      lastAccessed: m.lastAccessed.toISOString(),
    }));
  }

  async update(userId: string, id: string, dto: UpdateMemoryDto): Promise<UserMemory> {
    const existing = await this.prisma.memory.findFirst({
      where: { id, userId },
    });
    if (!existing) {
      throw new NotFoundException('Memory not found.');
    }

    let updatedContent = existing.content;
    if (dto.content) {
      const { cleanContent } = this.sanitizeContent(dto.content);
      updatedContent = cleanContent;
    }

    const updated = await this.prisma.memory.update({
      where: { id },
      data: {
        content: updatedContent,
        category: dto.category ? dto.category.toLowerCase() : existing.category,
        importance: dto.importance !== undefined ? dto.importance : existing.importance,
        lastAccessed: new Date(),
      },
    });

    // Update embedding in cache
    const embedding = await this.embeddingService.generateEmbedding(updated.content);
    this.memoryCache.set(updated.id, {
      id: updated.id,
      userId,
      category: updated.category,
      content: updated.content,
      importance: updated.importance,
      embedding,
    });

    return {
      id: updated.id,
      userId: updated.userId,
      category: updated.category,
      content: updated.content,
      importance: updated.importance,
      createdAt: updated.createdAt.toISOString(),
      lastAccessed: updated.lastAccessed.toISOString(),
    };
  }

  async delete(userId: string, id: string): Promise<{ success: boolean }> {
    const existing = await this.prisma.memory.findFirst({
      where: { id, userId },
    });
    if (!existing) {
      throw new NotFoundException('Memory not found.');
    }

    await this.prisma.memory.delete({ where: { id } });
    this.memoryCache.delete(id);
    return { success: true };
  }

  async clearAll(userId: string): Promise<{ success: boolean; count: number }> {
    const result = await this.prisma.memory.deleteMany({ where: { userId } });
    for (const [id, item] of this.memoryCache.entries()) {
      if (item.userId === userId) {
        this.memoryCache.delete(id);
      }
    }
    return { success: true, count: result.count };
  }

  /**
   * Semantic similarity search over long-term memories.
   */
  async search(userId: string, query: string, topK: number = 5): Promise<MemorySearchResult[]> {
    const queryEmbedding = await this.embeddingService.generateEmbedding(query);

    // Warm cache if empty
    if (this.memoryCache.size === 0) {
      await this.warmCache(userId);
    }

    const results: MemorySearchResult[] = [];

    for (const item of this.memoryCache.values()) {
      if (item.userId === userId) {
        const sim = this.embeddingService.cosineSimilarity(queryEmbedding, item.embedding);
        // Hybrid score: cosine similarity weighted by memory importance
        const weightedScore = sim * 0.7 + item.importance * 0.3;

        results.push({
          memory: {
            id: item.id,
            userId: item.userId,
            category: item.category,
            content: item.content,
            importance: item.importance,
            createdAt: new Date().toISOString(),
            lastAccessed: new Date().toISOString(),
          },
          similarityScore: Number(weightedScore.toFixed(4)),
        });
      }
    }

    results.sort((a, b) => b.similarityScore - a.similarityScore);
    return results.slice(0, topK);
  }

  /**
   * Builds RAG context to inject into LLM system prompts.
   * Pulls relevant memories and knowledge chunks for the current prompt.
   */
  async getRAGContext(userId: string, query: string): Promise<string> {
    try {
      const [memories, chunks] = await Promise.all([
        this.search(userId, query, 3),
        this.knowledgeService.search(userId, query, 2),
      ]);

      const parts: string[] = [];

      if (memories.length > 0) {
        const memList = memories
          .map((m) => `- [${m.memory.category}]: ${m.memory.content}`)
          .join('\n');
        parts.push(`### Relevant Personal Memories:\n${memList}`);
      }

      if (chunks.length > 0) {
        const chunkList = chunks
          .map((c, i) => `[Source ${i + 1}]: ${c.content}`)
          .join('\n\n');
        parts.push(`### Retrieved Knowledge Base Documents:\n${chunkList}`);
      }

      if (parts.length === 0) return '';

      return `\n\n--- RELEVANT USER MEMORY & KNOWLEDGE CONTEXT ---\n${parts.join('\n\n')}\n--- END CONTEXT ---\n`;
    } catch (err) {
      this.logger.warn(`Failed to build RAG context: ${err}`);
      return '';
    }
  }

  async export(userId: string): Promise<{ json: UserMemory[]; markdown: string }> {
    const memories = await this.list(userId);

    const grouped: Record<string, string[]> = {};
    for (const m of memories) {
      if (!grouped[m.category]) grouped[m.category] = [];
      grouped[m.category].push(`- ${m.content} (importance: ${m.importance})`);
    }

    let md = `# JARVIS Memory Export for User\nExported on: ${new Date().toISOString()}\n\n`;
    for (const [cat, items] of Object.entries(grouped)) {
      md += `## ${cat.toUpperCase()}\n${items.join('\n')}\n\n`;
    }

    return { json: memories, markdown: md };
  }

  private async warmCache(userId: string): Promise<void> {
    const memories = await this.prisma.memory.findMany({ where: { userId } });
    for (const m of memories) {
      const embedding = await this.embeddingService.generateEmbedding(m.content);
      this.memoryCache.set(m.id, {
        id: m.id,
        userId: m.userId,
        category: m.category,
        content: m.content,
        importance: m.importance,
        embedding,
      });
    }
  }
}
