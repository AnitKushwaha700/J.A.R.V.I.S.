import { create } from 'zustand';
import { Conversation, Message, AIModel } from '@jarvis/shared-types';
import { apiClient } from '../services/api.client';

interface ChatState {
  conversations: Conversation[];
  activeConversationId: string | null;
  messages: Message[];
  availableModels: AIModel[];
  selectedModel: string;
  isLoading: boolean;
  isStreaming: boolean;
  streamingMessageId: string | null;
  error: string | null;

  loadModels: () => Promise<void>;
  loadConversations: () => Promise<void>;
  createConversation: (title?: string, mode?: string) => Promise<string | null>;
  selectConversation: (id: string) => Promise<void>;
  deleteConversation: (id: string) => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
  setSelectedModel: (model: string) => void;
  clearError: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  activeConversationId: null,
  messages: [],
  availableModels: [],
  selectedModel: 'llama-3.3-70b-versatile',
  isLoading: false,
  isStreaming: false,
  streamingMessageId: null,
  error: null,

  clearError: () => set({ error: null }),
  setSelectedModel: (selectedModel: string) => set({ selectedModel }),

  loadModels: async () => {
    try {
      const models = await apiClient.request<AIModel[]>('models');
      set({ availableModels: models });
    } catch {}
  },

  loadConversations: async () => {
    set({ isLoading: true });
    try {
      const conversations = await apiClient.request<Conversation[]>('conversations');
      set({ conversations, isLoading: false });

      // Auto-select latest conversation if none selected
      if (!get().activeConversationId && conversations.length > 0) {
        await get().selectConversation(conversations[0].id);
      }
    } catch (err: unknown) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to load conversations',
      });
    }
  },

  createConversation: async (title = 'New Conversation', mode = 'assistant') => {
    try {
      const newConv = await apiClient.request<Conversation>('conversations', {
        method: 'POST',
        body: JSON.stringify({
          title,
          mode,
          modelId: get().selectedModel,
        }),
      });

      set((state) => ({
        conversations: [newConv, ...state.conversations],
        activeConversationId: newConv.id,
        messages: [],
      }));

      return newConv.id;
    } catch (err: unknown) {
      set({ error: err instanceof Error ? err.message : 'Failed to create conversation' });
      return null;
    }
  },

  selectConversation: async (id: string) => {
    set({ activeConversationId: id, isLoading: true, error: null });
    try {
      const conv = await apiClient.request<Conversation & { messages: Message[] }>(
        `conversations/${id}`,
      );
      set({
        activeConversationId: id,
        messages: conv.messages || [],
        isLoading: false,
      });
    } catch (err: unknown) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to open conversation',
      });
    }
  },

  deleteConversation: async (id: string) => {
    try {
      await apiClient.request(`conversations/${id}`, { method: 'DELETE' });
      set((state) => {
        const remaining = state.conversations.filter((c) => c.id !== id);
        const nextActive = state.activeConversationId === id ? (remaining[0]?.id || null) : state.activeConversationId;
        return {
          conversations: remaining,
          activeConversationId: nextActive,
          messages: state.activeConversationId === id ? [] : state.messages,
        };
      });

      if (get().activeConversationId) {
        await get().selectConversation(get().activeConversationId!);
      }
    } catch (err: unknown) {
      set({ error: err instanceof Error ? err.message : 'Failed to delete conversation' });
    }
  },

  sendMessage: async (content: string) => {
    if (!content.trim() || get().isStreaming) return;

    let convId = get().activeConversationId;
    if (!convId) {
      convId = await get().createConversation('New Conversation');
      if (!convId) return;
    }

    const tempUserMessageId = `user_${Date.now()}`;
    const tempAssistantMessageId = `asst_${Date.now()}`;

    const userMsg: Message = {
      id: tempUserMessageId,
      conversationId: convId,
      role: 'user',
      content: content.trim(),
      createdAt: new Date().toISOString(),
    };

    const initialAsstMsg: Message = {
      id: tempAssistantMessageId,
      conversationId: convId,
      role: 'assistant',
      content: '',
      providerUsed: 'groq',
      modelUsed: get().selectedModel,
      createdAt: new Date().toISOString(),
    };

    set((state) => ({
      messages: [...state.messages, userMsg, initialAsstMsg],
      isStreaming: true,
      streamingMessageId: tempAssistantMessageId,
      error: null,
    }));

    await apiClient.streamChat({
      conversationId: convId,
      content: content.trim(),
      model: get().selectedModel,
      onChunk: (delta: string) => {
        set((state) => ({
          messages: state.messages.map((m) =>
            m.id === tempAssistantMessageId
              ? { ...m, content: m.content + delta }
              : m,
          ),
        }));
      },
      onComplete: (_fullText: string) => {
        set({ isStreaming: false, streamingMessageId: null });
        // Refresh conversations to get updated titles
        get().loadConversations();
      },
      onError: (err: Error) => {
        set((state) => ({
          isStreaming: false,
          streamingMessageId: null,
          error: err.message,
          messages: state.messages.map((m) =>
            m.id === tempAssistantMessageId && !m.content
              ? { ...m, content: `Error: ${err.message}` }
              : m,
          ),
        }));
      },
    });
  },
}));
