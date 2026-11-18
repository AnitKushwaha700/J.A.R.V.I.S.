import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { KnowledgeService } from './knowledge.service';
import { IngestDocumentDto, KnowledgeSearchDto } from './dto/ingest-document.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';

@Controller('knowledge')
export class KnowledgeController {
  constructor(private readonly knowledgeService: KnowledgeService) {}

  @UseGuards(JwtAuthGuard)
  @Post('documents')
  async ingestDocument(
    @CurrentUser('id') userId: string,
    @Body() dto: IngestDocumentDto,
  ) {
    if (!dto.title || !dto.content) {
      throw new BadRequestException('Title and content are required.');
    }
    return this.knowledgeService.ingestDocument(userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('documents')
  async listDocuments(@CurrentUser('id') userId: string) {
    return this.knowledgeService.list(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('documents/:id')
  async deleteDocument(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.knowledgeService.delete(userId, id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('search')
  async searchKnowledge(
    @CurrentUser('id') userId: string,
    @Body() dto: KnowledgeSearchDto,
  ) {
    if (!dto.query) {
      throw new BadRequestException('Query parameter is required.');
    }
    return this.knowledgeService.search(userId, dto.query, dto.topK || 4);
  }
}
