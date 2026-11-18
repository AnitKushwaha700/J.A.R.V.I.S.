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

@Injectable()
export class OpenRouterProvider implements AIProvider {
  readonly name = 'openrouter' as const;
  private readonly logger = new Logger(OpenRouterProvider.name);
  private apiKey: string = '';
  private baseUrl = 'https://openrouter.ai/api/v1';

  constructor() {
    this.initialize({ apiKey: process.env.OPENROUTER_API_KEY });
  }

  async initialize(config?: ProviderConfig): Promise<void> {
    this.apiKey = config?.apiKey || process.env.OPENROUTER_API_KEY || '';
    if (config?.baseUrl) this.baseUrl = config.baseUrl;
    if (this.apiKey) {
      this.logger.log('OpenRouterProvider initialized.');
    }
  }

  isConfigured(): boolean {
    return Boolean(this.apiKey);
  }

  async healthCheck(): Promise<ProviderHealth> {
    if (!this.isConfigured()) {
      return { name: this.name, status: 'unconfigured' };
    }
    const start = Date.now();
    try {
      const res = await fetch(`${this.baseUrl}/models`, {
        headers: { Authorization: `Bearer ${this.apiKey}` },
      });
      if (!res.ok) throw new Error(`OpenRouter returned status ${res.status}`);
      return {
        name: this.name,
        status: 'ok',
        latencyMs: Date.now() - start,
      };
    } catch (err: unknown) {
      return {
        name: this.name,
        status: 'error',
        error: err instanceof Error ? err.message : 'Unknown OpenRouter error',
      };
    }
  }

  async listModels(): Promise<AIModel[]> {
    return [
      {
        id: 'deepseek/deepseek-r1:free',
        modelId: 'deepseek/deepseek-r1:free',
        displayName: 'DeepSeek R1 (Free Reasoning)',
        provider: 'openrouter',
        contextWindow: 65536,
        supportsVision: false,
        supportsTools: false,
        supportsStream: true,
        isFreeTier: true,
        description: 'Advanced open reasoning model through OpenRouter free tier.',
        priority: 5,
      },
      {
        id: 'meta-llama/llama-3.3-70b-instruct:free',
        modelId: 'meta-llama/llama-3.3-70b-instruct:free',
        displayName: 'Llama 3.3 70B (OpenRouter Free)',
        provider: 'openrouter',
        contextWindow: 131072,
        supportsVision: false,
        supportsTools: true,
        supportsStream: true,
        isFreeTier: true,
        description: 'Llama 3.3 70B instruction-tuned model via OpenRouter.',
        priority: 6,
      },
    ];
  }

  async generateResponse(params: GenerateParams): Promise<AIResponse> {
    if (!this.isConfigured()) {
      throw new Error('OpenRouterProvider is not configured with an API key.');
    }

    const model = params.model || 'deepseek/deepseek-r1:free';
    const messages = [];
    if (params.systemPrompt) {
      messages.push({ role: 'system', content: params.systemPrompt });
    }
    for (const msg of params.messages) {
      messages.push({ role: msg.role === 'assistant' ? 'assistant' : 'user', content: msg.content });
    }

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
        'HTTP-Referer': 'https://talkme-ai.local',
        'X-Title': 'JARVIS Personal Assistant',
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: params.temperature ?? 0.7,
        max_tokens: params.maxTokens ?? 2048,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouter error (${response.status}): ${errorText}`);
    }

    const data = (await response.json()) as any;
    const content = data.choices?.[0]?.message?.content || '';

    return {
      content,
      provider: 'openrouter',
      model,
      usage: {
        promptTokens: data.usage?.prompt_tokens || 0,
        completionTokens: data.usage?.completion_tokens || 0,
        totalTokens: data.usage?.total_tokens || 0,
      },
    };
  }

  async *streamResponse(params: GenerateParams): AsyncGenerator<StreamChunk> {
    if (!this.isConfigured()) {
      throw new Error('OpenRouterProvider is not configured with an API key.');
    }

    const model = params.model || 'deepseek/deepseek-r1:free';
    const messages = [];
    if (params.systemPrompt) {
      messages.push({ role: 'system', content: params.systemPrompt });
    }
    for (const msg of params.messages) {
      messages.push({ role: msg.role === 'assistant' ? 'assistant' : 'user', content: msg.content });
    }

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
        'HTTP-Referer': 'https://talkme-ai.local',
        'X-Title': 'JARVIS Personal Assistant',
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: params.temperature ?? 0.7,
        max_tokens: params.maxTokens ?? 2048,
        stream: true,
      }),
    });

    if (!response.ok || !response.body) {
      const errorText = await response.text();
      throw new Error(`OpenRouter streaming error (${response.status}): ${errorText}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed === 'data: [DONE]') continue;
        if (trimmed.startsWith('data: ')) {
          try {
            const parsed = JSON.parse(trimmed.slice(6));
            const delta = parsed.choices?.[0]?.delta?.content || '';
            if (delta) {
              yield { delta, provider: 'openrouter', model };
            }
          } catch {
            // Ignore parse errors on partial chunks
          }
        }
      }
    }

    yield { delta: '', finishReason: 'stop', provider: 'openrouter', model };
  }
}
