import { Injectable, Logger } from '@nestjs/common';
import { AIModel, AIProvider, ProviderHealth } from '@jarvis/shared-types';
import { GeminiProvider } from './providers/gemini.provider';
import { GroqProvider } from './providers/groq.provider';
import { OpenRouterProvider } from './providers/openrouter.provider';
import { OllamaProvider } from './providers/ollama.provider';
import { OfflineProvider } from './providers/offline.provider';

@Injectable()
export class ModelRegistryService {
  private readonly logger = new Logger(ModelRegistryService.name);
  private providers: Map<string, AIProvider> = new Map();

  constructor(
    private readonly gemini: GeminiProvider,
    private readonly groq: GroqProvider,
    private readonly openRouter: OpenRouterProvider,
    private readonly ollama: OllamaProvider,
    private readonly offline: OfflineProvider,
  ) {
    this.providers.set('gemini', this.gemini);
    this.providers.set('groq', this.groq);
    this.providers.set('openrouter', this.openRouter);
    this.providers.set('ollama', this.ollama);
    this.providers.set('offline', this.offline);
  }

  getProvider(name: string): AIProvider | undefined {
    return this.providers.get(name);
  }

  async getAllModels(): Promise<Array<AIModel & { health: ProviderHealth }>> {
    const allModels: Array<AIModel & { health: ProviderHealth }> = [];

    for (const [, provider] of this.providers) {
      try {
        const health = await provider.healthCheck();
        const models = await provider.listModels();
        for (const m of models) {
          allModels.push({
            ...m,
            health,
          });
        }
      } catch (err: unknown) {
        this.logger.warn(`Failed to list models for provider ${provider.name}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    // Sort by priority (lowest number = highest priority)
    return allModels.sort((a, b) => (a.priority ?? 99) - (b.priority ?? 99));
  }

  async getHealthSummary(): Promise<Record<string, ProviderHealth>> {
    const summary: Record<string, ProviderHealth> = {};
    for (const [name, provider] of this.providers) {
      try {
        summary[name] = await provider.healthCheck();
      } catch (err: unknown) {
        summary[name] = {
          name: name as any,
          status: 'error',
          error: err instanceof Error ? err.message : 'Health check failed',
        };
      }
    }
    return summary;
  }

  resolveProviderForModel(modelId?: string): { provider: AIProvider; model: string } {
    if (!modelId || modelId === 'auto') {
      return this.getDefaultProviderAndModel();
    }

    if (modelId.startsWith('gemini')) {
      if (this.gemini.isConfigured()) return { provider: this.gemini, model: modelId };
    } else if (modelId.startsWith('llama') || modelId.startsWith('mixtral')) {
      if (this.groq.isConfigured()) return { provider: this.groq, model: modelId };
    } else if (modelId.startsWith('deepseek') || modelId.includes(':free')) {
      if (this.openRouter.isConfigured()) return { provider: this.openRouter, model: modelId };
    } else if (modelId.startsWith('ollama/')) {
      return { provider: this.ollama, model: modelId.replace('ollama/', '') };
    }

    // If specific requested model's provider is not configured, fall back to default
    return this.getDefaultProviderAndModel();
  }

  getDefaultProviderAndModel(): { provider: AIProvider; model: string } {
    if (this.groq.isConfigured()) {
      return { provider: this.groq, model: 'llama-3.3-70b-versatile' };
    }
    if (this.gemini.isConfigured()) {
      return { provider: this.gemini, model: 'gemini-2.0-flash' };
    }
    if (this.openRouter.isConfigured()) {
      return { provider: this.openRouter, model: 'deepseek/deepseek-r1:free' };
    }
    return { provider: this.offline, model: 'jarvis-offline-standby' };
  }
}
