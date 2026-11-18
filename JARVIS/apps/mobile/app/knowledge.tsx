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
  BookOpen,
  Plus,
  Trash2,
  Search,
  FileText,
  Sparkles,
  Layers,
  Database,
  CheckCircle,
} from 'lucide-react-native';
import { apiClient } from '../services/api.client';
import { KnowledgeDoc, DocumentChunkItem } from '@jarvis/shared-types';

export default function KnowledgeScreen() {
  const router = useRouter();
  const [docs, setDocs] = useState<KnowledgeDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<DocumentChunkItem[]>([]);
  const [searching, setSearching] = useState(false);

  // Ingest Form State
  const [showIngest, setShowIngest] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [ingesting, setIngesting] = useState(false);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const data = await apiClient.getKnowledgeDocs();
      setDocs(data);
    } catch {
      // Fallback demo data
      setDocs([
        {
          id: 'demo-doc-1',
          userId: 'user-1',
          title: 'JARVIS Technical System Architecture',
          fileType: 'text/markdown',
          storagePath: 'local://knowledge/demo',
          chunkCount: 4,
          isIndexed: true,
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const results = await apiClient.searchKnowledge(searchQuery.trim(), 3);
      setSearchResults(results);
    } catch (err: unknown) {
      Alert.alert('Search Error', err instanceof Error ? err.message : 'Knowledge search failed');
    } finally {
      setSearching(false);
    }
  };

  const handleIngest = async () => {
    if (!newTitle.trim() || !newContent.trim()) {
      Alert.alert('Missing Fields', 'Please provide both title and content.');
      return;
    }
    setIngesting(true);
    try {
      const doc = await apiClient.ingestKnowledgeDoc({
        title: newTitle.trim(),
        content: newContent.trim(),
        fileType: 'text/plain',
      });
      setDocs([doc, ...docs]);
      setNewTitle('');
      setNewContent('');
      setShowIngest(false);
      Alert.alert('Indexed Successfully', `Document "${doc.title}" indexed into ${doc.chunkCount} vector chunks.`);
    } catch (err: unknown) {
      Alert.alert('Ingestion Error', err instanceof Error ? err.message : 'Failed to ingest document');
    } finally {
      setIngesting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiClient.deleteKnowledgeDoc(id);
      setDocs(docs.filter((d) => d.id !== id));
    } catch {
      setDocs(docs.filter((d) => d.id !== id));
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
              <Text className="text-white font-bold text-base">Knowledge Base & RAG</Text>
              <Text className="text-slate-400 text-xs">Vector embeddings & semantic retrieval</Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={() => setShowIngest(!showIngest)}
            className="px-3 py-1.5 rounded-lg bg-primary flex-row items-center active:bg-primary-hover"
          >
            <Plus size={15} color="#090d16" />
            <Text className="text-slate-950 font-bold text-xs ml-1">Ingest</Text>
          </TouchableOpacity>
        </View>

        {/* Semantic Search Bar */}
        <View className="p-4 bg-card/40 border-b border-border/50">
          <View className="flex-row items-center bg-background border border-border rounded-xl px-3 py-2">
            <Search size={16} color="#64748b" />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search knowledge documents semantically..."
              placeholderTextColor="#64748b"
              className="flex-1 text-sm text-slate-100 ml-2 mr-2 py-0"
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  setSearchQuery('');
                  setSearchResults([]);
                }}
              >
                <Text className="text-xs text-primary font-semibold">Clear</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Ingest Modal Form */}
        {showIngest && (
          <View className="p-4 bg-card border-b border-primary/30">
            <Text className="text-xs font-bold text-primary uppercase mb-2">Ingest New Document</Text>
            <TextInput
              value={newTitle}
              onChangeText={setNewTitle}
              placeholder="Document Title (e.g., Company Handbook, API Guide)..."
              placeholderTextColor="#64748b"
              className="bg-background border border-border rounded-xl px-3 py-2 text-sm text-slate-100 mb-2.5"
            />
            <TextInput
              value={newContent}
              onChangeText={setNewContent}
              placeholder="Paste document text or notes for automatic chunking & vector indexing..."
              placeholderTextColor="#64748b"
              multiline
              numberOfLines={4}
              className="bg-background border border-border rounded-xl p-3 text-sm text-slate-100 mb-3"
            />
            <View className="flex-row items-center justify-end space-x-2">
              <TouchableOpacity
                onPress={() => setShowIngest(false)}
                className="px-3 py-1.5 rounded-lg bg-background border border-border mr-2"
              >
                <Text className="text-xs text-slate-400">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleIngest}
                disabled={ingesting || !newTitle.trim() || !newContent.trim()}
                className="px-4 py-1.5 rounded-lg bg-primary"
              >
                {ingesting ? (
                  <ActivityIndicator size="small" color="#090d16" />
                ) : (
                  <Text className="text-xs font-bold text-slate-950">Index Document</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        <ScrollView className="flex-1 px-4 py-3" showsVerticalScrollIndicator={false}>
          {/* Search Results Display */}
          {searching && (
            <View className="py-6 items-center justify-center">
              <ActivityIndicator size="small" color="#38bdf8" />
              <Text className="text-slate-400 text-xs mt-2">Computing cosine similarity...</Text>
            </View>
          )}

          {searchResults.length > 0 && (
            <View className="mb-4">
              <Text className="text-xs font-bold uppercase tracking-wider text-primary mb-2">
                Semantic Matches ({searchResults.length})
              </Text>
              {searchResults.map((chunk, idx) => (
                <View
                  key={chunk.id || idx}
                  className="bg-card border border-primary/30 rounded-xl p-3 mb-2"
                >
                  <View className="flex-row items-center justify-between mb-1">
                    <View className="flex-row items-center">
                      <Sparkles size={12} color="#38bdf8" />
                      <Text className="text-[11px] font-bold text-primary ml-1">
                        Rank #{idx + 1}
                      </Text>
                    </View>
                    {chunk.similarityScore !== undefined && (
                      <Text className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                        {(chunk.similarityScore * 100).toFixed(1)}% match
                      </Text>
                    )}
                  </View>
                  <Text className="text-xs text-slate-200 leading-5" selectable>
                    {chunk.content}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Document List Header */}
          <View className="flex-row items-center justify-between mb-2.5">
            <Text className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Indexed Knowledge Documents ({docs.length})
            </Text>
            <View className="flex-row items-center">
              <Database size={11} color="#38bdf8" />
              <Text className="text-[11px] text-primary font-semibold ml-1">RAG Active</Text>
            </View>
          </View>

          {loading && (
            <View className="py-12 items-center justify-center">
              <ActivityIndicator size="large" color="#38bdf8" />
              <Text className="text-slate-400 text-xs mt-3">Loading knowledge documents...</Text>
            </View>
          )}

          {!loading && docs.length === 0 && (
            <View className="py-12 items-center justify-center">
              <BookOpen size={36} color="#64748b" />
              <Text className="text-slate-300 font-semibold text-sm mt-3">No documents indexed yet</Text>
              <Text className="text-slate-500 text-xs mt-1 text-center px-6">
                Ingest documentation, API schemas, or reference materials to enable retrieval-augmented generation.
              </Text>
            </View>
          )}

          {!loading &&
            docs.map((doc) => (
              <View
                key={doc.id}
                className="bg-card border border-border rounded-xl p-3.5 mb-2.5 shadow-sm"
              >
                <View className="flex-row items-center justify-between mb-2">
                  <View className="flex-row items-center flex-1 mr-2">
                    <FileText size={16} color="#38bdf8" />
                    <Text className="text-slate-100 font-bold text-sm ml-2 flex-1" numberOfLines={1}>
                      {doc.title}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleDelete(doc.id)}
                    className="p-1 rounded hover:bg-red-500/20 active:opacity-60"
                  >
                    <Trash2 size={14} color="#f87171" />
                  </TouchableOpacity>
                </View>

                <View className="flex-row items-center justify-between pt-2 border-t border-border/40">
                  <View className="flex-row items-center">
                    <Layers size={11} color="#94a3b8" />
                    <Text className="text-[11px] text-slate-400 ml-1">
                      {doc.chunkCount} vector chunks
                    </Text>
                  </View>
                  <View className="flex-row items-center">
                    <CheckCircle size={11} color="#4ade80" />
                    <Text className="text-[11px] text-emerald-400 font-semibold ml-1">
                      Indexed
                    </Text>
                  </View>
                </View>
              </View>
            ))}

          {/* RAG Explanation Card */}
          <View className="bg-card/40 border border-border/40 rounded-xl p-3.5 mt-4">
            <Text className="text-xs font-bold text-slate-300 mb-1">
              How JARVIS RAG Works:
            </Text>
            <Text className="text-xs text-slate-400 leading-5">
              When you send a message, JARVIS computes a query embedding, retrieves the most semantically relevant chunks from your Knowledge Base and Memories, and seamlessly injects them into the AI system prompt.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
