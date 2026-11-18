import { Test, TestingModule } from '@nestjs/testing';
import { AIGatewayService } from './ai-gateway.service';
import { ModelRegistryService } from './model-registry.service';
import { UsageTrackingService } from './usage-tracking.service';
import { GeminiProvider } from './providers/gemini.provider';
import { GroqProvider } from './providers/groq.provider';
import { OpenRouterProvider } from './providers/openrouter.provider';
import { OllamaProvider } from './providers/ollama.provider';
import { OfflineProvider } from './providers/offline.provider';

describe('AIGatewayService', () => {
  let gateway: AIGatewayService;
  let offlineProvider: OfflineProvider;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AIGatewayService,
        ModelRegistryService,
        GeminiProvider,
        GroqProvider,
        OpenRouterProvider,
        OllamaProvider,
        OfflineProvider,
        {
          provide: UsageTrackingService,
          useValue: {
            trackUsage: jest.fn().mockResolvedValue(undefined),
            getUsageStats: jest.fn().mockResolvedValue([]),
          },
        },
      ],
    }).compile();

    gateway = module.get<AIGatewayService>(AIGatewayService);
    offlineProvider = module.get<OfflineProvider>(OfflineProvider);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });

  it('should fall back gracefully to offline standby response when no keys configured', async () => {
    const response = await gateway.generate({
      model: 'auto',
      messages: [{ role: 'user', content: 'hello' }],
    });

    expect(response).toBeDefined();
    expect(response.provider).toBe('offline');
    expect(response.content).toContain('JARVIS');
  });

  it('should stream chunks smoothly in offline mode', async () => {
    const stream = gateway.stream({
      model: 'auto',
      messages: [{ role: 'user', content: 'hello' }],
    });

    const chunks = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }

    expect(chunks.length).toBeGreaterThan(0);
    const fullText = chunks.map((c) => c.delta).join('');
    expect(fullText).toContain('JARVIS');
  });
});
