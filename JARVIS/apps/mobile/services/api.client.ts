import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import {
  ResearchSearchResult,
  SearchSource,
  WeatherData,
  CryptoData,
  WikiData,
  GitHubData,
  ArXivData,
  CitationCard,
} from '@jarvis/shared-types';

const STORAGE_KEY_TOKEN = '@jarvis_access_token';
const STORAGE_KEY_REFRESH = '@jarvis_refresh_token';
const STORAGE_KEY_SERVER = '@jarvis_server_url';

export const getDefaultServerUrl = (): string => {
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3001/api';
  }
  return 'http://localhost:3001/api';
};

class ApiClient {
  private serverUrl: string = getDefaultServerUrl();

  async init() {
    const saved = await AsyncStorage.getItem(STORAGE_KEY_SERVER);
    if (saved) this.serverUrl = saved;
  }

  setServerUrl(url: string) {
    this.serverUrl = url;
    AsyncStorage.setItem(STORAGE_KEY_SERVER, url);
  }

  getServerUrl(): string {
    return this.serverUrl;
  }

  async getAccessToken(): Promise<string | null> {
    return AsyncStorage.getItem(STORAGE_KEY_TOKEN);
  }

  async getRefreshToken(): Promise<string | null> {
    return AsyncStorage.getItem(STORAGE_KEY_REFRESH);
  }

  async setTokens(accessToken: string, refreshToken: string) {
    await AsyncStorage.setItem(STORAGE_KEY_TOKEN, accessToken);
    await AsyncStorage.setItem(STORAGE_KEY_REFRESH, refreshToken);
  }

  async clearTokens() {
    await AsyncStorage.removeItem(STORAGE_KEY_TOKEN);
    await AsyncStorage.removeItem(STORAGE_KEY_REFRESH);
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = await this.getAccessToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    const url = `${this.serverUrl}/${cleanEndpoint}`;

    let response = await fetch(url, {
      ...options,
      headers,
    });

    // Auto-refresh token on 401
    if (response.status === 401) {
      const refreshToken = await this.getRefreshToken();
      if (refreshToken) {
        try {
          const refreshRes = await fetch(`${this.serverUrl}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
          });
          if (refreshRes.ok) {
            const data = (await refreshRes.json()) as any;
            const newTokens = data.data || data;
            await this.setTokens(newTokens.accessToken, newTokens.refreshToken);
            headers['Authorization'] = `Bearer ${newTokens.accessToken}`;
            response = await fetch(url, { ...options, headers });
          } else {
            await this.clearTokens();
          }
        } catch {
          await this.clearTokens();
        }
      }
    }

    if (!response.ok) {
      const errorBody = await response.text();
      let errorMsg = `HTTP Error ${response.status}`;
      try {
        const parsed = JSON.parse(errorBody);
        errorMsg = parsed.message || errorMsg;
      } catch {}
      throw new Error(errorMsg);
    }

    const json = await response.json();
    return (json.data !== undefined ? json.data : json) as T;
  }

  async streamChat(params: {
    conversationId: string;
    content: string;
    model?: string;
    systemPrompt?: string;
    onChunk: (delta: string) => void;
    onComplete: (fullText: string) => void;
    onError: (err: Error) => void;
  }): Promise<void> {
    const token = await this.getAccessToken();
    const cleanEndpoint = `conversations/${params.conversationId}/messages`;
    const url = `${this.serverUrl}/${cleanEndpoint}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          content: params.content,
          model: params.model,
          systemPrompt: params.systemPrompt,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Server returned ${response.status}: ${errText}`);
      }

      if (!response.body) {
        // Fallback for environments where body is not streamable
        const text = await response.text();
        params.onChunk(text);
        params.onComplete(text);
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed === 'data: [DONE]') continue;
          if (trimmed.startsWith('data: ')) {
            try {
              const parsed = JSON.parse(trimmed.slice(6));
              if (parsed.delta) {
                accumulated += parsed.delta;
                params.onChunk(parsed.delta);
              }
              if (parsed.error) {
                throw new Error(parsed.error);
              }
            } catch (jsonErr) {
              // ignore partial json
            }
          }
        }
      }

      params.onComplete(accumulated);
    } catch (err: unknown) {
      params.onError(err instanceof Error ? err : new Error(String(err)));
    }
  }

  // --- Web Research & Public APIs ---

  async searchResearch(params: {
    query: string;
    sources?: SearchSource[];
    synthesize?: boolean;
    maxResultsPerSource?: number;
    model?: string;
  }): Promise<ResearchSearchResult> {
    return this.request<ResearchSearchResult>('research/search', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async getWeather(location: string): Promise<WeatherData> {
    return this.request<WeatherData>(`research/weather?location=${encodeURIComponent(location)}`);
  }

  async getCrypto(coin: string, currency: string = 'usd'): Promise<CryptoData> {
    return this.request<CryptoData>(
      `research/crypto?coin=${encodeURIComponent(coin)}&currency=${encodeURIComponent(currency)}`,
    );
  }

  async getWiki(query: string): Promise<WikiData> {
    return this.request<WikiData>(`research/wiki?query=${encodeURIComponent(query)}`);
  }

  async getGitHub(query: string, limit: number = 5): Promise<GitHubData> {
    return this.request<GitHubData>(
      `research/github?query=${encodeURIComponent(query)}&limit=${limit}`,
    );
  }

  async getArXiv(query: string, limit: number = 5): Promise<ArXivData> {
    return this.request<ArXivData>(
      `research/arxiv?query=${encodeURIComponent(query)}&limit=${limit}`,
    );
  }

  async getNews(query: string, limit: number = 5): Promise<CitationCard[]> {
    return this.request<CitationCard[]>(
      `research/news?query=${encodeURIComponent(query)}&limit=${limit}`,
    );
  }
}

export const apiClient = new ApiClient();
