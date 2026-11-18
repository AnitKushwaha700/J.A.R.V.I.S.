import { Test, TestingModule } from '@nestjs/testing';
import { ConversationsService } from './conversations.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AIGatewayService } from '../ai/ai-gateway.service';

describe('ConversationsService', () => {
  let service: ConversationsService;

  const mockPrisma = {
    conversation: {
      findMany: jest.fn().mockResolvedValue([
        { id: 'conv-1', title: 'Test Chat', mode: 'assistant', updatedAt: new Date(), messages: [] },
      ]),
      create: jest.fn().mockResolvedValue({
        id: 'conv-2',
        title: 'New Conversation',
        mode: 'assistant',
        userId: 'user-1',
      }),
      findFirst: jest.fn().mockResolvedValue({
        id: 'conv-1',
        title: 'Test Chat',
        userId: 'user-1',
        messages: [],
      }),
      delete: jest.fn().mockResolvedValue({ id: 'conv-1' }),
    },
    message: {
      create: jest.fn().mockResolvedValue({ id: 'msg-1' }),
      findMany: jest.fn().mockResolvedValue([]),
    },
  };

  const mockAiGateway = {
    stream: jest.fn(),
    generate: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConversationsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AIGatewayService, useValue: mockAiGateway },
      ],
    }).compile();

    service = module.get<ConversationsService>(ConversationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should list conversations for a user', async () => {
    const list = await service.list('user-1');
    expect(list).toHaveLength(1);
    expect(list[0].id).toBe('conv-1');
  });

  it('should create a new conversation', async () => {
    const conv = await service.create('user-1', { title: 'My Chat' });
    expect(conv.id).toBe('conv-2');
  });

  it('should delete an existing conversation', async () => {
    const res = await service.delete('conv-1', 'user-1');
    expect(res.success).toBe(true);
  });
});
