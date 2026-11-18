import { Test, TestingModule } from '@nestjs/testing';
import { TasksService } from './tasks.service';
import { PrismaService } from '../../prisma/prisma.service';
import { SearchService } from '../search/search.service';
import { VoiceService } from '../voice/voice.service';
import { AIGatewayService } from '../ai/ai-gateway.service';

describe('TasksService', () => {
  let service: TasksService;

  const mockPrisma = {
    task: {
      findMany: jest.fn().mockResolvedValue([
        {
          id: 'task-1',
          userId: 'user-1',
          title: 'Review pull request',
          priority: 'high',
          status: 'todo',
          dueAt: new Date(),
          isRecurring: false,
          recurrenceRule: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]),
      findFirst: jest.fn().mockResolvedValue({
        id: 'task-1',
        userId: 'user-1',
        title: 'Review pull request',
        priority: 'high',
        status: 'todo',
        dueAt: new Date(),
        isRecurring: false,
        recurrenceRule: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
      create: jest.fn().mockImplementation(({ data }) =>
        Promise.resolve({
          id: 'task-new',
          ...data,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      ),
      update: jest.fn().mockImplementation(({ data }) =>
        Promise.resolve({
          id: 'task-1',
          userId: 'user-1',
          title: data.title || 'Review pull request',
          status: data.status || 'todo',
          priority: data.priority || 'high',
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      ),
      delete: jest.fn().mockResolvedValue({ id: 'task-1' }),
      count: jest.fn().mockResolvedValue(3),
    },
  };

  const mockSearchService = {
    getWeather: jest.fn().mockResolvedValue({
      location: 'Mumbai',
      temperature: 28,
      condition: 'Clear sky ☀️',
    }),
    searchNews: jest.fn().mockResolvedValue([
      { title: 'Tech breakthroughs in quantum computing', source: 'Hacker News' },
    ]),
  };

  const mockVoiceService = {
    synthesizeSpeech: jest.fn(),
  };

  const mockAiGateway = {
    generate: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: SearchService, useValue: mockSearchService },
        { provide: VoiceService, useValue: mockVoiceService },
        { provide: AIGatewayService, useValue: mockAiGateway },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
  });

  describe('CRUD operations', () => {
    it('should list user tasks', async () => {
      const tasks = await service.list('user-1');
      expect(tasks).toBeDefined();
      expect(tasks.length).toBe(1);
      expect(tasks[0].title).toBe('Review pull request');
    });

    it('should create a task with given priority', async () => {
      const created = await service.create('user-1', {
        title: 'Deploy microservices',
        priority: 'high',
      });
      expect(created.id).toBe('task-new');
      expect(created.title).toBe('Deploy microservices');
      expect(created.priority).toBe('high');
    });
  });

  describe('extractTaskFromText (Natural Language Parsing)', () => {
    it('should extract title, high priority, and tomorrow date from speech command', async () => {
      const voiceCommand =
        'JARVIS, please remind me to deploy the production server tomorrow at 7 PM urgently';
      const extracted = await service.extractTaskFromText(voiceCommand);

      expect(extracted).toBeDefined();
      expect(extracted.title).toContain('Deploy the production server');
      expect(extracted.priority).toBe('high');
      expect(extracted.dueAt).toBeDefined();
    });

    it('should detect low priority phrases', async () => {
      const voiceCommand = 'Add a task to read the documentation whenever';
      const extracted = await service.extractTaskFromText(voiceCommand);

      expect(extracted.title).toContain('Read the documentation');
      expect(extracted.priority).toBe('low');
    });
  });

  describe('getDailyBriefing', () => {
    it('should aggregate tasks, weather, news, and construct spoken script', async () => {
      const briefing = await service.getDailyBriefing('user-1', 'Mumbai');

      expect(briefing).toBeDefined();
      expect(briefing.greeting).toBeDefined();
      expect(briefing.weather?.location).toBe('Mumbai');
      expect(briefing.topTasks.length).toBeGreaterThan(0);
      expect(briefing.spokenScript).toContain('Mumbai');
      expect(briefing.spokenScript).toContain('Review pull request');
      expect(briefing.spokenScript).toContain('All core systems');
    });
  });
});
