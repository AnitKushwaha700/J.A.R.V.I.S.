import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Res,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { Response } from 'express';
import { TasksService } from './tasks.service';
import { CreateTaskDto, UpdateTaskDto, ExtractTaskDto } from './dto/task.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { TaskStatus, TaskPriority } from '@jarvis/shared-types';

@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async list(
    @CurrentUser('id') userId: string,
    @Query('status') status?: TaskStatus,
    @Query('priority') priority?: TaskPriority,
  ) {
    return this.tasksService.list(userId, { status, priority });
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateTaskDto,
  ) {
    if (!dto.title || !dto.title.trim()) {
      throw new BadRequestException('Task title cannot be empty.');
    }
    return this.tasksService.create(userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getOne(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.tasksService.getOne(userId, id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async update(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateTaskDto,
  ) {
    return this.tasksService.update(userId, id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async delete(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.tasksService.delete(userId, id);
  }

  @Public()
  @Post('extract')
  async extractTask(@Body() dto: ExtractTaskDto) {
    if (!dto.text || !dto.text.trim()) {
      throw new BadRequestException('Input text cannot be empty.');
    }
    return this.tasksService.extractTaskFromText(dto.text);
  }

  @Public()
  @Get('briefing')
  async getBriefing(
    @Query('location') location: string = 'Mumbai',
    @CurrentUser('id') userId?: string,
  ) {
    return this.tasksService.getDailyBriefing(userId || 'default-user', location);
  }

  @Public()
  @Get('briefing/audio')
  async streamBriefingAudio(
    @Query('location') location: string = 'Mumbai',
    @Res() res: Response,
    @CurrentUser('id') userId?: string,
  ) {
    return this.tasksService.streamDailyBriefingAudio(
      userId || 'default-user',
      location,
      res,
    );
  }
}
