import React from 'react';
import { View, Text, TouchableOpacity, Linking } from 'react-native';
import { CitationCard } from '@jarvis/shared-types';
import { ExternalLink, BookOpen, Cloud, Coins, GitFork, FileText, Globe, Newspaper } from 'lucide-react-native';

interface CitationCardViewProps {
  card: CitationCard;
  index?: number;
}

export const CitationCardView = ({ card, index }: CitationCardViewProps) => {
  const handleOpenUrl = () => {
    if (card.url) {
      Linking.openURL(card.url).catch(() => {});
    }
  };

  const getSourceDetails = (source: string) => {
    const s = source.toLowerCase();
    if (s.includes('wiki')) {
      return {
        label: 'Wikipedia',
        color: 'text-blue-400',
        bg: 'bg-blue-500/10 border-blue-500/30',
        Icon: BookOpen,
      };
    }
    if (s.includes('meteo') || s.includes('weather')) {
      return {
        label: 'Open-Meteo',
        color: 'text-cyan-400',
        bg: 'bg-cyan-500/10 border-cyan-500/30',
        Icon: Cloud,
      };
    }
    if (s.includes('coingecko') || s.includes('crypto')) {
      return {
        label: 'CoinGecko',
        color: 'text-amber-400',
        bg: 'bg-amber-500/10 border-amber-500/30',
        Icon: Coins,
      };
    }
    if (s.includes('github')) {
      return {
        label: 'GitHub',
        color: 'text-purple-400',
        bg: 'bg-purple-500/10 border-purple-500/30',
        Icon: GitFork,
      };
    }
    if (s.includes('arxiv')) {
      return {
        label: 'arXiv.org',
        color: 'text-rose-400',
        bg: 'bg-rose-500/10 border-rose-500/30',
        Icon: FileText,
      };
    }
    if (s.includes('news') || s.includes('hacker')) {
      return {
        label: 'News / HN',
        color: 'text-emerald-400',
        bg: 'bg-emerald-500/10 border-emerald-500/30',
        Icon: Newspaper,
      };
    }
    return {
      label: source || 'Web Source',
      color: 'text-sky-400',
      bg: 'bg-sky-500/10 border-sky-500/30',
      Icon: Globe,
    };
  };

  const details = getSourceDetails(card.source);
  const IconComponent = details.Icon;
  const citationNumber = card.id || (index !== undefined ? `${index + 1}` : '1');

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={handleOpenUrl}
      className="bg-card border border-border rounded-xl p-3.5 mb-2.5 shadow-sm active:border-primary/50"
    >
      {/* Top Header Row */}
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center">
          {/* Index pill */}
          <View className="w-5 h-5 rounded-full bg-primary/20 items-center justify-center mr-2">
            <Text className="text-[10px] font-bold text-primary">{citationNumber}</Text>
          </View>

          {/* Source badge */}
          <View className={`flex-row items-center px-2 py-0.5 rounded-full border ${details.bg}`}>
            <IconComponent size={11} className={details.color} />
            <Text className={`text-[11px] font-semibold ml-1 ${details.color}`}>
              {details.label}
            </Text>
          </View>
        </View>

        <ExternalLink size={13} color="#94a3b8" />
      </View>

      {/* Card Title */}
      <Text className="text-slate-100 font-semibold text-sm leading-5 mb-1.5" numberOfLines={2}>
        {card.title}
      </Text>

      {/* Card Snippet */}
      <Text className="text-slate-400 text-xs leading-4 mb-2" numberOfLines={3}>
        {card.snippet}
      </Text>

      {/* Footer Details (Author / Date) */}
      {(card.author || card.publishedDate) && (
        <View className="flex-row items-center pt-1.5 border-t border-border/40">
          {card.author && (
            <Text className="text-[10px] text-slate-500 mr-3" numberOfLines={1}>
              By {card.author}
            </Text>
          )}
          {card.publishedDate && (
            <Text className="text-[10px] text-slate-500">
              {card.publishedDate.split('T')[0]}
            </Text>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};
