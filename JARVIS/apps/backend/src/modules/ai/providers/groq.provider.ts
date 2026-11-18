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
import Groq from 'groq-sdk';

@Injectable()
export class GroqProvider implements AIProvider {
  readonly name = 'groq' as const;
  private readonly logger = new Logger(GroqProvider.name);
  private client: Groq | null = null;
  private apiKey: string = '';

  constructor() {
    this.initialize({ apiKey: process.env.GROQ_API_KEY });
  }

  async initialize(config?: ProviderConfig): Promise<void> {
    this.apiKey = config?.apiKey || process.env.GROQ_API_KEY || '';
    if (this.apiKey) {
      try {
        this.client = new Groq({ apiKey: this.apiKey });
        this.logger.log('GroqProvider initialized successfully.');
      } catch (err: unknown) {
        this.logger.warn(`Failed to initialize Groq client: ${err instanceof Error ? err.message : String(err)}`);
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
      await this.client!.models.list();
      return {
        name: this.name,
        status: 'ok',
        latencyMs: Date.now() - start,
      };
    } catch (err: unknown) {
      return {
        name: this.name,
        status: 'error',
        error: err instanceof Error ? err.message : 'Unknown Groq error',
      };
    }
  }

  async listModels(): Promise<AIModel[]> {
    return [
      {
        id: 'llama-3.3-70b-versatile',
        modelId: 'llama-3.3-70b-versatile',
        displayName: 'Llama 3.3 70B Versatile (Ultra Fast)',
        provider: 'groq',
        contextWindow: 128000,
        supportsVision: false,
        supportsTools: true,
        supportsStream: true,
        isFreeTier: true,
        description: 'Industry-leading speed (sub-250ms), 128K context, ideal for conversational chat.',
        priority: 1,
      },
      {
        id: 'llama-3.1-8b-instant',
        modelId: 'llama-3.1-8b-instant',
        displayName: 'Llama 3.1 8B Instant',
        provider: 'groq',
        contextWindow: 128000,
        supportsVision: false,
        supportsTools: true,
        supportsStream: true,
        isFreeTier: true,
        description: 'Blazing fast lightweight model for quick summaries and tasks.',
        priority: 3,
      },
    ];
  }

  private buildMessages(params: GenerateParams) {
    const formattedMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [];

    if (params.systemPrompt) {
      formattedMessages.push({ role: 'system', content: params.systemPrompt });
    }

    for (const msg of params.messages) {
      const role = msg.role === 'assistant' ? 'assistant' : (msg.role === 'system' ? 'system' : 'user');
      formattedMessages.push({ role, content: msg.content });
    }

    return formattedMessages;
  }

  async generateResponse(params: GenerateParams): Promise<AIResponse> {
    if (!this.isConfigured()) {
      throw new Error('GroqProvider is not configured with an API key.');
    }

    const modelName = params.model || 'llama-3.3-70b-versatile';
    const messages = this.buildMessages(params);

    const completion = await this.client!.chat.completions.create({
      model: modelName,
      messages,
      temperature: params.temperature ?? 0.7,
      max_tokens: params.maxTokens ?? 2048,
    });

    const choice = completion.choices[0];
    const content = choice?.message?.content || '';
    const usage = completion.usage;

    return {
      content,
      provider: 'groq',
      model: modelName,
      finishReason: choice?.finish_reason || 'stop',
      usage: {
        promptTokens: usage?.prompt_tokens || 0,
        completionTokens: usage?.completion_tokens || 0,
        totalTokens: usage?.total_tokens || 0,
      },
    };
  }

  async *streamResponse(params: GenerateParams): AsyncGenerator<StreamChunk> {
    if (!this.isConfigured()) {
      throw new Error('GroqProvider is not configured with an API key.');
    }

    const modelName = params.model || 'llama-3.3-70b-versatile';
    const messages = this.buildMessages(params);

    const stream = await this.client!.chat.completions.create({
      model: modelName,
      messages,
      temperature: params.temperature ?? 0.7,
      max_tokens: params.maxTokens ?? 2048,
      stream: true,
    });

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content || '';
      if (delta) {
        yield {
          delta,
          provider: 'groq',
          model: modelName,
        };
      }
    }

    yield {
      delta: '',
      finishReason: 'stop',
      provider: 'groq',
      model: modelName,
    };
  }
}
