import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Bot, Mail, Lock, AlertCircle, ArrowRight } from 'lucide-react-native';
import { useAuthStore } from '../../stores/auth.store';

export default function LoginScreen() {
  const router = useRouter();
  const { login, isLoading, error, clearError } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) return;
    const success = await login(email.trim(), password);
    if (success) {
      router.replace('/(tabs)');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-background justify-center px-6"
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
        {/* Logo / Title */}
        <View className="items-center mb-8">
          <View className="w-16 h-16 rounded-2xl bg-primary/20 border border-primary/40 items-center justify-center mb-3">
            <Bot size={36} color="#38bdf8" />
          </View>
          <Text className="text-3xl font-extrabold text-slate-100 tracking-tight">
            JARVIS
          </Text>
          <Text className="text-sm text-secondary mt-1">
            Personal Multimodal AI Operating System
          </Text>
        </View>

        {/* Error Alert */}
        {error && (
          <View className="flex-row items-center bg-red-500/10 border border-red-500/30 p-3 rounded-xl mb-4">
            <AlertCircle size={18} color="#ef4444" />
            <Text className="text-xs text-red-400 font-medium ml-2 flex-1">
              {error}
            </Text>
          </View>
        )}

        {/* Email Input */}
        <View className="mb-4">
          <Text className="text-xs font-semibold text-slate-300 mb-1.5 ml-1">
            EMAIL ADDRESS
          </Text>
          <View className="flex-row items-center bg-card border border-border rounded-xl px-3.5 py-3">
            <Mail size={18} color="#64748b" />
            <TextInput
              value={email}
              onChangeText={(t) => {
                setEmail(t);
                if (error) clearError();
              }}
              placeholder="name@example.com"
              placeholderTextColor="#64748b"
              autoCapitalize="none"
              keyboardType="email-address"
              className="flex-1 ml-2.5 text-sm text-slate-100"
            />
          </View>
        </View>

        {/* Password Input */}
        <View className="mb-6">
          <Text className="text-xs font-semibold text-slate-300 mb-1.5 ml-1">
            PASSWORD
          </Text>
          <View className="flex-row items-center bg-card border border-border rounded-xl px-3.5 py-3">
            <Lock size={18} color="#64748b" />
            <TextInput
              value={password}
              onChangeText={(t) => {
                setPassword(t);
                if (error) clearError();
              }}
              placeholder="••••••••"
              placeholderTextColor="#64748b"
              secureTextEntry
              className="flex-1 ml-2.5 text-sm text-slate-100"
            />
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          onPress={handleLogin}
          disabled={isLoading}
          className="bg-primary py-3.5 rounded-xl items-center justify-center flex-row shadow-lg active:scale-98"
        >
          {isLoading ? (
            <ActivityIndicator color="#090d16" />
          ) : (
            <>
              <Text className="text-slate-950 font-bold text-sm mr-2">
                Sign In to JARVIS
              </Text>
              <ArrowRight size={16} color="#090d16" />
            </>
          )}
        </TouchableOpacity>

        {/* Skip / Continue as Guest */}
        <TouchableOpacity
          onPress={() => router.replace('/(tabs)')}
          className="mt-4 py-2 items-center"
        >
          <Text className="text-xs text-secondary font-medium">
            Continue as Guest (Offline Mode)
          </Text>
        </TouchableOpacity>

        {/* Switch to Register */}
        <View className="flex-row justify-center mt-8">
          <Text className="text-xs text-secondary">Don't have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
            <Text className="text-xs text-primary font-bold">Create Account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
