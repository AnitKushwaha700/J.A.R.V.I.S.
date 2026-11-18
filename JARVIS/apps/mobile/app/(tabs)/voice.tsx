import React, { useState } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView } from 'react-native';
import { Mic, MicOff, Volume2, Sparkles } from 'lucide-react-native';

export default function VoiceScreen() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('Tap the microphone to speak with JARVIS.');

  const toggleMic = () => {
    if (!isListening) {
      setIsListening(true);
      setTranscript('Listening... Speak naturally.');
      setTimeout(() => {
        setTranscript('"Hello JARVIS, summarize today\'s top news."');
        setIsListening(false);
      }, 3000);
    } else {
      setIsListening(false);
      setTranscript('Paused. Tap the orb to resume.');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background justify-between py-10 px-6">
      {/* Top indicator */}
      <View className="items-center">
        <View className="flex-row items-center bg-card border border-border px-3.5 py-1.5 rounded-full">
          <Sparkles size={14} color="#38bdf8" />
          <Text className="text-primary text-xs font-semibold ml-2">
            Edge Neural Voice • Christopher
          </Text>
        </View>
        <Text className="text-2xl font-bold text-slate-100 mt-4">Voice Assistant</Text>
      </View>

      {/* Central Glowing Orb */}
      <View className="items-center justify-center my-8">
        <View
          className={`w-48 h-48 rounded-full items-center justify-center border-4 ${
            isListening
              ? 'border-neon bg-neon/10 shadow-2xl shadow-cyan-400'
              : 'border-primary/40 bg-card shadow-lg shadow-primary/20'
          }`}
        >
          <View
            className={`w-36 h-36 rounded-full items-center justify-center ${
              isListening ? 'bg-neon/20' : 'bg-primary/20'
            }`}
          >
            <TouchableOpacity
              onPress={toggleMic}
              className={`w-24 h-24 rounded-full items-center justify-center active:scale-95 ${
                isListening ? 'bg-cyan-400' : 'bg-primary'
              }`}
            >
              {isListening ? (
                <Mic size={40} color="#090d16" />
              ) : (
                <MicOff size={40} color="#090d16" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Live Transcript / Prompt Preview */}
      <View className="bg-card border border-border p-4 rounded-2xl items-center">
        <View className="flex-row items-center mb-1">
          <Volume2 size={16} color="#38bdf8" />
          <Text className="text-[11px] font-bold text-primary uppercase tracking-wider ml-1.5">
            {isListening ? 'LISTENING LIVE' : 'STATUS'}
          </Text>
        </View>
        <Text className="text-sm text-slate-200 text-center leading-6 mt-1">
          {transcript}
        </Text>
      </View>
    </SafeAreaView>
  );
}
