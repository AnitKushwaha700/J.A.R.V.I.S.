import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { MemoryService } from './memory.service';
import { CreateMemoryDto, UpdateMemoryDto, SearchMemoryDto } from './dto/memory.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('memory')
@UseGuards(JwtAuthGuard)
export class MemoryController {
  constructor(private readonly memoryService: MemoryService) {}

  @Post()
  async create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateMemoryDto,
  ) {
    if (!dto.content || !dto.content.trim()) {
      throw new BadRequestException('Memory content cannot be empty.');
    }
    return this.memoryService.create(userId, dto);
  }

  @Get()
  async list(
    @CurrentUser('id') userId: string,
    @Query('category') category?: string,
  ) {
    return this.memoryService.list(userId, category);
  }

  @Patch(':id')
  async update(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateMemoryDto,
  ) {
    return this.memoryService.update(userId, id, dto);
  }

  @Delete(':id')
  async delete(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.memoryService.delete(userId, id);
  }

  @Delete()
  async clearAll(@CurrentUser('id') userId: string) {
    return this.memoryService.clearAll(userId);
  }

  @Post('search')
  async search(
    @CurrentUser('id') userId: string,
    @Body() dto: SearchMemoryDto,
  ) {
    if (!dto.query || !dto.query.trim()) {
      throw new BadRequestException('Search query is required.');
    }
    return this.memoryService.search(userId, dto.query, dto.topK || 5);
  }

  @Get('export')
  async export(@CurrentUser('id') userId: string) {
    return this.memoryService.export(userId);
  }
}
