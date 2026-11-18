import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { SearchModule } from '../search/search.module';
import { VoiceModule } from '../voice/voice.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [SearchModule, VoiceModule, AiModule],
  controllers: [TasksController],
  providers: [TasksService],
  exports: [TasksService],
})
export class TasksModule {}
