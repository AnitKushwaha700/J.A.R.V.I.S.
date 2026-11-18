import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EmbeddingService } from './embedding.service';
import { IngestDocumentDto } from './dto/ingest-document.dto';
import { DocumentChunkItem, KnowledgeDoc } from '@jarvis/shared-types';

interface CachedEmbedding {
  chunkId: string;
  documentId: string;
  userId: string;
  content: string;
  embedding: number[];
}

@Injectable()
export class KnowledgeService {
  private readonly logger = new Logger(KnowledgeService.name);
  private readonly embeddingCache = new Map<string, CachedEmbedding>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly embeddingService: EmbeddingService,
  ) {}

  /**
   * Ingests a text document into the Knowledge Base RAG pipeline:
   * Chunks text -> Computes embeddings -> Persists chunks to DB -> Updates vector index.
   */
  async ingestDocument(userId: string, dto: IngestDocumentDto): Promise<KnowledgeDoc> {
    const title = dto.title.trim();
    const content = dto.content.trim();
    const fileType = dto.fileType || 'text/plain';

    // 1. Chunk document
    const rawChunks = this.embeddingService.chunkText(content, 450, 90);
    this.logger.log(`Ingesting document "${title}" into ${rawChunks.length} chunks`);

    // 2. Create document record in database
    const doc = await this.prisma.knowledgeDocument.create({
      data: {
        userId,
        title,
        fileType,
        storagePath: `local://knowledge/${userId}/${Date.now()}_${encodeURIComponent(title)}`,
        chunkCount: rawChunks.length,
        isIndexed: true,
      },
    });

    // 3. Generate embeddings and create chunk records
    for (let i = 0; i < rawChunks.length; i++) {
      const chunkText = rawChunks[i];
      const embedding = await this.embeddingService.generateEmbedding(chunkText);

      const chunkRecord = await this.prisma.documentChunk.create({
        data: {
          documentId: doc.id,
          chunkIndex: i,
          content: chunkText,
        },
      });

      // Cache embedding for fast cosine similarity lookups
      this.embeddingCache.set(chunkRecord.id, {
        chunkId: chunkRecord.id,
        documentId: doc.id,
        userId,
        content: chunkText,
        embedding,
      });
    }

    return {
      id: doc.id,
      userId: doc.userId,
      title: doc.title,
      fileType: doc.fileType,
      storagePath: doc.storagePath,
      chunkCount: doc.chunkCount,
      isIndexed: doc.isIndexed,
      createdAt: doc.createdAt.toISOString(),
    };
  }

  /**
   * Semantic Vector Search over Knowledge Documents.
   */
  async search(userId: string, query: string, topK: number = 4): Promise<DocumentChunkItem[]> {
    const queryEmbedding = await this.embeddingService.generateEmbedding(query);

    // Warm cache from database if empty
    if (this.embeddingCache.size === 0) {
      await this.warmCache(userId);
    }

    const scored: { item: DocumentChunkItem; score: number }[] = [];

    for (const cached of this.embeddingCache.values()) {
      if (cached.userId === userId) {
        const score = this.embeddingService.cosineSimilarity(queryEmbedding, cached.embedding);
        scored.push({
          item: {
            id: cached.chunkId,
            documentId: cached.documentId,
            chunkIndex: 0,
            content: cached.content,
            createdAt: new Date().toISOString(),
            similarityScore: Number(score.toFixed(4)),
          },
          score,
        });
      }
    }

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, topK).map((s) => ({
      ...s.item,
      similarityScore: s.score,
    }));
  }

  async list(userId: string): Promise<KnowledgeDoc[]> {
    const docs = await this.prisma.knowledgeDocument.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return docs.map((d) => ({
      id: d.id,
      userId: d.userId,
      title: d.title,
      fileType: d.fileType,
      storagePath: d.storagePath,
      chunkCount: d.chunkCount,
      isIndexed: d.isIndexed,
      createdAt: d.createdAt.toISOString(),
    }));
  }

  async delete(userId: string, documentId: string): Promise<{ success: boolean }> {
    const doc = await this.prisma.knowledgeDocument.findFirst({
      where: { id: documentId, userId },
      include: { chunks: true },
    });

    if (!doc) {
      throw new NotFoundException('Knowledge document not found.');
    }

    for (const chunk of doc.chunks) {
      this.embeddingCache.delete(chunk.id);
    }

    await this.prisma.knowledgeDocument.delete({ where: { id: documentId } });
    return { success: true };
  }

  private async warmCache(userId: string): Promise<void> {
    const chunks = await this.prisma.documentChunk.findMany({
      where: { document: { userId } },
      include: { document: true },
    });

    for (const c of chunks) {
      const embedding = await this.embeddingService.generateEmbedding(c.content);
      this.embeddingCache.set(c.id, {
        chunkId: c.id,
        documentId: c.documentId,
        userId: c.document.userId,
        content: c.content,
        embedding,
      });
    }
  }
}
