import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { Code2, Send, Terminal, Copy, Check } from 'lucide-react-native';
import { useChatStore } from '../../stores/chat.store';

export default function CodeScreen() {
  const { sendMessage } = useChatStore();
  const [prompt, setPrompt] = useState('');
  const [copied, setCopied] = useState(false);

  const sampleSnippet = `// Example generated React Native hook
import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delayMs: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    return () => clearTimeout(handler);
  }, [value, delayMs]);

  return debouncedValue;
}`;

  const handleGenerate = () => {
    if (!prompt.trim()) return;
    sendMessage(`[Code Request]: ${prompt.trim()}`);
    setPrompt('');
  };

  const copyCode = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <SafeAreaView className="flex-1 bg-background px-4 py-4">
      <View className="flex-row items-center justify-between pb-3 border-b border-border mb-4">
        <View className="flex-row items-center">
          <Code2 size={24} color="#38bdf8" />
          <Text className="text-lg font-bold text-slate-100 ml-2">Coding Copilot</Text>
        </View>
        <View className="px-2.5 py-1 rounded-full bg-primary/20 border border-primary/40">
          <Text className="text-[10px] text-primary font-bold">TYPESCRIPT • PYTHON • RUST</Text>
        </View>
      </View>

      {/* Code Editor Preview Window */}
      <View className="flex-1 bg-card rounded-2xl border border-border overflow-hidden mb-4">
        {/* Editor Top Bar */}
        <View className="flex-row items-center justify-between bg-border/40 px-3 py-2 border-b border-border">
          <View className="flex-row items-center space-x-1.5">
            <View className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
            <View className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
            <View className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
            <Text className="text-xs text-secondary ml-2 font-mono">useDebounce.ts</Text>
          </View>
          <TouchableOpacity onPress={copyCode} className="p-1">
            {copied ? <Check size={14} color="#4ade80" /> : <Copy size={14} color="#94a3b8" />}
          </TouchableOpacity>
        </View>

        <ScrollView className="p-4" horizontal={false}>
          <Text className="text-xs font-mono text-emerald-400 leading-5">
            {sampleSnippet}
          </Text>
        </ScrollView>
      </View>

      {/* Prompt Input */}
      <View className="bg-card border border-border rounded-2xl p-2 flex-row items-center">
        <Terminal size={18} color="#64748b" className="ml-2" />
        <TextInput
          value={prompt}
          onChangeText={setPrompt}
          placeholder="Generate an algorithm, API, or review code..."
          placeholderTextColor="#64748b"
          className="flex-1 text-sm text-slate-100 px-3 py-2"
        />
        <TouchableOpacity
          onPress={handleGenerate}
          disabled={!prompt.trim()}
          className="w-10 h-10 rounded-xl bg-primary items-center justify-center active:scale-95"
        >
          <Send size={16} color="#090d16" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
