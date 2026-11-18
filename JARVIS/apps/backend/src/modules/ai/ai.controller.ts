import {
  Controller,
  Get,
  Post,
  UseGuards,
  UploadedFile,
  UseInterceptors,
  Body,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { ModelRegistryService } from './model-registry.service';
import { AIGatewayService } from './ai-gateway.service';
import { UsageTrackingService } from './usage-tracking.service';

@Controller()
export class AiController {
  constructor(
    private readonly registry: ModelRegistryService,
    private readonly gateway: AIGatewayService,
    private readonly usageTracker: UsageTrackingService,
  ) {}

  @Public()
  @Get('models')
  async listModels() {
    return this.registry.getAllModels();
  }

  @Public()
  @Get('ai/health')
  async getAiHealth() {
    return this.registry.getHealthSummary();
  }

  @UseGuards(JwtAuthGuard)
  @Get('usage')
  async getUsage(@CurrentUser() user: { id: string }) {
    return this.usageTracker.getUsageStats(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('ai/analyze-image')
  @UseInterceptors(FileInterceptor('image', { limits: { fileSize: 10 * 1024 * 1024 } }))
  async analyzeImage(
    @UploadedFile() file: Express.Multer.File,
    @Body('prompt') prompt: string,
    @CurrentUser() user: { id: string },
  ) {
    if (!file) {
      throw new BadRequestException('Image file is required.');
    }
    const analysis = await this.gateway.analyzeImage(
      file.buffer,
      file.mimetype,
      prompt || 'Describe this image in full detail and extract any text, key insights, or objects visible.',
      user.id,
    );
    return { analysis };
  }
}
