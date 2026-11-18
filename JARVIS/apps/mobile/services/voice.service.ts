import { apiClient } from './api.client';

export interface VoiceProfile {
  key: string;
  voiceId: string;
  name: string;
  description: string;
}

class VoiceEngine {
  private currentAudio: HTMLAudioElement | null = null;
  private isSpeaking = false;

  async getVoices(): Promise<VoiceProfile[]> {
    try {
      return await apiClient.request<VoiceProfile[]>('voice/voices');
    } catch {
      return [];
    }
  }

  async transcribe(audioBlob: Blob): Promise<{ text: string; language: string; duration: number }> {
    const serverUrl = apiClient.getServerUrl();
    const token = await apiClient.getAccessToken();

    const formData = new FormData();
    formData.append('file', audioBlob as any, 'recording.m4a');

    const response = await fetch(`${serverUrl}/voice/stt`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`STT failed (${response.status}): ${errText}`);
    }

    const data = await response.json();
    return (data.data || data) as { text: string; language: string; duration: number };
  }

  stopSpeaking() {
    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
      } catch {}
      this.currentAudio = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.isSpeaking = false;
  }

  async speak(text: string, voice = 'jarvis'): Promise<void> {
    this.stopSpeaking();
    if (!text.trim()) return;

    this.isSpeaking = true;
    const serverUrl = apiClient.getServerUrl();

    try {
      const response = await fetch(`${serverUrl}/voice/tts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice }),
      });

      if (!response.ok) {
        throw new Error(`TTS server returned status ${response.status}`);
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      return new Promise<void>((resolve, reject) => {
        const audio = new Audio(audioUrl);
        this.currentAudio = audio;

        audio.onended = () => {
          this.isSpeaking = false;
          this.currentAudio = null;
          URL.revokeObjectURL(audioUrl);
          resolve();
        };

        audio.onerror = (e) => {
          this.isSpeaking = false;
          this.currentAudio = null;
          URL.revokeObjectURL(audioUrl);
          reject(e);
        };

        audio.play().catch((err) => {
          this.isSpeaking = false;
          // Fallback to browser Web Speech API if Audio autoplay is blocked
          if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            const utter = new SpeechSynthesisUtterance(text);
            utter.onend = () => resolve();
            window.speechSynthesis.speak(utter);
          } else {
            resolve();
          }
        });
      });
    } catch {
      // Fallback to browser Web Speech API
      this.isSpeaking = false;
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        const utter = new SpeechSynthesisUtterance(text);
        window.speechSynthesis.speak(utter);
      }
    }
  }

  getSpeakingStatus(): boolean {
    return this.isSpeaking;
  }
}

export const voiceEngine = new VoiceEngine();
export const voiceService = voiceEngine;
