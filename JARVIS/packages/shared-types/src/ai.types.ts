export type AIProviderName = 'gemini' | 'groq' | 'openrouter' | 'ollama' | 'offline';

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
  description?: string;
  priority?: number;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  toolCalls?: ToolCall[];
  toolCallId?: string;
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, unknown>;
    required?: string[];
  };
}

export interface GenerateParams {
  model: string;
  messages: ChatMessage[];
  systemPrompt?: string;
  tools?: ToolDefinition[];
  temperature?: number;
  maxTokens?: number;
  responseFormat?: 'text' | 'json';
}

export interface StreamChunk {
  delta: string;
  finishReason?: 'stop' | 'length' | 'tool_calls';
  toolCalls?: ToolCall[];
  provider?: AIProviderName;
  model?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface AIResponse {
  content: string;
  provider: AIProviderName;
  model: string;
  finishReason?: string;
  toolCalls?: ToolCall[];
  usage: {
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

export interface UsageStats {
  provider: AIProviderName;
  requestCount: number;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export interface ProviderConfig {
  apiKey?: string;
  baseUrl?: string;
  timeoutMs?: number;
}

export interface AIProvider {
  name: AIProviderName;
  initialize(config?: ProviderConfig): Promise<void>;
  healthCheck(): Promise<ProviderHealth>;
  listModels(): Promise<AIModel[]>;
  generateResponse(params: GenerateParams): Promise<AIResponse>;
  streamResponse(params: GenerateParams): AsyncGenerator<StreamChunk>;
}
