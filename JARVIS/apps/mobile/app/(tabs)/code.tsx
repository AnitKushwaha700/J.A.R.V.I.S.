import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Code2,
  Send,
  Terminal,
  Sparkles,
  FileCode,
  Layers,
  CheckCircle2,
} from 'lucide-react-native';
import { apiClient } from '../../services/api.client';
import { CodeBlockView } from '../../components/CodeBlockView';
import { CodeLanguage, CodeAssistantMode, ProjectFile } from '@jarvis/shared-types';

export default function CodeScreen() {
  const [prompt, setPrompt] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<CodeLanguage>('typescript');
  const [selectedMode, setSelectedMode] = useState<CodeAssistantMode>('generate');
  const [loading, setLoading] = useState(false);
  const [activeFileIndex, setActiveFileIndex] = useState(0);

  // Default initial project files
  const [files, setFiles] = useState<ProjectFile[]>([
    {
      path: 'useDebounce.ts',
      language: 'typescript',
      content: `// React Native Debounce Hook
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
}

// Test in sandbox
console.log('Hook useDebounce initialized successfully.');`,
    },
    {
      path: 'useDebounce.test.ts',
      language: 'typescript',
      content: `// Unit Test Example
const testValue = 'search-query';
console.log('Testing useDebounce with value:', testValue);
console.log('All tests passed: 100% assertions valid.');`,
    },
  ]);

  const [explanation, setExplanation] = useState<string>(
    'This hook delays updating debouncedValue until delayMs milliseconds have elapsed since the last change. Ideal for autocomplete inputs and network efficiency.',
  );

  const modes: { id: CodeAssistantMode; label: string }[] = [
    { id: 'generate', label: 'Generate ⚡' },
    { id: 'explain', label: 'Explain 🧠' },
    { id: 'debug', label: 'Debug 🐛' },
    { id: 'refactor', label: 'Refactor 🛠️' },
    { id: 'test', label: 'Test 🧪' },
  ];

  const languages: CodeLanguage[] = [
    'typescript',
    'python',
    'javascript',
    'sql',
    'rust',
    'go',
  ];

  const quickPrompts = [
    'Write a TypeScript LRU Cache with O(1) get & put',
    'Create a FastAPI JWT authentication router with Argon2',
    'Generate an isolated worker thread pool in Node.js',
    'Write a Redux Toolkit slice for offline message queue',
  ];

  const handleGenerate = async (customPrompt?: string) => {
    const p = (customPrompt || prompt).trim();
    if (!p) return;

    setLoading(true);
    try {
      const activeFile = files[activeFileIndex];
      const result = await apiClient.generateCode({
        prompt: p,
        language: selectedLanguage,
        mode: selectedMode,
        contextCode: activeFile ? activeFile.content : undefined,
        runTest: true,
      });

      const newFilename = `${selectedMode}_${selectedLanguage === 'python' ? 'script.py' : 'main.ts'}`;
      setFiles([
        {
          path: newFilename,
          content: result.code,
          language: result.language,
        },
        ...files,
      ]);
      setActiveFileIndex(0);
      setExplanation(result.explanation);
      setPrompt('');
    } catch (err: unknown) {
      setExplanation(`Error: ${err instanceof Error ? err.message : 'Generation failed'}`);
    } finally {
      setLoading(false);
    }
  };

  const currentFile = files[activeFileIndex] || files[0];

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        {/* Header */}
        <View className="px-4 py-3 bg-card border-b border-border flex-row items-center justify-between">
          <View className="flex-row items-center">
            <View className="w-8 h-8 rounded-lg bg-primary/20 items-center justify-center mr-2.5">
              <Code2 size={18} color="#38bdf8" />
            </View>
            <View>
              <Text className="text-white font-bold text-base">Coding Copilot & Sandbox</Text>
              <Text className="text-slate-400 text-xs">Isolated execution & multi-language AI</Text>
            </View>
          </View>
          <View className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex-row items-center">
            <CheckCircle2 size={10} color="#4ade80" />
            <Text className="text-[10px] text-emerald-400 font-bold ml-1">Sandbox Live</Text>
          </View>
        </View>

        {/* Toolbar: Mode & Language Selectors */}
        <View className="bg-card/50 border-b border-border px-3 py-2">
          {/* Mode pills */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row mb-2">
            {modes.map((m) => {
              const active = selectedMode === m.id;
              return (
                <TouchableOpacity
                  key={m.id}
                  onPress={() => setSelectedMode(m.id)}
                  className={`px-3 py-1 rounded-full mr-1.5 border ${
                    active
                      ? 'bg-primary/20 border-primary'
                      : 'bg-background/80 border-border/80'
                  }`}
                >
                  <Text
                    className={`text-xs font-semibold ${
                      active ? 'text-primary' : 'text-slate-400'
                    }`}
                  >
                    {m.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Language pills */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
            {languages.map((l) => {
              const active = selectedLanguage === l;
              return (
                <TouchableOpacity
                  key={l}
                  onPress={() => setSelectedLanguage(l)}
                  className={`px-2.5 py-0.5 rounded-md mr-1.5 border ${
                    active
                      ? 'bg-slate-800 border-primary text-primary'
                      : 'bg-transparent border-transparent text-slate-500'
                  }`}
                >
                  <Text
                    className={`text-[11px] font-mono uppercase ${
                      active ? 'text-primary font-bold' : 'text-slate-400'
                    }`}
                  >
                    {l}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Content Area */}
        <ScrollView className="flex-1 px-4 py-2" showsVerticalScrollIndicator={false}>
          {/* Multi-File Tab Bar */}
          <View className="flex-row items-center border-b border-border mb-1 overflow-hidden">
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
              {files.map((file, idx) => {
                const active = activeFileIndex === idx;
                return (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => setActiveFileIndex(idx)}
                    className={`flex-row items-center px-3 py-2 border-b-2 mr-1 ${
                      active
                        ? 'border-primary bg-card/80 text-primary'
                        : 'border-transparent text-slate-500'
                    }`}
                  >
                    <FileCode size={13} color={active ? '#38bdf8' : '#64748b'} />
                    <Text
                      className={`text-xs ml-1.5 font-mono ${
                        active ? 'text-primary font-bold' : 'text-slate-400'
                      }`}
                    >
                      {file.path}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Code Block with Sandbox Execution Button */}
          {currentFile && (
            <CodeBlockView
              code={currentFile.content}
              language={currentFile.language || selectedLanguage}
              filename={currentFile.path}
              allowExecution={true}
            />
          )}

          {/* Explanation / Breakdown Section */}
          {explanation ? (
            <View className="bg-card border border-border/80 rounded-xl p-3.5 my-2">
              <View className="flex-row items-center mb-1.5 pb-1 border-b border-border/40">
                <Sparkles size={13} color="#38bdf8" />
                <Text className="text-xs font-bold text-primary ml-1.5 uppercase tracking-wide">
                  Analysis & Breakdown
                </Text>
              </View>
              <Text className="text-xs text-slate-300 leading-5" selectable>
                {explanation}
              </Text>
            </View>
          ) : null}

          {/* Quick Prompts */}
          <View className="my-3">
            <Text className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
              Quick Scaffolds
            </Text>
            {quickPrompts.map((qp, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => {
                  setPrompt(qp);
                  handleGenerate(qp);
                }}
                className="bg-card/60 border border-border/60 rounded-lg p-2.5 mb-1.5 flex-row items-center justify-between active:bg-border"
              >
                <Text className="text-xs text-slate-300 flex-1 mr-2">{qp}</Text>
                <Layers size={13} color="#64748b" />
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Prompt Input Bar */}
        <View className="p-3 bg-card border-t border-border">
          <View className="flex-row items-center bg-background border border-border rounded-xl px-3 py-1.5">
            <Terminal size={16} color="#64748b" />
            <TextInput
              value={prompt}
              onChangeText={setPrompt}
              placeholder={`Describe code to ${selectedMode}...`}
              placeholderTextColor="#64748b"
              className="flex-1 text-sm text-slate-100 ml-2.5 mr-2 py-1"
              onSubmitEditing={() => handleGenerate()}
              returnKeyType="send"
            />
            <TouchableOpacity
              onPress={() => handleGenerate()}
              disabled={loading || !prompt.trim()}
              className={`w-9 h-9 rounded-lg items-center justify-center ${
                prompt.trim() && !loading ? 'bg-primary' : 'bg-primary/30'
              }`}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#090d16" />
              ) : (
                <Send size={15} color="#090d16" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
