export interface Conversation {
  id: string;
  title: string;
  mode: string;
  modelId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  providerUsed?: string;
  modelUsed?: string;
  createdAt: string;
}
