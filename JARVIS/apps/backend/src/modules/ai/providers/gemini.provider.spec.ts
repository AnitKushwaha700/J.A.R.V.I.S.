import { GeminiProvider } from './gemini.provider';

describe('GeminiProvider', () => {
  let provider: GeminiProvider;

  beforeEach(() => {
    provider = new GeminiProvider();
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
    expect(provider.name).toBe('gemini');
  });

  it('should return unconfigured health check when no API key is provided', async () => {
    await provider.initialize({ apiKey: '' });
    const health = await provider.healthCheck();
    expect(health.status).toBe('unconfigured');
  });

  it('should list available Gemini models with capabilities', async () => {
    const models = await provider.listModels();
    expect(models.length).toBeGreaterThan(0);
    const flash = models.find((m) => m.modelId === 'gemini-3.8-flash');
    expect(flash).toBeDefined();
    expect(flash?.supportsVision).toBe(true);
    expect(flash?.supportsStream).toBe(true);
    expect(flash?.isFreeTier).toBe(true);
  });
});
