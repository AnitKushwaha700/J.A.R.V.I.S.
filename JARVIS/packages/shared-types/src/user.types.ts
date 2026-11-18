export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  role: 'USER' | 'ADMIN';
  createdAt: string;
}

export interface UserPreferences {
  defaultModel: string;
  defaultProvider: string;
  voiceId: string;
  speechRate: number;
  autoSpeak: boolean;
  uiTheme: 'dark' | 'light';
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: Omit<UserProfile, 'role'>;
  accessToken: string;
  refreshToken: string;
}
