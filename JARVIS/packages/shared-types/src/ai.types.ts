export type AIProviderName = 'gemini' | 'groq' | 'openrouter' | 'ollama';

export interface AIModel {
  id: string;
  modelId: string;
  displayName: string;
  provider: AIProviderName;
  contextWindow: number;
  supportsVision: boolean;
  supportsTools: boolean;
  supportsStream: boolean;
  isFreeTier: boolean;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  toolCalls?: ToolCall[];
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface StreamChunk {
  delta: string;
  finishReason?: 'stop' | 'length' | 'tool_calls';
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface ProviderHealth {
  name: AIProviderName;
  status: 'ok' | 'error' | 'unconfigured';
  latencyMs?: number;
  error?: string;
}
