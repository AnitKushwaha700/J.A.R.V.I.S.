import { Test, TestingModule } from '@nestjs/testing';
import { MemoryService } from './memory.service';
import { EmbeddingService } from '../knowledge/embedding.service';
import { KnowledgeService } from '../knowledge/knowledge.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('MemoryService', () => {
  let service: MemoryService;

  const mockPrisma = {
    memory: {
      create: jest.fn().mockImplementation(({ data }) =>
        Promise.resolve({
          id: 'mem-' + Math.random(),
          userId: data.userId,
          category: data.category,
          content: data.content,
          importance: data.importance,
          createdAt: new Date(),
          lastAccessed: new Date(),
        }),
      ),
      findMany: jest.fn().mockResolvedValue([]),
      findFirst: jest.fn().mockResolvedValue({
        id: 'mem-1',
        userId: 'user-1',
        content: 'Existing memory',
        category: 'general',
        importance: 0.5,
      }),
      update: jest.fn().mockImplementation(({ data, where }) =>
        Promise.resolve({
          id: where.id,
          userId: 'user-1',
          content: data.content,
          category: data.category,
          importance: data.importance,
          createdAt: new Date(),
          lastAccessed: new Date(),
        }),
      ),
      delete: jest.fn().mockResolvedValue({ id: 'mem-1' }),
      deleteMany: jest.fn().mockResolvedValue({ count: 5 }),
    },
  };

  const mockKnowledgeService = {
    search: jest.fn().mockResolvedValue([
      { id: 'chunk-1', content: 'From doc: User prefers dark mode theme' },
    ]),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MemoryService,
        EmbeddingService,
        { provide: KnowledgeService, useValue: mockKnowledgeService },
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<MemoryService>(MemoryService);
  });

  describe('create (with Sensitive Data Redaction)', () => {
    it('should create memory and redact credit card number', async () => {
      const memory = await service.create('user-1', {
        category: 'preference',
        content: 'My payment card is 4111111111111111 and I prefer monthly billing',
        importance: 0.8,
      });

      expect(memory).toBeDefined();
      expect(memory.content).not.toContain('4111111111111111');
      expect(memory.content).toContain('[REDACTED_CREDIT_CARD]');
    });

    it('should create memory and redact password', async () => {
      const memory = await service.create('user-1', {
        category: 'instruction',
        content: 'Login credentials: password: mySecretPassword123 for staging server',
        importance: 0.7,
      });

      expect(memory.content).not.toContain('mySecretPassword123');
      expect(memory.content).toContain('[REDACTED_SECRET]');
    });
  });

  describe('search & getRAGContext', () => {
    it('should search memories semantically and return ranked results', async () => {
      await service.create('user-1', {
        category: 'fact',
        content: 'I live in New York City and work as a software engineer',
        importance: 0.9,
      });

      const results = await service.search('user-1', 'where do I live?', 1);
      expect(results).toBeDefined();
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].memory.content).toContain('New York City');
    });

    it('should build combined RAG context for conversation prompts', async () => {
      await service.create('user-1', {
        category: 'preference',
        content: 'Always respond in TypeScript when giving code examples',
        importance: 1.0,
      });

      const ragSnippet = await service.getRAGContext('user-1', 'Show me code in TypeScript');
      expect(ragSnippet).toContain('RELEVANT USER MEMORY & KNOWLEDGE CONTEXT');
      expect(ragSnippet).toContain('TypeScript');
    });
  });

  describe('export', () => {
    it('should export memories in JSON and Markdown formats', async () => {
      mockPrisma.memory.findMany.mockResolvedValueOnce([
        {
          id: 'mem-1',
          userId: 'user-1',
          category: 'preference',
          content: 'Prefers dark theme',
          importance: 0.8,
          createdAt: new Date(),
          lastAccessed: new Date(),
        },
      ]);

      const exp = await service.export('user-1');
      expect(exp.json.length).toBe(1);
      expect(exp.markdown).toContain('# JARVIS Memory Export');
      expect(exp.markdown).toContain('Prefers dark theme');
    });
  });
});
