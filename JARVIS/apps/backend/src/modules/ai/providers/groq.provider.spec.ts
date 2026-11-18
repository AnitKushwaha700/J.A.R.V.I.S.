import { GroqProvider } from './groq.provider';

describe('GroqProvider', () => {
  let provider: GroqProvider;

  beforeEach(() => {
    provider = new GroqProvider();
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
    expect(provider.name).toBe('groq');
  });

  it('should return unconfigured health check when no API key is provided', async () => {
    await provider.initialize({ apiKey: '' });
    const health = await provider.healthCheck();
    expect(health.status).toBe('unconfigured');
  });

  it('should list available Groq models with high-speed capabilities', async () => {
    const models = await provider.listModels();
    expect(models.length).toBeGreaterThan(0);
    const llama = models.find((m) => m.modelId === 'llama-3.3-70b-versatile');
    expect(llama).toBeDefined();
    expect(llama?.supportsStream).toBe(true);
    expect(llama?.isFreeTier).toBe(true);
    expect(llama?.priority).toBe(1);
  });
});
