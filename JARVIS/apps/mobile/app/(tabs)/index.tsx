import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Header } from '../../components/Header';
import { ChatBubble } from '../../components/ChatBubble';
import { MessageInput } from '../../components/MessageInput';
import { ModelSelectorModal } from '../../components/ModelSelectorModal';
import { useChatStore } from '../../stores/chat.store';
import { Bot, Sparkles, Terminal, FileCode, CheckCircle2 } from 'lucide-react-native';

export default function ChatScreen() {
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);
  const [modelModalVisible, setModelModalVisible] = useState(false);

  const {
    messages,
    isStreaming,
    streamingMessageId,
    sendMessage,
    loadConversations,
    loadModels,
  } = useChatStore();

  useEffect(() => {
    loadConversations();
    loadModels();
  }, []);

  useEffect(() => {
    // Auto-scroll on new message or during streaming
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages, isStreaming]);

  const handleSend = (text: string) => {
    sendMessage(text);
  };

  const handleQuickPrompt = (prompt: string) => {
    sendMessage(prompt);
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Top Bar */}
      <Header
        onOpenHistory={() => router.push('/conversations')}
        onOpenModelSelector={() => setModelModalVisible(true)}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Messages Feed */}
        <ScrollView
          ref={scrollViewRef}
          className="flex-1 px-1 py-2"
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 16 }}
        >
          {messages.length === 0 ? (
            /* Empty State */
            <View className="flex-1 items-center justify-center px-6 py-12">
              <View className="w-16 h-16 rounded-3xl bg-primary/10 border border-primary/30 items-center justify-center mb-4">
                <Bot size={32} color="#38bdf8" />
              </View>
              <Text className="text-xl font-bold text-slate-100 text-center">
                How may I assist you, sir?
              </Text>
              <Text className="text-xs text-secondary text-center mt-1.5 mb-8 max-w-[280px]">
                I can write code, answer questions, research topics, or speak with you in realtime.
              </Text>

              {/* Quick Prompt Cards */}
              <View className="w-full space-y-2.5">
                <TouchableOpacity
                  onPress={() => handleQuickPrompt('Give me a brief summary of what you can do.')}
                  className="flex-row items-center p-3.5 rounded-xl bg-card border border-border active:border-primary/50"
                >
                  <Sparkles size={18} color="#38bdf8" />
                  <Text className="text-xs font-medium text-slate-200 ml-3 flex-1">
                    What can you do? (Overview)
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleQuickPrompt('Write a clean TypeScript React Native custom hook for debounce.')}
                  className="flex-row items-center p-3.5 rounded-xl bg-card border border-border active:border-primary/50"
                >
                  <FileCode size={18} color="#a855f7" />
                  <Text className="text-xs font-medium text-slate-200 ml-3 flex-1">
                    Write a clean React Native hook for debounce
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleQuickPrompt('Simulate a Senior Full-Stack developer mock interview question for me.')}
                  className="flex-row items-center p-3.5 rounded-xl bg-card border border-border active:border-primary/50"
                >
                  <Terminal size={18} color="#34d399" />
                  <Text className="text-xs font-medium text-slate-200 ml-3 flex-1">
                    Start a technical mock interview
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            /* Message List */
            messages.map((msg) => (
              <ChatBubble
                key={msg.id}
                message={msg}
                isStreaming={isStreaming && msg.id === streamingMessageId}
              />
            ))
          )}
        </ScrollView>

        {/* Input Bar */}
        <MessageInput
          onSend={handleSend}
          onVoicePress={() => router.push('/(tabs)/voice')}
          isStreaming={isStreaming}
        />
      </KeyboardAvoidingView>

      {/* Model Selection Modal */}
      <ModelSelectorModal
        visible={modelModalVisible}
        onClose={() => setModelModalVisible(false)}
      />
    </SafeAreaView>
  );
}
