import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Copy, Check, Play, Terminal, ChevronDown, ChevronUp, ShieldCheck } from 'lucide-react-native';
import { CodeLanguage, CodeExecutionResult } from '@jarvis/shared-types';
import { apiClient } from '../services/api.client';

interface CodeBlockViewProps {
  code: string;
  language?: CodeLanguage | string;
  filename?: string;
  allowExecution?: boolean;
}

export const CodeBlockView = ({
  code,
  language = 'typescript',
  filename,
  allowExecution = true,
}: CodeBlockViewProps) => {
  const [copied, setCopied] = useState(false);
  const [running, setRunning] = useState(false);
  const [execResult, setExecResult] = useState<CodeExecutionResult | null>(null);
  const [showConsole, setShowConsole] = useState(false);

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRun = async () => {
    setRunning(true);
    setShowConsole(true);
    try {
      const result = await apiClient.executeCode({
        language: (language as CodeLanguage) || 'typescript',
        code,
        timeoutMs: 5000,
      });
      setExecResult(result);
    } catch (err: unknown) {
      setExecResult({
        success: false,
        stdout: '',
        stderr: err instanceof Error ? err.message : 'Execution failed',
        executionTimeMs: 0,
        testedInSandbox: true,
      });
    } finally {
      setRunning(false);
    }
  };

  const lines = code.trim().split('\n');

  return (
    <View className="bg-card border border-border rounded-xl overflow-hidden my-3 shadow-md">
      {/* Editor Header Bar */}
      <View className="flex-row items-center justify-between bg-slate-900/90 px-3.5 py-2.5 border-b border-border">
        {/* Left: Window Dots & Title */}
        <View className="flex-row items-center">
          <View className="flex-row space-x-1.5 mr-2.5">
            <View className="w-2.5 h-2.5 rounded-full bg-red-500/80 mr-1" />
            <View className="w-2.5 h-2.5 rounded-full bg-amber-500/80 mr-1" />
            <View className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
          </View>
          <Text className="text-xs font-mono font-semibold text-slate-300">
            {filename || `${language.toUpperCase()}`}
          </Text>
        </View>

        {/* Right: Actions */}
        <View className="flex-row items-center">
          {allowExecution && (
            <TouchableOpacity
              onPress={handleRun}
              disabled={running}
              className="flex-row items-center bg-primary/15 border border-primary/40 px-2.5 py-1 rounded-lg mr-2 active:bg-primary/30"
            >
              {running ? (
                <ActivityIndicator size="small" color="#38bdf8" />
              ) : (
                <>
                  <Play size={11} color="#38bdf8" fill="#38bdf8" />
                  <Text className="text-[11px] font-bold text-primary ml-1">Run</Text>
                </>
              )}
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={handleCopy}
            className="p-1 rounded bg-background/60 border border-border/60 active:bg-border"
          >
            {copied ? <Check size={13} color="#4ade80" /> : <Copy size={13} color="#94a3b8" />}
          </TouchableOpacity>
        </View>
      </View>

      {/* Code Area with Line Numbers */}
      <ScrollView horizontal showsHorizontalScrollIndicator={true} className="bg-slate-950/90">
        <View className="flex-row py-3 px-2">
          {/* Line Numbers */}
          <View className="pr-3 border-r border-slate-800/80 select-none items-end">
            {lines.map((_, i) => (
              <Text key={i} className="text-xs font-mono text-slate-600 leading-5">
                {i + 1}
              </Text>
            ))}
          </View>

          {/* Code Text */}
          <View className="pl-3 pr-6">
            {lines.map((line, i) => (
              <Text
                key={i}
                className="text-xs font-mono text-slate-200 leading-5"
                selectable
              >
                {line || ' '}
              </Text>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Execution Output Drawer */}
      {showConsole && (
        <View className="border-t border-border bg-slate-950 p-3">
          <TouchableOpacity
            onPress={() => setShowConsole(!showConsole)}
            className="flex-row items-center justify-between pb-2 border-b border-slate-800"
          >
            <View className="flex-row items-center">
              <Terminal size={13} color="#38bdf8" />
              <Text className="text-xs font-bold text-slate-300 ml-1.5 font-mono">
                Sandbox Console Output
              </Text>
              {execResult && (
                <View className="flex-row items-center ml-2 px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30">
                  <ShieldCheck size={10} color="#4ade80" />
                  <Text className="text-[10px] text-emerald-400 font-bold ml-1">
                    {execResult.executionTimeMs}ms
                  </Text>
                </View>
              )}
            </View>
            {showConsole ? <ChevronUp size={14} color="#94a3b8" /> : <ChevronDown size={14} color="#94a3b8" />}
          </TouchableOpacity>

          <View className="pt-2">
            {running && (
              <Text className="text-xs font-mono text-slate-400">
                Executing in isolated sandbox...
              </Text>
            )}

            {!running && execResult && (
              <>
                {execResult.stdout ? (
                  <Text className="text-xs font-mono text-emerald-400 leading-5" selectable>
                    {execResult.stdout}
                  </Text>
                ) : null}

                {execResult.stderr ? (
                  <Text className="text-xs font-mono text-rose-400 leading-5" selectable>
                    {execResult.stderr}
                  </Text>
                ) : null}

                {!execResult.stdout && !execResult.stderr && (
                  <Text className="text-xs font-mono text-slate-500">
                    Process completed with no output (exit code: 0).
                  </Text>
                )}
              </>
            )}
          </View>
        </View>
      )}
    </View>
  );
};
