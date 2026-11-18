import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  TextInput,
  SafeAreaView,
} from 'react-native';
import { CheckSquare, Plus, Clock, CheckCircle2, Circle } from 'lucide-react-native';

interface TaskItem {
  id: string;
  title: string;
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
}

export default function TasksScreen() {
  const [tasks, setTasks] = useState<TaskItem[]>([
    { id: '1', title: 'Review pull request for AI Gateway streaming', priority: 'high', completed: false },
    { id: '2', title: 'Prepare for system design mock interview', priority: 'medium', completed: false },
    { id: '3', title: 'Read arXiv paper on multimodal reasoning', priority: 'low', completed: true },
  ]);
  const [newTitle, setNewTitle] = useState('');

  const toggleTask = (id: string) => {
    setTasks((current) =>
      current.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)),
    );
  };

  const addTask = () => {
    if (!newTitle.trim()) return;
    setTasks((current) => [
      {
        id: `task_${Date.now()}`,
        title: newTitle.trim(),
        priority: 'medium',
        completed: false,
      },
      ...current,
    ]);
    setNewTitle('');
  };

  return (
    <SafeAreaView className="flex-1 bg-background px-4 py-4">
      <View className="flex-row items-center justify-between pb-3 border-b border-border mb-4">
        <View className="flex-row items-center">
          <CheckSquare size={24} color="#38bdf8" />
          <Text className="text-lg font-bold text-slate-100 ml-2">Task Planner</Text>
        </View>
        <Text className="text-xs text-secondary">
          {tasks.filter((t) => t.completed).length}/{tasks.length} Completed
        </Text>
      </View>

      {/* Quick Add Bar */}
      <View className="bg-card border border-border rounded-2xl p-2 flex-row items-center mb-4">
        <TextInput
          value={newTitle}
          onChangeText={setNewTitle}
          placeholder="Add a new task or voice reminder..."
          placeholderTextColor="#64748b"
          className="flex-1 text-sm text-slate-100 px-3 py-2"
        />
        <TouchableOpacity
          onPress={addTask}
          disabled={!newTitle.trim()}
          className="w-10 h-10 rounded-xl bg-primary items-center justify-center active:scale-95"
        >
          <Plus size={18} color="#090d16" />
        </TouchableOpacity>
      </View>

      {/* Tasks List */}
      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => toggleTask(item.id)}
            className={`flex-row items-center p-4 mb-2.5 rounded-xl border ${
              item.completed
                ? 'bg-card/40 border-border/40 opacity-60'
                : 'bg-card border-border'
            }`}
          >
            {item.completed ? (
              <CheckCircle2 size={20} color="#4ade80" />
            ) : (
              <Circle size={20} color="#64748b" />
            )}
            <Text
              className={`flex-1 ml-3 text-sm ${
                item.completed
                  ? 'line-through text-secondary'
                  : 'text-slate-100 font-medium'
              }`}
            >
              {item.title}
            </Text>
            <View
              className={`px-2 py-0.5 rounded-md ${
                item.priority === 'high'
                  ? 'bg-red-500/20'
                  : item.priority === 'medium'
                  ? 'bg-amber-500/20'
                  : 'bg-blue-500/20'
              }`}
            >
              <Text
                className={`text-[10px] font-bold uppercase ${
                  item.priority === 'high'
                    ? 'text-red-400'
                    : item.priority === 'medium'
                    ? 'text-amber-400'
                    : 'text-blue-400'
                }`}
              >
                {item.priority}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}
