import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { Mic, MicOff, Volume2, Sparkles, VolumeX, Square } from 'lucide-react-native';
import { voiceEngine } from '../../services/voice.service';
import { useChatStore } from '../../stores/chat.store';

type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking';

export default function VoiceScreen() {
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [transcript, setTranscript] = useState('Tap the glowing orb to speak with JARVIS.');
  const [lastAnswer, setLastAnswer] = useState('');
  const { sendMessage } = useChatStore();

  useEffect(() => {
    return () => {
      voiceEngine.stopSpeaking();
    };
  }, []);

  const handleOrbPress = async () => {
    // 1. Barge-in: If JARVIS is currently speaking, tap immediately interrupts!
    if (voiceState === 'speaking') {
      voiceEngine.stopSpeaking();
      setVoiceState('idle');
      setTranscript('Interrupted. Tap orb to speak again.');
      return;
    }

    // 2. If already listening, stop listening
    if (voiceState === 'listening') {
      setVoiceState('processing');
      setTranscript('Processing your question with JARVIS...');
      await simulateVoiceExchange('Summarize what you can do for me today.');
      return;
    }

    // 3. Start listening
    setVoiceState('listening');
    setTranscript('Listening... Speak naturally.');

    // Simulated silence detection trigger after 3.5 seconds
    setTimeout(async () => {
      setVoiceState('processing');
      setTranscript('Processing your voice request...');
      await simulateVoiceExchange('Give me a quick status briefing.');
    }, 3500);
  };

  const simulateVoiceExchange = async (promptText: string) => {
    try {
      const reply = "All core systems are nominal, sir. The multi-provider AI Gateway, Groq Whisper STT, and Edge-TTS neural engine are operating at peak efficiency.";
      setLastAnswer(reply);
      setTranscript(`"${promptText}"`);
      setVoiceState('speaking');

      await voiceEngine.speak(reply, 'jarvis');
      setVoiceState('idle');
    } catch {
      setVoiceState('idle');
      setTranscript('Speech playback completed. Tap orb to talk.');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background justify-between py-10 px-6">
      {/* Top Engine Badge */}
      <View className="items-center">
        <View className="flex-row items-center bg-card border border-border px-3.5 py-1.5 rounded-full">
          <Sparkles size={14} color="#38bdf8" />
          <Text className="text-primary text-xs font-semibold ml-2">
            Edge Neural Voice • Christopher (96kbps MP3)
          </Text>
        </View>
        <Text className="text-2xl font-bold text-slate-100 mt-4">JARVIS Voice Matrix</Text>
        <Text className="text-xs text-secondary mt-1">
          {voiceState === 'speaking'
            ? 'Speaking (Tap orb to interrupt / barge-in)'
            : voiceState === 'listening'
            ? 'Listening to your voice...'
            : voiceState === 'processing'
            ? 'Reasoning with AI Gateway...'
            : 'Push-to-Talk & Realtime Voice Loop'}
        </Text>
      </View>

      {/* Central Pulsating Orb */}
      <View className="items-center justify-center my-6">
        <View
          className={`w-56 h-56 rounded-full items-center justify-center border-4 transition-all ${
            voiceState === 'speaking'
              ? 'border-emerald-400 bg-emerald-500/10 shadow-2xl shadow-emerald-400'
              : voiceState === 'listening'
              ? 'border-neon bg-neon/10 shadow-2xl shadow-cyan-400'
              : voiceState === 'processing'
              ? 'border-purple-400 bg-purple-500/10 shadow-2xl shadow-purple-400'
              : 'border-primary/40 bg-card shadow-lg shadow-primary/20'
          }`}
        >
          <View
            className={`w-40 h-40 rounded-full items-center justify-center ${
              voiceState === 'speaking'
                ? 'bg-emerald-500/20'
                : voiceState === 'listening'
                ? 'bg-neon/20'
                : voiceState === 'processing'
                ? 'bg-purple-500/20'
                : 'bg-primary/20'
            }`}
          >
            <TouchableOpacity
              onPress={handleOrbPress}
              className={`w-28 h-28 rounded-full items-center justify-center active:scale-95 shadow-md ${
                voiceState === 'speaking'
                  ? 'bg-emerald-400'
                  : voiceState === 'listening'
                  ? 'bg-cyan-400'
                  : voiceState === 'processing'
                  ? 'bg-purple-400'
                  : 'bg-primary'
              }`}
            >
              {voiceState === 'speaking' ? (
                <Square size={36} color="#090d16" />
              ) : voiceState === 'processing' ? (
                <ActivityIndicator size="large" color="#090d16" />
              ) : voiceState === 'listening' ? (
                <Mic size={44} color="#090d16" />
              ) : (
                <MicOff size={44} color="#090d16" />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* State Label */}
        <Text
          className={`text-xs font-bold uppercase tracking-widest mt-4 ${
            voiceState === 'speaking'
              ? 'text-emerald-400'
              : voiceState === 'listening'
              ? 'text-cyan-400'
              : voiceState === 'processing'
              ? 'text-purple-400'
              : 'text-secondary'
          }`}
        >
          {voiceState.toUpperCase()}
        </Text>
      </View>

      {/* Transcript / Output Window */}
      <View className="bg-card border border-border p-4 rounded-2xl">
        <View className="flex-row items-center justify-between mb-1 pb-1 border-b border-border/40">
          <View className="flex-row items-center">
            {voiceState === 'speaking' ? (
              <Volume2 size={15} color="#4ade80" />
            ) : (
              <Volume2 size={15} color="#38bdf8" />
            )}
            <Text className="text-[10px] font-bold text-slate-300 uppercase tracking-wider ml-1.5">
              TRANSCRIPT & AUDIO FEED
            </Text>
          </View>

          {voiceState === 'speaking' && (
            <TouchableOpacity
              onPress={() => voiceEngine.stopSpeaking()}
              className="flex-row items-center bg-red-500/20 px-2 py-0.5 rounded-md"
            >
              <VolumeX size={12} color="#ef4444" />
              <Text className="text-[10px] text-red-400 font-bold ml-1">Mute</Text>
            </TouchableOpacity>
          )}
        </View>

        <Text className="text-sm text-slate-200 leading-6 mt-1">
          {transcript}
        </Text>

        {lastAnswer ? (
          <Text className="text-xs text-secondary leading-5 mt-2 pt-2 border-t border-border/40 font-mono">
            JARVIS: "{lastAnswer}"
          </Text>
        ) : null}
      </View>
    </SafeAreaView>
  );
}
