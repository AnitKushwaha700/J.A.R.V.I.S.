import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Message } from '@jarvis/shared-types';
import { Bot, User, Copy, Check } from 'lucide-react-native';

interface ChatBubbleProps {
  message: Message;
  isStreaming?: boolean;
}

export const ChatBubble = ({ message, isStreaming }: ChatBubbleProps) => {
  const isUser = message.role === 'user';
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <View className={`my-2 flex-row px-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {/* Bot Avatar */}
      {!isUser && (
        <View className="w-8 h-8 rounded-full bg-primary/20 border border-primary/40 items-center justify-center mr-2 mt-1">
          <Bot size={16} color="#38bdf8" />
        </View>
      )}

      {/* Bubble Container */}
      <View
        className={`max-w-[82%] rounded-2xl p-4 shadow-sm ${
          isUser
            ? 'bg-primary text-white rounded-tr-none'
            : 'bg-card border border-border text-slate-100 rounded-tl-none'
        }`}
      >
        {/* Model tag for assistant */}
        {!isUser && (
          <View className="flex-row items-center justify-between mb-1.5 pb-1 border-b border-border/40">
            <Text className="text-[10px] uppercase font-bold tracking-wider text-primary">
              {message.providerUsed || 'JARVIS'} {message.modelUsed ? `• ${message.modelUsed}` : ''}
            </Text>
            <TouchableOpacity onPress={handleCopy} className="p-0.5">
              {copied ? <Check size={12} color="#4ade80" /> : <Copy size={12} color="#64748b" />}
            </TouchableOpacity>
          </View>
        )}

        {/* Message text */}
        <Text
          className={`text-sm leading-6 ${
            isUser ? 'text-slate-950 font-medium' : 'text-slate-200'
          }`}
          selectable
        >
          {message.content}
          {isStreaming && (
            <Text className="text-primary font-bold animate-pulse"> ▋</Text>
          )}
        </Text>
      </View>

      {/* User Avatar */}
      {isUser && (
        <View className="w-8 h-8 rounded-full bg-primary/30 items-center justify-center ml-2 mt-1">
          <User size={16} color="#ffffff" />
        </View>
      )}
    </View>
  );
};
