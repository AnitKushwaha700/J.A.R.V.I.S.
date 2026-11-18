import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Settings, Server, Volume2, ShieldCheck, LogOut, Check } from 'lucide-react-native';
import { useSettingsStore } from '../../stores/settings.store';
import { useAuthStore } from '../../stores/auth.store';
import { useRouter } from 'expo-router';

export default function SettingsScreen() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { serverUrl, setServerUrl, voiceId, setVoiceId, defaultModel, setDefaultModel } =
    useSettingsStore();

  const [inputUrl, setInputUrl] = useState(serverUrl);
  const [savedUrl, setSavedUrl] = useState(false);

  const handleSaveUrl = () => {
    setServerUrl(inputUrl.trim());
    setSavedUrl(true);
    setTimeout(() => setSavedUrl(false), 2000);
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  return (
    <SafeAreaView className="flex-1 bg-background px-4 py-4">
      <View className="flex-row items-center pb-3 border-b border-border mb-4">
        <Settings size={24} color="#38bdf8" />
        <Text className="text-lg font-bold text-slate-100 ml-2">System Settings</Text>
      </View>

      <ScrollView className="flex-1">
        {/* User Card */}
        <View className="bg-card border border-border p-4 rounded-2xl mb-4">
          <Text className="text-xs font-bold text-secondary uppercase tracking-wider mb-2">
            ACCOUNT PROFILE
          </Text>
          {isAuthenticated && user ? (
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-base font-bold text-slate-100">{user.name}</Text>
                <Text className="text-xs text-secondary mt-0.5">{user.email}</Text>
              </View>
              <TouchableOpacity
                onPress={handleLogout}
                className="flex-row items-center px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/30"
              >
                <LogOut size={14} color="#ef4444" />
                <Text className="text-xs text-red-400 font-bold ml-1.5">Sign Out</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="flex-row items-center justify-between">
              <Text className="text-sm text-slate-300">Guest User (Local Session)</Text>
              <TouchableOpacity
                onPress={() => router.push('/(auth)/login')}
                className="px-3 py-1.5 rounded-lg bg-primary/20 border border-primary/40"
              >
                <Text className="text-xs text-primary font-bold">Sign In</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Backend API Server URL */}
        <View className="bg-card border border-border p-4 rounded-2xl mb-4">
          <View className="flex-row items-center mb-2">
            <Server size={16} color="#38bdf8" />
            <Text className="text-xs font-bold text-slate-200 ml-2">BACKEND API URL</Text>
          </View>
          <Text className="text-xs text-secondary mb-3 leading-5">
            Default for Android emulator: http://10.0.2.2:3001/api {'\n'}
            Default for iOS / Web: http://localhost:3001/api
          </Text>

          <View className="flex-row items-center space-x-2">
            <TextInput
              value={inputUrl}
              onChangeText={setInputUrl}
              className="flex-1 bg-background border border-border rounded-xl px-3.5 py-2.5 text-xs text-slate-100 font-mono"
            />
            <TouchableOpacity
              onPress={handleSaveUrl}
              className="bg-primary px-3.5 py-2.5 rounded-xl ml-2 flex-row items-center"
            >
              {savedUrl ? <Check size={14} color="#090d16" /> : <Text className="text-xs font-bold text-slate-950">Save</Text>}
            </TouchableOpacity>
          </View>
        </View>

        {/* Free Tier Providers Guide */}
        <View className="bg-card border border-border p-4 rounded-2xl mb-4">
          <View className="flex-row items-center mb-2">
            <ShieldCheck size={16} color="#4ade80" />
            <Text className="text-xs font-bold text-slate-200 ml-2">ACTIVE AI PROVIDERS</Text>
          </View>

          <View className="space-y-2 mt-2">
            <View className="flex-row items-center justify-between py-1.5 border-b border-border/40">
              <Text className="text-xs text-slate-300 font-medium">Groq Cloud (Llama 3.3 70B)</Text>
              <Text className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">
                FREE • ~200ms
              </Text>
            </View>

            <View className="flex-row items-center justify-between py-1.5 border-b border-border/40">
              <Text className="text-xs text-slate-300 font-medium">Google Gemini 2.0 Flash</Text>
              <Text className="text-[10px] text-purple-400 font-bold bg-purple-500/10 px-2 py-0.5 rounded">
                FREE • 1M CONTEXT
              </Text>
            </View>

            <View className="flex-row items-center justify-between py-1.5 border-b border-border/40">
              <Text className="text-xs text-slate-300 font-medium">OpenRouter (DeepSeek R1)</Text>
              <Text className="text-[10px] text-blue-400 font-bold bg-blue-500/10 px-2 py-0.5 rounded">
                FREE TIER
              </Text>
            </View>

            <View className="flex-row items-center justify-between py-1.5">
              <Text className="text-xs text-slate-300 font-medium">Ollama (Local Models)</Text>
              <Text className="text-[10px] text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded">
                OFFLINE • HARDWARE
              </Text>
            </View>
          </View>
        </View>

        {/* Voice Configuration */}
        <View className="bg-card border border-border p-4 rounded-2xl mb-6">
          <View className="flex-row items-center mb-2">
            <Volume2 size={16} color="#38bdf8" />
            <Text className="text-xs font-bold text-slate-200 ml-2">VOICE SYNTHESIS ENGINE</Text>
          </View>
          <Text className="text-xs text-secondary leading-5">
            Voice: Microsoft Edge-TTS Neural (Zero server cost, natural human cadence)
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
