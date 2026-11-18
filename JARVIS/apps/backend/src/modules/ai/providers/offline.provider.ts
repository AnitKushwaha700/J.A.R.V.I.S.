import { Injectable } from '@nestjs/common';
import {
  AIProvider,
  AIModel,
  GenerateParams,
  StreamChunk,
  AIResponse,
  ProviderHealth,
} from '@jarvis/shared-types';

@Injectable()
export class OfflineProvider implements AIProvider {
  readonly name = 'offline' as const;

  async initialize(): Promise<void> {}

  async healthCheck(): Promise<ProviderHealth> {
    return { name: this.name, status: 'ok', latencyMs: 1 };
  }

  async listModels(): Promise<AIModel[]> {
    return [
      {
        id: 'jarvis-offline-standby',
        modelId: 'jarvis-offline-standby',
        displayName: 'JARVIS Standby Assistant (Offline)',
        provider: 'offline',
        contextWindow: 4096,
        supportsVision: false,
        supportsTools: false,
        supportsStream: true,
        isFreeTier: true,
        description: 'Built-in offline fallback assistant when cloud AI services are unconfigured.',
        priority: 99,
      },
    ];
  }

  private generateOfflineReply(prompt: string): string {
    const lower = prompt.toLowerCase();
    if (lower.includes('hello') || lower.includes('hi') || lower.includes('who are you')) {
      return (
        "Greetings! I am JARVIS, your personal AI assistant. " +
        "I am currently operating in **Standby Mode** because no external AI API key has been added yet.\n\n" +
        "To activate my full reasoning capabilities:\n" +
        "1. **Groq (Recommended & Fastest):** Get a free key at [console.groq.com/keys](https://console.groq.com/keys) and set `GROQ_API_KEY` in `.env`.\n" +
        "2. **Google Gemini (1M Context):** Get a free key at [aistudio.google.com/apikey](https://aistudio.google.com/apikey) and set `GEMINI_API_KEY` in `.env`.\n\n" +
        "Once configured, restart the server and I will be fully online!"
      );
    }

    return (
      "I received your request: \"" + prompt + "\".\n\n" +
      "Currently running in **Offline Standby Mode**. Please configure `GROQ_API_KEY` or `GEMINI_API_KEY` in `.env` to unlock live Llama 3.3 and Gemini 2.0 reasoning."
    );
  }

  async generateResponse(params: GenerateParams): Promise<AIResponse> {
    const lastUserMsg = params.messages.slice().reverse().find((m) => m.role === 'user')?.content || '';
    const content = this.generateOfflineReply(lastUserMsg);
    return {
      content,
      provider: 'offline',
      model: 'jarvis-offline-standby',
      usage: { promptTokens: 10, completionTokens: 40, totalTokens: 50 },
    };
  }

  async *streamResponse(params: GenerateParams): AsyncGenerator<StreamChunk> {
    const lastUserMsg = params.messages.slice().reverse().find((m) => m.role === 'user')?.content || '';
    const content = this.generateOfflineReply(lastUserMsg);

    // Stream word by word for natural feel
    const words = content.split(' ');
    for (const word of words) {
      yield {
        delta: word + ' ',
        provider: 'offline',
        model: 'jarvis-offline-standby',
      };
      await new Promise((r) => setTimeout(r, 20));
    }

    yield {
      delta: '',
      finishReason: 'stop',
      provider: 'offline',
      model: 'jarvis-offline-standby',
    };
  }
}
