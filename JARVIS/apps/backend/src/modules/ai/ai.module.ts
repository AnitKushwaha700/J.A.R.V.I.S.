import { Module } from '@nestjs/common';
import { GeminiProvider } from './providers/gemini.provider';
import { GroqProvider } from './providers/groq.provider';
import { OpenRouterProvider } from './providers/openrouter.provider';
import { OllamaProvider } from './providers/ollama.provider';
import { OfflineProvider } from './providers/offline.provider';
import { ModelRegistryService } from './model-registry.service';
import { AIGatewayService } from './ai-gateway.service';
import { UsageTrackingService } from './usage-tracking.service';
import { AiController } from './ai.controller';

@Module({
  controllers: [AiController],
  providers: [
    GeminiProvider,
    GroqProvider,
    OpenRouterProvider,
    OllamaProvider,
    OfflineProvider,
    ModelRegistryService,
    AIGatewayService,
    UsageTrackingService,
  ],
  exports: [AIGatewayService, ModelRegistryService, UsageTrackingService],
})
export class AiModule {}
