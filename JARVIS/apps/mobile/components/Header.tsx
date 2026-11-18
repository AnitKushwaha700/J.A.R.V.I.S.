import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Sparkles, Plus, History, Bot } from 'lucide-react-native';
import { useChatStore } from '../stores/chat.store';

interface HeaderProps {
  onOpenHistory: () => void;
  onOpenModelSelector: () => void;
}

export const Header = ({
  onOpenHistory,
  onOpenModelSelector,
}: HeaderProps) => {
  const { selectedModel, createConversation } = useChatStore();

  const getModelLabel = (model: string) => {
    if (model.includes('llama')) return 'Llama 3.3 ⚡';
    if (model.includes('gemini-2.0')) return 'Gemini 2.0 Flash 🧠';
    if (model.includes('gemini-1.5')) return 'Gemini 1.5 🚀';
    if (model.includes('deepseek')) return 'DeepSeek R1 💡';
    return 'JARVIS Auto ⚡';
  };

  return (
    <View className="flex-row items-center justify-between px-4 py-3 bg-card border-b border-border">
      {/* History button */}
      <TouchableOpacity
        onPress={onOpenHistory}
        className="p-2 rounded-lg bg-background/60 active:bg-border"
        accessibilityLabel="Conversation history"
      >
        <History size={20} color="#94a3b8" />
      </TouchableOpacity>

      {/* Model Selector Pill */}
      <TouchableOpacity
        onPress={onOpenModelSelector}
        className="flex-row items-center bg-background/80 border border-primary/30 px-3 py-1.5 rounded-full"
      >
        <Sparkles size={14} color="#38bdf8" />
        <Text className="text-primary text-xs font-semibold ml-1.5">
          {getModelLabel(selectedModel)}
        </Text>
      </TouchableOpacity>

      {/* New Chat Button */}
      <TouchableOpacity
        onPress={() => createConversation()}
        className="p-2 rounded-lg bg-primary/10 active:bg-primary/20"
        accessibilityLabel="New Chat"
      >
        <Plus size={20} color="#38bdf8" />
      </TouchableOpacity>
    </View>
  );
};
