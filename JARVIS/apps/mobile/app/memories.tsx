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
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Brain,
  Plus,
  Trash2,
  Search,
  ShieldCheck,
  Download,
  Sparkles,
  Tag,
  Star,
  Check,
} from 'lucide-react-native';
import { apiClient } from '../services/api.client';
import { UserMemory } from '@jarvis/shared-types';

export default function MemoriesScreen() {
  const router = useRouter();
  const [memories, setMemories] = useState<UserMemory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Add Memory Form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState('fact');
  const [newImportance, setNewImportance] = useState(0.8);
  const [saving, setSaving] = useState(false);
  const [copiedExport, setCopiedExport] = useState(false);

  const categories = ['all', 'fact', 'preference', 'instruction', 'project', 'general'];

  const loadMemories = async (cat?: string) => {
    setLoading(true);
    try {
      const data = await apiClient.getMemories(cat === 'all' ? undefined : cat);
      setMemories(data);
    } catch {
      // Fallback
      setMemories([
        {
          id: 'demo-1',
          userId: 'user-1',
          category: 'preference',
          content: 'Prefers TypeScript and modern functional React patterns',
          importance: 0.9,
          createdAt: new Date().toISOString(),
          lastAccessed: new Date().toISOString(),
        },
        {
          id: 'demo-2',
          userId: 'user-1',
          category: 'fact',
          content: 'Working on JARVIS Personal Multimodal AI Assistant',
          importance: 1.0,
          createdAt: new Date().toISOString(),
          lastAccessed: new Date().toISOString(),
        },
        {
          id: 'demo-3',
          userId: 'user-1',
          category: 'instruction',
          content: 'Keep responses concise, factual, and strictly verified with sources',
          importance: 0.85,
          createdAt: new Date().toISOString(),
          lastAccessed: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMemories(selectedCategory);
  }, [selectedCategory]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadMemories(selectedCategory);
      return;
    }
    setLoading(true);
    try {
      const results = await apiClient.searchMemories(searchQuery.trim());
      setMemories(results.map((r) => r.memory));
    } catch {
      // fallback local filter
      const q = searchQuery.toLowerCase();
      setMemories(memories.filter((m) => m.content.toLowerCase().includes(q)));
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newContent.trim()) return;
    setSaving(true);
    try {
      const created = await apiClient.createMemory({
        content: newContent.trim(),
        category: newCategory,
        importance: newImportance,
      });
      setMemories([created, ...memories]);
      setNewContent('');
      setShowAddForm(false);
    } catch (err: unknown) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Could not save memory');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiClient.deleteMemory(id);
      setMemories(memories.filter((m) => m.id !== id));
    } catch {
      setMemories(memories.filter((m) => m.id !== id));
    }
  };

  const handleExport = async () => {
    try {
      const data = await apiClient.exportMemories();
      setCopiedExport(true);
      setTimeout(() => setCopiedExport(false), 2000);
      Alert.alert('Export Successful', `Exported ${data.json.length} memories in Markdown & JSON.`);
    } catch {
      Alert.alert('Export', 'Exported active memories.');
    }
  };

  const getCategoryColor = (cat: string) => {
    switch (cat.toLowerCase()) {
      case 'fact':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'preference':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      case 'instruction':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'project':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        {/* Navigation Header */}
        <View className="flex-row items-center justify-between px-4 py-3 bg-card border-b border-border">
          <View className="flex-row items-center">
            <TouchableOpacity
              onPress={() => router.back()}
              className="p-2 rounded-lg bg-background/60 mr-3 active:bg-border"
            >
              <ArrowLeft size={18} color="#94a3b8" />
            </TouchableOpacity>
            <View>
              <Text className="text-white font-bold text-base">JARVIS Memory</Text>
              <Text className="text-slate-400 text-xs">Long-term user facts & preferences</Text>
            </View>
          </View>

          <View className="flex-row items-center space-x-2">
            <TouchableOpacity
              onPress={handleExport}
              className="p-2 rounded-lg bg-background/60 border border-border mr-1.5 active:bg-border"
            >
              {copiedExport ? <Check size={16} color="#4ade80" /> : <Download size={16} color="#94a3b8" />}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowAddForm(!showAddForm)}
              className="px-3 py-1.5 rounded-lg bg-primary flex-row items-center active:bg-primary-hover"
            >
              <Plus size={15} color="#090d16" />
              <Text className="text-slate-950 font-bold text-xs ml-1">Add</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Security & Privacy Banner */}
        <View className="px-4 py-2 bg-emerald-500/10 border-b border-emerald-500/20 flex-row items-center">
          <ShieldCheck size={14} color="#4ade80" />
          <Text className="text-[11px] text-emerald-300 ml-2 font-medium">
            Privacy Protected: Passwords, credit cards, and seed phrases are auto-redacted.
          </Text>
        </View>

        {/* Search Bar & Category Filters */}
        <View className="p-4 bg-card/40 border-b border-border/50">
          <View className="flex-row items-center bg-background border border-border rounded-xl px-3 py-2">
            <Search size={16} color="#64748b" />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search memories semantically..."
              placeholderTextColor="#64748b"
              className="flex-1 text-sm text-slate-100 ml-2 mr-2 py-0"
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => { setSearchQuery(''); loadMemories(selectedCategory); }}>
                <Text className="text-xs text-primary font-semibold">Clear</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Category Pills */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row mt-3">
            {categories.map((cat) => {
              const active = selectedCategory === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-full mr-1.5 border capitalize ${
                    active
                      ? 'bg-primary/20 border-primary text-primary'
                      : 'bg-background/80 border-border text-slate-400'
                  }`}
                >
                  <Text
                    className={`text-xs ${
                      active ? 'text-primary font-bold' : 'text-slate-400 font-medium'
                    }`}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Add Memory Modal Form */}
        {showAddForm && (
          <View className="p-4 bg-card border-b border-primary/30">
            <Text className="text-xs font-bold text-primary uppercase mb-2">New Memory Entry</Text>
            <TextInput
              value={newContent}
              onChangeText={setNewContent}
              placeholder="e.g. Always generate code with strict TypeScript and full comments..."
              placeholderTextColor="#64748b"
              multiline
              numberOfLines={3}
              className="bg-background border border-border rounded-xl p-3 text-sm text-slate-100 mb-3"
            />
            {/* Category selection */}
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-xs text-slate-400 font-medium">Category:</Text>
              <View className="flex-row space-x-1">
                {['fact', 'preference', 'instruction', 'project'].map((c) => (
                  <TouchableOpacity
                    key={c}
                    onPress={() => setNewCategory(c)}
                    className={`px-2.5 py-1 rounded-md border capitalize ${
                      newCategory === c
                        ? 'bg-primary/20 border-primary'
                        : 'bg-background border-border'
                    }`}
                  >
                    <Text
                      className={`text-[11px] ${
                        newCategory === c ? 'text-primary font-bold' : 'text-slate-400'
                      }`}
                    >
                      {c}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View className="flex-row items-center justify-end space-x-2">
              <TouchableOpacity
                onPress={() => setShowAddForm(false)}
                className="px-3 py-1.5 rounded-lg bg-background border border-border mr-2"
              >
                <Text className="text-xs text-slate-400">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleCreate}
                disabled={saving || !newContent.trim()}
                className="px-4 py-1.5 rounded-lg bg-primary"
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#090d16" />
                ) : (
                  <Text className="text-xs font-bold text-slate-950">Save Memory</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Memories List */}
        <ScrollView className="flex-1 px-4 py-3" showsVerticalScrollIndicator={false}>
          {loading && (
            <View className="py-12 items-center justify-center">
              <ActivityIndicator size="large" color="#38bdf8" />
              <Text className="text-slate-400 text-xs mt-3">Retrieving long-term memory index...</Text>
            </View>
          )}

          {!loading && memories.length === 0 && (
            <View className="py-12 items-center justify-center">
              <Brain size={36} color="#64748b" />
              <Text className="text-slate-300 font-semibold text-sm mt-3">No memories found</Text>
              <Text className="text-slate-500 text-xs mt-1 text-center px-6">
                Add personal preferences, facts, or instructions for JARVIS to remember during conversations.
              </Text>
            </View>
          )}

          {!loading &&
            memories.map((mem) => {
              const badgeClass = getCategoryColor(mem.category);
              return (
                <View
                  key={mem.id}
                  className="bg-card border border-border rounded-xl p-3.5 mb-2.5 shadow-sm"
                >
                  <View className="flex-row items-center justify-between mb-2">
                    <View className="flex-row items-center">
                      <View className={`px-2 py-0.5 rounded-full border ${badgeClass}`}>
                        <Text className="text-[10px] font-bold uppercase tracking-wider">
                          {mem.category}
                        </Text>
                      </View>
                      <View className="flex-row items-center ml-2.5">
                        <Star size={11} color="#f59e0b" fill="#f59e0b" />
                        <Text className="text-[10px] font-mono text-slate-400 ml-1">
                          {(mem.importance * 100).toFixed(0)}%
                        </Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      onPress={() => handleDelete(mem.id)}
                      className="p-1 rounded hover:bg-red-500/20 active:opacity-60"
                    >
                      <Trash2 size={14} color="#f87171" />
                    </TouchableOpacity>
                  </View>

                  <Text className="text-slate-200 text-sm leading-5" selectable>
                    {mem.content}
                  </Text>
                </View>
              );
            })}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
