import { Injectable, Logger } from '@nestjs/common';
import { GenerateParams, StreamChunk, AIResponse, AIProvider } from '@jarvis/shared-types';
import { ModelRegistryService } from './model-registry.service';
import { UsageTrackingService } from './usage-tracking.service';
import { GeminiProvider } from './providers/gemini.provider';

@Injectable()
export class AIGatewayService {
  private readonly logger = new Logger(AIGatewayService.name);

  constructor(
    private readonly registry: ModelRegistryService,
    private readonly usageTracker: UsageTrackingService,
    private readonly gemini: GeminiProvider,
  ) {}

  private getFallbackChain(preferredProviderName: string): AIProvider[] {
    const chain: AIProvider[] = [];
    const preferred = this.registry.getProvider(preferredProviderName);
    if (preferred) chain.push(preferred);

    const providerNames = ['groq', 'gemini', 'openrouter', 'ollama', 'offline'];
    for (const name of providerNames) {
      if (name !== preferredProviderName) {
        const p = this.registry.getProvider(name);
        if (p) chain.push(p);
      }
    }
    return chain;
  }

  async generate(params: GenerateParams, userId?: string): Promise<AIResponse> {
    const { provider: initialProvider, model: initialModel } = this.registry.resolveProviderForModel(params.model);
    const fallbackChain = this.getFallbackChain(initialProvider.name);

    let lastError: Error | null = null;

    for (const provider of fallbackChain) {
      try {
        const targetModel = provider.name === initialProvider.name ? initialModel : (
          provider.name === 'gemini' ? 'gemini-2.0-flash' :
          provider.name === 'groq' ? 'llama-3.3-70b-versatile' :
          provider.name === 'openrouter' ? 'deepseek/deepseek-r1:free' :
          'jarvis-offline-standby'
        );

        this.logger.log(`Attempting generation with provider: ${provider.name} (${targetModel})`);
        const response = await provider.generateResponse({
          ...params,
          model: targetModel,
        });

        if (userId) {
          await this.usageTracker.trackUsage({
            userId,
            providerName: response.provider,
            promptTokens: response.usage.promptTokens,
            completionTokens: response.usage.completionTokens,
            totalTokens: response.usage.totalTokens,
          });
        }

        return response;
      } catch (err: unknown) {
        lastError = err instanceof Error ? err : new Error(String(err));
        this.logger.warn(`Provider ${provider.name} failed: ${lastError.message}. Falling back...`);
      }
    }

    throw lastError || new Error('All AI providers failed.');
  }

  async *stream(params: GenerateParams, userId?: string): AsyncGenerator<StreamChunk> {
    const { provider: initialProvider, model: initialModel } = this.registry.resolveProviderForModel(params.model);
    const fallbackChain = this.getFallbackChain(initialProvider.name);

    let streamStarted = false;
    let successfulProvider = initialProvider.name;
    let accumulatedDelta = '';

    for (const provider of fallbackChain) {
      try {
        const targetModel = provider.name === initialProvider.name ? initialModel : (
          provider.name === 'gemini' ? 'gemini-2.0-flash' :
          provider.name === 'groq' ? 'llama-3.3-70b-versatile' :
          provider.name === 'openrouter' ? 'deepseek/deepseek-r1:free' :
          'jarvis-offline-standby'
        );

        this.logger.log(`Streaming with provider: ${provider.name} (${targetModel})`);
        const generator = provider.streamResponse({
          ...params,
          model: targetModel,
        });

        for await (const chunk of generator) {
          streamStarted = true;
          successfulProvider = chunk.provider || provider.name;
          accumulatedDelta += chunk.delta;
          yield chunk;
        }

        // If successfully finished stream, break fallback loop
        if (streamStarted) {
          if (userId && accumulatedDelta) {
            const approxTokens = Math.ceil(accumulatedDelta.length / 4);
            await this.usageTracker.trackUsage({
              userId,
              providerName: successfulProvider,
              promptTokens: 50,
              completionTokens: approxTokens,
              totalTokens: 50 + approxTokens,
            });
          }
          return;
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        this.logger.warn(`Provider ${provider.name} stream failed: ${msg}. Attempting fallback...`);

        // If chunks were already emitted to client, cannot failover mid-stream without corrupting output
        if (streamStarted) {
          yield {
            delta: `\n\n[System note: Stream interrupted: ${msg}]`,
            finishReason: 'stop',
            provider: provider.name,
          };
          return;
        }
      }
    }

    yield {
      delta: 'I apologize, but all AI providers are currently unavailable. Please verify your internet connection and API keys.',
      finishReason: 'stop',
      provider: 'offline',
    };
  }

  async analyzeImage(buffer: Buffer, mimeType: string, prompt: string, userId?: string): Promise<string> {
    if (!this.gemini.isConfigured()) {
      throw new Error('Gemini API is required for multimodal vision analysis. Please configure GEMINI_API_KEY.');
    }
    const result = await this.gemini.analyzeImage(buffer, mimeType, prompt);
    if (userId) {
      await this.usageTracker.trackUsage({
        userId,
        providerName: 'gemini',
        promptTokens: 256,
        completionTokens: Math.ceil(result.length / 4),
        totalTokens: 256 + Math.ceil(result.length / 4),
      });
    }
    return result;
  }
}
