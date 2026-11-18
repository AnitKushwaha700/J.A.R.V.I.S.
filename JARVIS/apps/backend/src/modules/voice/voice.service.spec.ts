import { Test, TestingModule } from '@nestjs/testing';
import { VoiceService } from './voice.service';
import { BadRequestException, ServiceUnavailableException } from '@nestjs/common';

describe('VoiceService', () => {
  let service: VoiceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [VoiceService],
    }).compile();

    service = module.get<VoiceService>(VoiceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return available neural voice profiles', () => {
    const voices = service.getVoiceProfiles();
    expect(voices.length).toBeGreaterThanOrEqual(5);
    const jarvis = voices.find((v) => v.key === 'jarvis');
    expect(jarvis).toBeDefined();
    expect(jarvis?.voiceId).toBe('en-US-ChristopherNeural');
  });

  it('should throw BadRequestException if synthesis text is empty', async () => {
    const mockRes = {} as any;
    await expect(service.synthesizeSpeech('', 'jarvis', mockRes)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('should throw ServiceUnavailableException if Groq API key is missing during transcription', async () => {
    const originalKey = process.env.GROQ_API_KEY;
    delete process.env.GROQ_API_KEY;

    try {
      const buffer = Buffer.from('fake audio');
      await expect(service.transcribeAudio(buffer)).rejects.toThrow(
        ServiceUnavailableException,
      );
    } finally {
      if (originalKey) process.env.GROQ_API_KEY = originalKey;
    }
  });
});
