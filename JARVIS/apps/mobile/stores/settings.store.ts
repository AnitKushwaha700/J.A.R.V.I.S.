import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient, getDefaultServerUrl } from '../services/api.client';

interface SettingsState {
  serverUrl: string;
  defaultModel: string;
  voiceId: string;
  speechRate: number;
  autoSpeak: boolean;
  uiTheme: 'dark' | 'light';
  loadSettings: () => Promise<void>;
  setServerUrl: (url: string) => void;
  setDefaultModel: (model: string) => void;
  setVoiceId: (voice: string) => void;
  setSpeechRate: (rate: number) => void;
  setAutoSpeak: (val: boolean) => void;
  setUiTheme: (theme: 'dark' | 'light') => void;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  serverUrl: getDefaultServerUrl(),
  defaultModel: 'llama-3.3-70b-versatile',
  voiceId: 'en-US-ChristopherNeural',
  speechRate: 1.0,
  autoSpeak: true,
  uiTheme: 'dark',

  loadSettings: async () => {
    try {
      const saved = await AsyncStorage.getItem('@jarvis_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        set(parsed);
        if (parsed.serverUrl) {
          apiClient.setServerUrl(parsed.serverUrl);
        }
      }
    } catch {}
  },

  setServerUrl: (serverUrl: string) => {
    apiClient.setServerUrl(serverUrl);
    set({ serverUrl });
    AsyncStorage.setItem('@jarvis_settings', JSON.stringify({ ...get(), serverUrl }));
  },

  setDefaultModel: (defaultModel: string) => {
    set({ defaultModel });
    AsyncStorage.setItem('@jarvis_settings', JSON.stringify({ ...get(), defaultModel }));
  },

  setVoiceId: (voiceId: string) => {
    set({ voiceId });
    AsyncStorage.setItem('@jarvis_settings', JSON.stringify({ ...get(), voiceId }));
  },

  setSpeechRate: (speechRate: number) => {
    set({ speechRate });
    AsyncStorage.setItem('@jarvis_settings', JSON.stringify({ ...get(), speechRate }));
  },

  setAutoSpeak: (autoSpeak: boolean) => {
    set({ autoSpeak });
    AsyncStorage.setItem('@jarvis_settings', JSON.stringify({ ...get(), autoSpeak }));
  },

  setUiTheme: (uiTheme: 'dark' | 'light') => {
    set({ uiTheme });
    AsyncStorage.setItem('@jarvis_settings', JSON.stringify({ ...get(), uiTheme }));
  },
}));
