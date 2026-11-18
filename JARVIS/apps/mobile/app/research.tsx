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
import { useRouter } from 'expo-router';
import {
  Search,
  ArrowLeft,
  Sparkles,
  X,
  Clock,
  Layers,
  BookOpen,
  Cloud,
  Coins,
  GitFork,
  FileText,
  Newspaper,
} from 'lucide-react-native';
import { apiClient } from '../services/api.client';
import { CitationCardView } from '../components/CitationCardView';
import { CitationCard, ResearchSearchResult, SearchSource } from '@jarvis/shared-types';

export default function ResearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ResearchSearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filterSources: { id: string; label: string; Icon: any }[] = [
    { id: 'all', label: 'All Sources', Icon: Layers },
    { id: 'wikipedia', label: 'Wikipedia', Icon: BookOpen },
    { id: 'openmeteo', label: 'Weather', Icon: Cloud },
    { id: 'coingecko', label: 'Crypto', Icon: Coins },
    { id: 'github', label: 'GitHub', Icon: GitFork },
    { id: 'arxiv', label: 'arXiv Papers', Icon: FileText },
    { id: 'news', label: 'News', Icon: Newspaper },
  ];

  const suggestions = [
    { label: '🌦️ Weather in Tokyo', q: 'Weather in Tokyo' },
    { label: '₿ Bitcoin Price in USD', q: 'Price of Bitcoin in USD' },
    { label: '⚛️ React Repositories', q: 'React web frameworks on GitHub' },
    { label: '🔬 Quantum LLMs', q: 'Quantum computing and LLMs on arXiv' },
    { label: '📚 AGI Overview', q: 'Artificial General Intelligence definition and milestones' },
  ];

  const handleSearch = async (searchQuery?: string) => {
    const q = (searchQuery || query).trim();
    if (!q) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const sourcesParam: SearchSource[] | undefined =
        selectedSource === 'all' ? undefined : ([selectedSource] as SearchSource[]);

      const data = await apiClient.searchResearch({
        query: q,
        sources: sourcesParam,
        synthesize: true,
        maxResultsPerSource: 5,
      });

      setResult(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Research query failed.');
    } finally {
      setLoading(false);
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
              <Text className="text-white font-bold text-base">JARVIS Research</Text>
              <Text className="text-slate-400 text-xs">Live public APIs & AI synthesis</Text>
            </View>
          </View>
        </View>

        {/* Search Bar Input */}
        <View className="p-4 bg-card/40 border-b border-border/50">
          <View className="flex-row items-center bg-background border border-border rounded-xl px-3.5 py-2">
            <Search size={18} color="#94a3b8" />
            <TextInput
              className="flex-1 text-slate-100 text-sm ml-2.5 mr-2 py-0"
              placeholder="Ask anything or search weather, crypto, repos..."
              placeholderTextColor="#64748b"
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={() => handleSearch()}
              returnKeyType="search"
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => setQuery('')} className="p-1 mr-1">
                <X size={15} color="#64748b" />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={() => handleSearch()}
              disabled={loading || !query.trim()}
              className={`px-3 py-1.5 rounded-lg ${
                query.trim() && !loading ? 'bg-primary' : 'bg-primary/30'
              }`}
            >
              <Text className="text-slate-950 font-bold text-xs">Search</Text>
            </TouchableOpacity>
          </View>

          {/* Source Filter Pills */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="flex-row mt-3 -mx-1"
          >
            {filterSources.map((s) => {
              const active = selectedSource === s.id;
              const IconComp = s.Icon;
              return (
                <TouchableOpacity
                  key={s.id}
                  onPress={() => setSelectedSource(s.id)}
                  className={`flex-row items-center px-3 py-1.5 rounded-full mx-1 border ${
                    active
                      ? 'bg-primary/20 border-primary text-primary'
                      : 'bg-background/80 border-border text-slate-400'
                  }`}
                >
                  <IconComp size={12} color={active ? '#38bdf8' : '#94a3b8'} />
                  <Text
                    className={`text-xs ml-1.5 font-medium ${
                      active ? 'text-primary font-semibold' : 'text-slate-400'
                    }`}
                  >
                    {s.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Content Body */}
        <ScrollView className="flex-1 px-4 py-3" showsVerticalScrollIndicator={false}>
          {/* Loading Indicator */}
          {loading && (
            <View className="py-12 items-center justify-center">
              <ActivityIndicator size="large" color="#38bdf8" />
              <Text className="text-slate-300 font-semibold text-sm mt-3">
                Querying verified public sources...
              </Text>
              <Text className="text-slate-500 text-xs mt-1">
                Aggregating citations & generating AI synthesis
              </Text>
            </View>
          )}

          {/* Error Message */}
          {error && (
            <View className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 my-3">
              <Text className="text-red-400 font-semibold text-sm">Search Error</Text>
              <Text className="text-red-300 text-xs mt-1">{error}</Text>
            </View>
          )}

          {/* Default Suggestions (when no results yet) */}
          {!loading && !result && !error && (
            <View className="py-2">
              <Text className="text-xs uppercase font-bold tracking-wider text-slate-400 mb-2.5">
                Suggested Research Queries
              </Text>
              {suggestions.map((item, idx) => (
                <TouchableOpacity
                  key={idx}
                  onPress={() => {
                    setQuery(item.q);
                    handleSearch(item.q);
                  }}
                  className="bg-card border border-border rounded-xl p-3 mb-2 flex-row items-center justify-between active:bg-border/60"
                >
                  <Text className="text-slate-200 text-sm font-medium">{item.label}</Text>
                  <Search size={14} color="#64748b" />
                </TouchableOpacity>
              ))}

              {/* Supported Public Sources Info Card */}
              <View className="bg-card/50 border border-border/40 rounded-xl p-4 mt-4">
                <Text className="text-slate-200 font-semibold text-xs uppercase mb-2">
                  Connected Zero-Key Public APIs
                </Text>
                <Text className="text-slate-400 text-xs leading-5">
                  • <Text className="text-cyan-400 font-semibold">Open-Meteo</Text>: Global real-time weather & forecasts{'\n'}
                  • <Text className="text-amber-400 font-semibold">CoinGecko</Text>: Live cryptocurrency market prices & changes{'\n'}
                  • <Text className="text-blue-400 font-semibold">Wikipedia REST</Text>: High-accuracy encyclopedia summaries{'\n'}
                  • <Text className="text-purple-400 font-semibold">GitHub API</Text>: Open-source repositories & stars{'\n'}
                  • <Text className="text-rose-400 font-semibold">arXiv.org</Text>: Pre-print academic & scientific research papers{'\n'}
                  • <Text className="text-emerald-400 font-semibold">Hacker News</Text>: Top tech discussions & news stories
                </Text>
              </View>
            </View>
          )}

          {/* Results Presentation */}
          {result && (
            <View className="pb-8">
              {/* Meta stats bar */}
              <View className="flex-row items-center justify-between mb-3 bg-card/60 border border-border px-3 py-2 rounded-lg">
                <View className="flex-row items-center">
                  <Layers size={13} color="#94a3b8" />
                  <Text className="text-[11px] text-slate-400 ml-1.5">
                    Sources: {result.sourcesUsed.join(', ') || 'Public APIs'}
                  </Text>
                </View>
                <View className="flex-row items-center">
                  <Clock size={13} color="#94a3b8" />
                  <Text className="text-[11px] text-slate-400 ml-1">
                    {result.latencyMs}ms
                  </Text>
                </View>
              </View>

              {/* AI Synthesis Card */}
              {result.summary && (
                <View className="bg-gradient-to-b from-card to-card/90 border border-primary/30 rounded-2xl p-4 mb-4 shadow-lg">
                  <View className="flex-row items-center mb-2 pb-2 border-b border-border/50">
                    <View className="w-6 h-6 rounded-full bg-primary/20 items-center justify-center mr-2">
                      <Sparkles size={14} color="#38bdf8" />
                    </View>
                    <Text className="text-primary font-bold text-sm">
                      JARVIS Research Synthesis
                    </Text>
                  </View>
                  <Text className="text-slate-100 text-sm leading-6" selectable>
                    {result.summary}
                  </Text>
                </View>
              )}

              {/* Citation Cards Section */}
              <Text className="text-xs uppercase font-bold tracking-wider text-slate-400 mb-2.5">
                Verified Sources ({result.citations.length})
              </Text>

              {result.citations.map((card: CitationCard, idx: number) => (
                <CitationCardView key={card.id || idx} card={card} index={idx} />
              ))}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
