import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Plus, Trash2, MessageSquare, ArrowLeft } from 'lucide-react-native';
import { useChatStore } from '../stores/chat.store';

export default function ConversationsScreen() {
  const router = useRouter();
  const {
    conversations,
    activeConversationId,
    selectConversation,
    deleteConversation,
    createConversation,
  } = useChatStore();

  const handleSelect = async (id: string) => {
    await selectConversation(id);
    router.back();
  };

  const handleNew = async () => {
    await createConversation();
    router.back();
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Top Bar */}
      <View className="flex-row items-center justify-between px-5 py-4 border-b border-border bg-card">
        <TouchableOpacity onPress={() => router.back()} className="p-1">
          <ArrowLeft size={22} color="#94a3b8" />
        </TouchableOpacity>
        <Text className="text-base font-bold text-slate-100">
          Chat History
        </Text>
        <TouchableOpacity
          onPress={handleNew}
          className="p-1.5 rounded-lg bg-primary/20 active:bg-primary/30"
        >
          <Plus size={20} color="#38bdf8" />
        </TouchableOpacity>
      </View>

      {/* List */}
      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={
          <View className="items-center justify-center py-20">
            <MessageSquare size={36} color="#64748b" />
            <Text className="text-sm text-secondary mt-3">No conversations yet</Text>
          </View>
        }
        renderItem={({ item }) => {
          const isActive = item.id === activeConversationId;
          return (
            <TouchableOpacity
              onPress={() => handleSelect(item.id)}
              className={`flex-row items-center justify-between p-4 mb-2.5 rounded-xl border ${
                isActive
                  ? 'bg-primary/10 border-primary'
                  : 'bg-card border-border active:bg-border/40'
              }`}
            >
              <View className="flex-1 pr-3">
                <Text
                  className={`text-sm font-semibold ${
                    isActive ? 'text-primary' : 'text-slate-100'
                  }`}
                  numberOfLines={1}
                >
                  {item.title}
                </Text>
                <Text className="text-[11px] text-secondary mt-1">
                  {new Date(item.updatedAt).toLocaleDateString()} • {item.mode || 'assistant'}
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => deleteConversation(item.id)}
                className="p-2 rounded-lg bg-background active:bg-red-500/20"
              >
                <Trash2 size={16} color="#ef4444" />
              </TouchableOpacity>
            </TouchableOpacity>
          );
        }}
      />
    </SafeAreaView>
  );
}
