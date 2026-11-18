import {
  Injectable,
  BadRequestException,
  ServiceUnavailableException,
  Logger,
} from '@nestjs/common';
import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';
import Groq, { toFile } from 'groq-sdk';
import { Response } from 'express';

export const VOICE_PROFILES: Record<string, { voiceId: string; name: string; description: string }> = {
  jarvis: {
    voiceId: 'en-US-ChristopherNeural',
    name: 'JARVIS (Default)',
    description: 'Crisp, authoritative, intelligent British/American tone',
  },
  friday: {
    voiceId: 'en-US-JennyNeural',
    name: 'FRIDAY',
    description: 'Warm, natural, conversational female voice',
  },
  mentor: {
    voiceId: 'en-GB-RyanNeural',
    name: 'British Mentor',
    description: 'Professional British English accent, ideal for interviews',
  },
  coach: {
    voiceId: 'en-US-GuyNeural',
    name: 'English Coach',
    description: 'Energetic, friendly conversational tone',
  },
  hindi: {
    voiceId: 'en-IN-PrabhatNeural',
    name: 'Indian English',
    description: 'Clear Indian English pronunciation',
  },
  'hindi-native': {
    voiceId: 'hi-IN-MadhurNeural',
    name: 'Hindi Native',
    description: 'Native Hindi neural voice',
  },
};

@Injectable()
export class VoiceService {
  private readonly logger = new Logger(VoiceService.name);

  getVoiceProfiles() {
    return Object.entries(VOICE_PROFILES).map(([key, value]) => ({
      key,
      ...value,
    }));
  }

  async synthesizeSpeech(text: string, requestedVoice: string | undefined, res: Response): Promise<void> {
    if (!text || !text.trim()) {
      throw new BadRequestException('Text is required for speech synthesis.');
    }

    const sanitizedText = text.trim().slice(0, 3000);
    const profile = VOICE_PROFILES[requestedVoice?.toLowerCase() || ''] || VOICE_PROFILES['jarvis'];
    const voiceId = profile.voiceId || process.env.EDGE_TTS_VOICE || 'en-US-ChristopherNeural';

    try {
      const tts = new MsEdgeTTS();
      await tts.setMetadata(voiceId, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);

      const { audioStream } = tts.toStream(sanitizedText);

      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Transfer-Encoding', 'chunked');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      res.setHeader('X-Voice-Profile', voiceId);

      audioStream.on('error', (err) => {
        this.logger.error(`Edge-TTS stream error: ${err.message}`);
        if (!res.headersSent) {
          res.status(500).json({ message: 'TTS stream failed' });
        } else {
          res.end();
        }
      });

      audioStream.pipe(res);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`TTS synthesis error: ${message}`);
      if (!res.headersSent) {
        res.status(500).json({ message: `TTS synthesis failed: ${message}` });
      }
    }
  }

  async transcribeAudio(fileBuffer: Buffer, filename = 'recording.m4a') {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new ServiceUnavailableException(
        'Groq API key is missing. Configure GROQ_API_KEY to enable Whisper STT transcription.',
      );
    }

    try {
      const groq = new Groq({ apiKey });
      const file = await toFile(fileBuffer, filename);

      const transcription = await groq.audio.transcriptions.create({
        file,
        model: process.env.GROQ_WHISPER_MODEL || 'whisper-large-v3-turbo',
        response_format: 'verbose_json',
        temperature: 0.0,
      });

      return {
        text: transcription.text?.trim() || '',
        language: (transcription as any).language || 'en',
        duration: (transcription as any).duration || 0,
        provider: 'groq-whisper-large-v3-turbo',
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`Whisper STT transcription failed: ${message}`);
      throw new BadRequestException(`Transcription failed: ${message}`);
    }
  }
}
