import { Test, TestingModule } from '@nestjs/testing';
import { KnowledgeService } from './knowledge.service';
import { EmbeddingService } from './embedding.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('KnowledgeService', () => {
  let service: KnowledgeService;

  const mockPrisma = {
    knowledgeDocument: {
      create: jest.fn().mockImplementation(({ data }) =>
        Promise.resolve({
          id: 'doc-1',
          userId: data.userId,
          title: data.title,
          fileType: data.fileType,
          storagePath: data.storagePath,
          chunkCount: data.chunkCount,
          isIndexed: data.isIndexed,
          createdAt: new Date(),
        }),
      ),
      findMany: jest.fn().mockResolvedValue([]),
      findFirst: jest.fn().mockResolvedValue({ id: 'doc-1', chunks: [] }),
      delete: jest.fn().mockResolvedValue({ id: 'doc-1' }),
    },
    documentChunk: {
      create: jest.fn().mockImplementation(({ data }) =>
        Promise.resolve({
          id: 'chunk-' + Math.random(),
          documentId: data.documentId,
          chunkIndex: data.chunkIndex,
          content: data.content,
          createdAt: new Date(),
        }),
      ),
      findMany: jest.fn().mockResolvedValue([]),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KnowledgeService,
        EmbeddingService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<KnowledgeService>(KnowledgeService);
  });

  describe('ingestDocument', () => {
    it('should chunk document, compute embeddings, and store records', async () => {
      const doc = await service.ingestDocument('user-1', {
        title: 'Project Architecture',
        content:
          'This is paragraph 1 of the architecture document. It describes the backend API structure and models.\n\nThis is paragraph 2. It explains how vector embeddings and RAG retrieval function.',
      });

      expect(doc).toBeDefined();
      expect(doc.title).toBe('Project Architecture');
      expect(doc.chunkCount).toBeGreaterThan(0);
      expect(mockPrisma.knowledgeDocument.create).toHaveBeenCalled();
      expect(mockPrisma.documentChunk.create).toHaveBeenCalled();
    });
  });

  describe('search', () => {
    it('should return matching chunks ranked by cosine similarity', async () => {
      await service.ingestDocument('user-1', {
        title: 'Quantum Computing Notes',
        content: 'Quantum qubits use superposition and entanglement to execute parallel calculations.',
      });

      const results = await service.search('user-1', 'quantum superposition', 2);
      expect(results).toBeDefined();
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].content).toContain('superposition');
      expect(results[0].similarityScore).toBeGreaterThan(0);
    });
  });
});
