import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Message } from '@jarvis/shared-types';
import { Bot, User, Copy, Check } from 'lucide-react-native';
import { CodeBlockView } from './CodeBlockView';

interface ChatBubbleProps {
  message: Message;
  isStreaming?: boolean;
}

export const ChatBubble = ({ message, isStreaming }: ChatBubbleProps) => {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderContent = () => {
    if (isUser || !message.content.includes('```')) {
      return (
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
      );
    }

    // Split markdown code blocks
    const segments = message.content.split(/(```[\s\S]*?```)/g);

    return (
      <View>
        {segments.map((seg, idx) => {
          if (seg.startsWith('```') && seg.endsWith('```')) {
            const lines = seg.slice(3, -3).trim().split('\n');
            const firstLine = lines[0].trim();
            const hasLang = /^[a-zA-Z0-9_-]+$/.test(firstLine);
            const lang = hasLang ? firstLine : 'typescript';
            const code = hasLang ? lines.slice(1).join('\n') : lines.join('\n');

            return (
              <CodeBlockView
                key={idx}
                code={code}
                language={lang}
                allowExecution={true}
              />
            );
          }

          if (!seg.trim()) return null;

          return (
            <Text
              key={idx}
              className="text-sm text-slate-200 leading-6 my-1"
              selectable
            >
              {seg}
            </Text>
          );
        })}
        {isStreaming && (
          <Text className="text-primary font-bold animate-pulse"> ▋</Text>
        )}
      </View>
    );
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
        className={`max-w-[88%] rounded-2xl p-4 shadow-sm ${
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

        {/* Message Content */}
        {renderContent()}
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
