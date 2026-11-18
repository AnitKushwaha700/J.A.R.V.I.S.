import { create } from 'zustand';
import { UserProfile, AuthResponse } from '@jarvis/shared-types';
import { apiClient } from '../services/api.client';
import AsyncStorage from '@react-native-async-storage/async-storage';

const USER_STORAGE_KEY = '@jarvis_user_profile';

interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  clearError: () => set({ error: null }),

  checkAuth: async () => {
    try {
      await apiClient.init();
      const token = await apiClient.getAccessToken();
      const savedUser = await AsyncStorage.getItem(USER_STORAGE_KEY);

      if (token && savedUser) {
        set({
          user: JSON.parse(savedUser),
          isAuthenticated: true,
          isLoading: false,
        });
        // Refresh profile in background
        apiClient
          .request<UserProfile>('users/me')
          .then((fresh) => {
            set({ user: fresh });
            AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(fresh));
          })
          .catch(() => {});
      } else {
        set({ user: null, isAuthenticated: false, isLoading: false });
      }
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const data = await apiClient.request<AuthResponse>('auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      await apiClient.setTokens(data.accessToken, data.refreshToken);
      const profile = { ...data.user, role: 'USER' as const };
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(profile));

      set({
        user: profile,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
      return true;
    } catch (err: unknown) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : 'Login failed',
      });
      return false;
    }
  },

  register: async (name: string, email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const data = await apiClient.request<AuthResponse>('auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password }),
      });

      await apiClient.setTokens(data.accessToken, data.refreshToken);
      const profile = { ...data.user, role: 'USER' as const };
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(profile));

      set({
        user: profile,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
      return true;
    } catch (err: unknown) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : 'Registration failed',
      });
      return false;
    }
  },

  logout: async () => {
    try {
      const refreshToken = await apiClient.getRefreshToken();
      if (refreshToken) {
        await apiClient.request('auth/logout', {
          method: 'POST',
          body: JSON.stringify({ refreshToken }),
        }).catch(() => {});
      }
    } finally {
      await apiClient.clearTokens();
      await AsyncStorage.removeItem(USER_STORAGE_KEY);
      set({ user: null, isAuthenticated: false });
    }
  },
}));
