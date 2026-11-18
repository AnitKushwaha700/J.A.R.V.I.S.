import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  CheckSquare,
  Plus,
  Clock,
  CheckCircle2,
  Circle,
  Trash2,
  Volume2,
  Sparkles,
  Calendar,
  Cloud,
  Layers,
  StopCircle,
} from 'lucide-react-native';
import { apiClient } from '../../services/api.client';
import { voiceService } from '../../services/voice.service';
import { Task, TaskPriority, TaskStatus, DailyBriefing } from '@jarvis/shared-types';

export default function TasksScreen() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [briefing, setBriefing] = useState<DailyBriefing | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'completed' | 'high'>('all');
  const [inputTitle, setInputTitle] = useState('');
  const [adding, setAdding] = useState(false);
  const [isPlayingBriefing, setIsPlayingBriefing] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [fetchedTasks, fetchedBriefing] = await Promise.all([
        apiClient.getTasks().catch(() => [
          {
            id: 'demo-1',
            userId: 'user-1',
            title: 'Review pull request for AI Gateway streaming',
            priority: 'high' as TaskPriority,
            status: 'todo' as TaskStatus,
            dueAt: new Date(Date.now() + 3600000).toISOString(),
            isRecurring: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: 'demo-2',
            userId: 'user-1',
            title: 'Prepare system architecture documentation',
            priority: 'medium' as TaskPriority,
            status: 'todo' as TaskStatus,
            dueAt: null,
            isRecurring: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: 'demo-3',
            userId: 'user-1',
            title: 'Read arXiv paper on quantum reasoning',
            priority: 'low' as TaskPriority,
            status: 'completed' as TaskStatus,
            dueAt: null,
            isRecurring: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ]),
        apiClient.getDailyBriefing('Mumbai').catch(() => null),
      ]);

      setTasks(fetchedTasks);
      if (fetchedBriefing) setBriefing(fetchedBriefing);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggle = async (task: Task) => {
    const newStatus: TaskStatus = task.status === 'completed' ? 'todo' : 'completed';
    // Optimistic update
    setTasks(tasks.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t)));
    try {
      await apiClient.updateTask(task.id, { status: newStatus });
    } catch {
      // Revert if error
      setTasks(tasks.map((t) => (t.id === task.id ? { ...t, status: task.status } : t)));
    }
  };

  const handleDelete = async (id: string) => {
    setTasks(tasks.filter((t) => t.id !== id));
    try {
      await apiClient.deleteTask(id);
    } catch {
      // ignore
    }
  };

  const handleAdd = async () => {
    const text = inputTitle.trim();
    if (!text) return;
    setAdding(true);

    try {
      // Natural language extraction
      const extracted = await apiClient.extractTask(text).catch(() => ({
        title: text,
        dueAt: undefined,
        priority: 'medium' as TaskPriority,
        rawInput: text,
      }));

      const created = await apiClient.createTask({
        title: extracted.title,
        priority: extracted.priority,
        dueAt: extracted.dueAt,
        status: 'todo',
      });

      setTasks([created, ...tasks]);
      setInputTitle('');
    } catch (err: unknown) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Could not add task');
    } finally {
      setAdding(false);
    }
  };

  const handlePlayBriefing = async () => {
    if (!briefing?.spokenScript) return;

    if (isPlayingBriefing) {
      await voiceService.stopSpeaking();
      setIsPlayingBriefing(false);
    } else {
      setIsPlayingBriefing(true);
      try {
        await voiceService.speak(briefing.spokenScript, 'jarvis');
      } finally {
        setIsPlayingBriefing(false);
      }
    }
  };

  const filteredTasks = tasks.filter((t) => {
    if (activeFilter === 'pending') return t.status !== 'completed';
    if (activeFilter === 'completed') return t.status === 'completed';
    if (activeFilter === 'high') return t.priority === 'high' && t.status !== 'completed';
    return true;
  });

  const pendingCount = tasks.filter((t) => t.status !== 'completed').length;
  const completedCount = tasks.filter((t) => t.status === 'completed').length;

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
              <CheckSquare size={18} color="#38bdf8" />
            </View>
            <View>
              <Text className="text-white font-bold text-base">JARVIS Productivity</Text>
              <Text className="text-slate-400 text-xs">Task management & daily briefings</Text>
            </View>
          </View>
          <View className="px-2.5 py-1 rounded-full bg-primary/10 border border-primary/30">
            <Text className="text-xs text-primary font-bold">
              {completedCount}/{tasks.length} Done
            </Text>
          </View>
        </View>

        <ScrollView className="flex-1 px-4 py-3" showsVerticalScrollIndicator={false}>
          {/* Daily Morning Briefing Card */}
          {briefing && (
            <View className="bg-gradient-to-br from-card to-slate-900 border border-primary/30 rounded-2xl p-4 mb-4 shadow-lg">
              <View className="flex-row items-center justify-between mb-2">
                <View className="flex-row items-center">
                  <Sparkles size={14} color="#38bdf8" />
                  <Text className="text-xs font-bold text-primary ml-1.5 uppercase tracking-wide">
                    {briefing.greeting}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={handlePlayBriefing}
                  className="flex-row items-center px-2.5 py-1 rounded-full bg-primary/20 border border-primary/40 active:bg-primary/30"
                >
                  {isPlayingBriefing ? (
                    <>
                      <StopCircle size={12} color="#f87171" fill="#f87171" />
                      <Text className="text-[11px] font-bold text-red-400 ml-1">Stop</Text>
                    </>
                  ) : (
                    <>
                      <Volume2 size={12} color="#38bdf8" />
                      <Text className="text-[11px] font-bold text-primary ml-1">Listen Briefing</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>

              <Text className="text-slate-200 font-semibold text-sm mb-2">
                {briefing.dateTime}
              </Text>

              {briefing.weather && (
                <View className="flex-row items-center bg-background/60 border border-border/60 rounded-xl px-3 py-2 mb-3">
                  <Cloud size={14} color="#38bdf8" />
                  <Text className="text-xs text-slate-300 ml-2">
                    {briefing.weather.location}: {briefing.weather.temperature}°C • {briefing.weather.condition}
                  </Text>
                </View>
              )}

              <View className="flex-row items-center justify-between pt-2 border-t border-border/40">
                <Text className="text-xs text-slate-400">
                  Pending Tasks: <Text className="text-amber-400 font-bold">{briefing.pendingCount}</Text>
                </Text>
                <Text className="text-xs text-slate-400">
                  Core Neural Systems: <Text className="text-emerald-400 font-bold">100%</Text>
                </Text>
              </View>
            </View>
          )}

          {/* Quick-Add Bar with Voice Natural Language Parser */}
          <View className="bg-card border border-border rounded-2xl p-2.5 flex-row items-center mb-4 shadow-sm">
            <TextInput
              value={inputTitle}
              onChangeText={setInputTitle}
              placeholder="e.g. Deploy production tomorrow at 7 PM urgently..."
              placeholderTextColor="#64748b"
              className="flex-1 text-sm text-slate-100 px-2 py-1"
              onSubmitEditing={handleAdd}
              returnKeyType="done"
            />
            <TouchableOpacity
              onPress={handleAdd}
              disabled={adding || !inputTitle.trim()}
              className={`w-9 h-9 rounded-xl items-center justify-center ${
                inputTitle.trim() && !adding ? 'bg-primary' : 'bg-primary/30'
              }`}
            >
              {adding ? (
                <ActivityIndicator size="small" color="#090d16" />
              ) : (
                <Plus size={18} color="#090d16" />
              )}
            </TouchableOpacity>
          </View>

          {/* Filter Tabs */}
          <View className="flex-row items-center mb-3 space-x-1.5">
            {[
              { id: 'all', label: `All (${tasks.length})` },
              { id: 'pending', label: `Pending (${pendingCount})` },
              { id: 'completed', label: `Completed (${completedCount})` },
              { id: 'high', label: 'High Priority 🔥' },
            ].map((tab) => {
              const active = activeFilter === tab.id;
              return (
                <TouchableOpacity
                  key={tab.id}
                  onPress={() => setActiveFilter(tab.id as any)}
                  className={`px-3 py-1.5 rounded-full border mr-1.5 ${
                    active
                      ? 'bg-primary/20 border-primary text-primary'
                      : 'bg-card border-border text-slate-400'
                  }`}
                >
                  <Text
                    className={`text-xs font-semibold ${
                      active ? 'text-primary' : 'text-slate-400'
                    }`}
                  >
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Tasks List */}
          {loading && (
            <View className="py-12 items-center justify-center">
              <ActivityIndicator size="large" color="#38bdf8" />
              <Text className="text-slate-400 text-xs mt-3">Loading tasks...</Text>
            </View>
          )}

          {!loading && filteredTasks.length === 0 && (
            <View className="py-12 items-center justify-center">
              <CheckSquare size={36} color="#64748b" />
              <Text className="text-slate-300 font-semibold text-sm mt-3">No tasks found</Text>
              <Text className="text-slate-500 text-xs mt-1">
                You have no items in this filter view.
              </Text>
            </View>
          )}

          {!loading &&
            filteredTasks.map((task) => {
              const isDone = task.status === 'completed';
              return (
                <View
                  key={task.id}
                  className={`p-3.5 mb-2.5 rounded-xl border flex-row items-center justify-between ${
                    isDone
                      ? 'bg-card/40 border-border/40 opacity-60'
                      : 'bg-card border-border shadow-sm'
                  }`}
                >
                  <TouchableOpacity
                    onPress={() => handleToggle(task)}
                    className="flex-row items-center flex-1 mr-2"
                  >
                    {isDone ? (
                      <CheckCircle2 size={20} color="#4ade80" />
                    ) : (
                      <Circle size={20} color="#64748b" />
                    )}

                    <View className="ml-3 flex-1">
                      <Text
                        className={`text-sm ${
                          isDone
                            ? 'line-through text-slate-500'
                            : 'text-slate-100 font-medium'
                        }`}
                      >
                        {task.title}
                      </Text>

                      {task.dueAt && (
                        <View className="flex-row items-center mt-1">
                          <Clock size={11} color="#94a3b8" />
                          <Text className="text-[10px] text-slate-400 ml-1 font-mono">
                            {new Date(task.dueAt).toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit',
                            })}
                          </Text>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>

                  <View className="flex-row items-center space-x-2">
                    <View
                      className={`px-2 py-0.5 rounded-md ${
                        task.priority === 'high'
                          ? 'bg-red-500/15 border border-red-500/30'
                          : task.priority === 'medium'
                          ? 'bg-amber-500/15 border border-amber-500/30'
                          : 'bg-blue-500/15 border border-blue-500/30'
                      }`}
                    >
                      <Text
                        className={`text-[10px] font-bold uppercase ${
                          task.priority === 'high'
                            ? 'text-red-400'
                            : task.priority === 'medium'
                            ? 'text-amber-400'
                            : 'text-blue-400'
                        }`}
                      >
                        {task.priority}
                      </Text>
                    </View>

                    <TouchableOpacity
                      onPress={() => handleDelete(task.id)}
                      className="p-1 rounded hover:bg-red-500/20 active:opacity-60 ml-2"
                    >
                      <Trash2 size={14} color="#f87171" />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
