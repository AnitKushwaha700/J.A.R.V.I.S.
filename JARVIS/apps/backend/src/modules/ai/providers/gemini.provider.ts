import { Injectable, Logger } from '@nestjs/common';
import {
  AIProvider,
  AIModel,
  GenerateParams,
  StreamChunk,
  AIResponse,
  ProviderHealth,
  ProviderConfig,
} from '@jarvis/shared-types';
import { GoogleGenAI } from '@google/genai';

@Injectable()
export class GeminiProvider implements AIProvider {
  readonly name = 'gemini' as const;
  private readonly logger = new Logger(GeminiProvider.name);
  private client: GoogleGenAI | null = null;
  private apiKey: string = '';

  constructor() {
    this.initialize({ apiKey: process.env.GEMINI_API_KEY });
  }

  async initialize(config?: ProviderConfig): Promise<void> {
    this.apiKey = config?.apiKey || process.env.GEMINI_API_KEY || '';
    if (this.apiKey) {
      try {
        this.client = new GoogleGenAI({ apiKey: this.apiKey });
        this.logger.log('GeminiProvider initialized successfully.');
      } catch (err: unknown) {
        this.logger.warn(`Failed to initialize Gemini client: ${err instanceof Error ? err.message : String(err)}`);
        this.client = null;
      }
    } else {
      this.client = null;
    }
  }

  isConfigured(): boolean {
    return Boolean(this.client && this.apiKey);
  }

  async healthCheck(): Promise<ProviderHealth> {
    if (!this.isConfigured()) {
      return { name: this.name, status: 'unconfigured' };
    }
    const start = Date.now();
    try {
      // Light check with 3s timeout
      const pingPromise = this.client!.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: 'ping',
      });
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Gemini ping timeout (3s)')), 3000),
      );
      await Promise.race([pingPromise, timeoutPromise]);
      return {
        name: this.name,
        status: 'ok',
        latencyMs: Date.now() - start,
      };
    } catch (err: unknown) {
      return {
        name: this.name,
        status: 'error',
        error: err instanceof Error ? err.message : 'Unknown Gemini error',
      };
    }
  }

  async listModels(): Promise<AIModel[]> {
    return [
      {
        id: 'gemini-3.8-flash',
        modelId: 'gemini-3.8-flash',
        displayName: 'Gemini 3.8 Flash (Latest Flagship)',
        provider: 'gemini',
        contextWindow: 1048576,
        supportsVision: true,
        supportsTools: true,
        supportsStream: true,
        isFreeTier: true,
        description: 'Google DeepMind flagship multimodal model, 1M token context, highly capable.',
        priority: 4,
      },
    ];
  }

  async generateResponse(params: GenerateParams): Promise<AIResponse> {
    if (!this.isConfigured()) {
      throw new Error('GeminiProvider is not configured with an API key.');
    }

    const modelName = params.model || 'gemini-3.8-flash';
    const contents = params.messages.map((m) => `${m.role.toUpperCase()}: ${m.content}`).join('\n\n');

    const config: Record<string, unknown> = {};
    if (params.systemPrompt) {
      config.systemInstruction = params.systemPrompt;
    }
    if (params.temperature !== undefined) {
      config.temperature = params.temperature;
    }
    if (params.maxTokens !== undefined) {
      config.maxOutputTokens = params.maxTokens;
    }

    const response = await this.client!.models.generateContent({
      model: modelName,
      contents,
      config,
    });

    const text = typeof response.text === 'string'
      ? response.text
      : (typeof (response as any).text === 'function' ? (response as any).text() : '');

    return {
      content: text || '',
      provider: 'gemini',
      model: modelName,
      usage: {
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
      },
    };
  }

  async *streamResponse(params: GenerateParams): AsyncGenerator<StreamChunk> {
    if (!this.isConfigured()) {
      throw new Error('GeminiProvider is not configured with an API key.');
    }

    const modelName = params.model || 'gemini-3.8-flash';
    const contents = params.messages.map((m) => `${m.role.toUpperCase()}: ${m.content}`).join('\n\n');

    const config: Record<string, unknown> = {};
    if (params.systemPrompt) {
      config.systemInstruction = params.systemPrompt;
    }
    if (params.temperature !== undefined) {
      config.temperature = params.temperature;
    }
    if (params.maxTokens !== undefined) {
      config.maxOutputTokens = params.maxTokens;
    }

    const stream = await this.client!.models.generateContentStream({
      model: modelName,
      contents,
      config,
    });

    for await (const chunk of stream) {
      const text = typeof chunk.text === 'string'
        ? chunk.text
        : (typeof (chunk as any).text === 'function' ? (chunk as any).text() : '');

      if (text) {
        yield {
          delta: text,
          provider: 'gemini',
          model: modelName,
        };
      }
    }

    yield {
      delta: '',
      finishReason: 'stop',
      provider: 'gemini',
      model: modelName,
    };
  }

  async analyzeImage(imageBuffer: Buffer, mimeType: string, prompt: string): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error('GeminiProvider is not configured with an API key.');
    }
    const base64Data = imageBuffer.toString('base64');
    const response = await this.client!.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt || 'Analyze this image in detail and describe what you see.' },
            {
              inlineData: {
                data: base64Data,
                mimeType,
              },
            },
          ],
        } as any,
      ],
    });

    return typeof response.text === 'string'
      ? response.text
      : (typeof (response as any).text === 'function' ? (response as any).text() : '');
  }
}
