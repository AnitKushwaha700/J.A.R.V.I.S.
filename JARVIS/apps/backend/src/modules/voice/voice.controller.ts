import {
  Controller,
  Post,
  Get,
  Body,
  Res,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { VoiceService } from './voice.service';
import { Public } from '../../common/decorators/public.decorator';

class TtsDto {
  text: string;
  voice?: string;
}

@Controller('voice')
export class VoiceController {
  constructor(private readonly voiceService: VoiceService) {}

  @Public()
  @Get('voices')
  getVoices() {
    return this.voiceService.getVoiceProfiles();
  }

  @Public()
  @Post('tts')
  async synthesizeSpeech(@Body() dto: TtsDto, @Res() res: Response) {
    if (!dto.text) {
      throw new BadRequestException('Field "text" is required for speech synthesis.');
    }
    return this.voiceService.synthesizeSpeech(dto.text, dto.voice, res);
  }

  @Public()
  @Post('stt')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 25 * 1024 * 1024 }, // 25MB max audio
    }),
  )
  async transcribeAudio(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Audio file is required in "file" form field.');
    }
    return this.voiceService.transcribeAudio(file.buffer, file.originalname);
  }
}
