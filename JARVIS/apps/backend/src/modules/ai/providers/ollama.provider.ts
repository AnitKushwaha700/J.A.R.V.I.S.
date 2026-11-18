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
export class OllamaProvider implements AIProvider {
  readonly name = 'ollama' as const;
  private readonly logger = new Logger(OllamaProvider.name);
  private baseUrl = 'http://localhost:11434';

  constructor() {
    this.initialize({ baseUrl: process.env.OLLAMA_BASE_URL });
  }

  async initialize(config?: ProviderConfig): Promise<void> {
    if (config?.baseUrl) this.baseUrl = config.baseUrl;
  }

  async healthCheck(): Promise<ProviderHealth> {
    const start = Date.now();
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(`${this.baseUrl}/api/tags`, { signal: controller.signal });
      clearTimeout(timeout);

      if (!res.ok) return { name: this.name, status: 'error', error: `Status ${res.status}` };
      return {
        name: this.name,
        status: 'ok',
        latencyMs: Date.now() - start,
      };
    } catch {
      return {
        name: this.name,
        status: 'unconfigured',
        error: 'Ollama is not running locally',
      };
    }
  }

  async listModels(): Promise<AIModel[]> {
    try {
      const res = await fetch(`${this.baseUrl}/api/tags`);
      if (!res.ok) return [];
      const data = (await res.json()) as { models?: Array<{ name: string; size: number }> };
      return (data.models || []).map((m) => ({
        id: `ollama/${m.name}`,
        modelId: m.name,
        displayName: `Ollama: ${m.name}`,
        provider: 'ollama',
        contextWindow: 8192,
        supportsVision: false,
        supportsTools: false,
        supportsStream: true,
        isFreeTier: true,
        description: `Local model running on your hardware (${(m.size / 1e9).toFixed(1)} GB).`,
        priority: 7,
      }));
    } catch {
      return [];
    }
  }

  async generateResponse(params: GenerateParams): Promise<AIResponse> {
    const model = params.model.replace(/^ollama\//, '') || 'llama3';
    const messages = [];
    if (params.systemPrompt) {
      messages.push({ role: 'system', content: params.systemPrompt });
    }
    for (const msg of params.messages) {
      messages.push({ role: msg.role === 'assistant' ? 'assistant' : 'user', content: msg.content });
    }

    const res = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, messages, stream: false }),
    });

    if (!res.ok) {
      throw new Error(`Ollama failed with status ${res.status}`);
    }

    const data = (await res.json()) as any;
    return {
      content: data.message?.content || '',
      provider: 'ollama',
      model,
      usage: {
        promptTokens: data.prompt_eval_count || 0,
        completionTokens: data.eval_count || 0,
        totalTokens: (data.prompt_eval_count || 0) + (data.eval_count || 0),
      },
    };
  }

  async *streamResponse(params: GenerateParams): AsyncGenerator<StreamChunk> {
    const model = params.model.replace(/^ollama\//, '') || 'llama3';
    const messages = [];
    if (params.systemPrompt) {
      messages.push({ role: 'system', content: params.systemPrompt });
    }
    for (const msg of params.messages) {
      messages.push({ role: msg.role === 'assistant' ? 'assistant' : 'user', content: msg.content });
    }

    const res = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, messages, stream: true }),
    });

    if (!res.ok || !res.body) {
      throw new Error(`Ollama streaming failed with status ${res.status}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const parsed = JSON.parse(line);
          const delta = parsed.message?.content || '';
          if (delta) {
            yield { delta, provider: 'ollama', model };
          }
        } catch {
          // ignore partial json
        }
      }
    }

    yield { delta: '', finishReason: 'stop', provider: 'ollama', model };
  }
}
