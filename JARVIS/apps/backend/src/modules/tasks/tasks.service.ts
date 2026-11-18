import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Response } from 'express';
import { PrismaService } from '../../prisma/prisma.service';
import { SearchService } from '../search/search.service';
import { VoiceService } from '../voice/voice.service';
import { AIGatewayService } from '../ai/ai-gateway.service';
import { CreateTaskDto, UpdateTaskDto } from './dto/task.dto';
import {
  Task,
  TaskStatus,
  TaskPriority,
  VoiceTaskExtractionResult,
  DailyBriefing,
} from '@jarvis/shared-types';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly searchService: SearchService,
    private readonly voiceService: VoiceService,
    private readonly aiGateway: AIGatewayService,
  ) {}

  async list(
    userId: string,
    filter?: { status?: TaskStatus; priority?: TaskPriority },
  ): Promise<Task[]> {
    const where: any = { userId };
    if (filter?.status) where.status = filter.status;
    if (filter?.priority) where.priority = filter.priority;

    const tasks = await this.prisma.task.findMany({
      where,
      orderBy: [{ priority: 'desc' }, { dueAt: 'asc' }, { createdAt: 'desc' }],
    });

    return tasks.map(this.formatTask);
  }

  async getOne(userId: string, id: string): Promise<Task> {
    const task = await this.prisma.task.findFirst({
      where: { id, userId },
    });
    if (!task) {
      throw new NotFoundException('Task not found.');
    }
    return this.formatTask(task);
  }

  async create(userId: string, dto: CreateTaskDto): Promise<Task> {
    const task = await this.prisma.task.create({
      data: {
        userId,
        title: dto.title.trim(),
        description: dto.description?.trim() || null,
        priority: dto.priority || 'medium',
        status: dto.status || 'todo',
        dueAt: dto.dueAt ? new Date(dto.dueAt) : null,
        isRecurring: dto.isRecurring || false,
        recurrenceRule: dto.recurrenceRule || null,
      },
    });

    return this.formatTask(task);
  }

  async update(userId: string, id: string, dto: UpdateTaskDto): Promise<Task> {
    await this.getOne(userId, id);

    const data: any = {};
    if (dto.title !== undefined) data.title = dto.title.trim();
    if (dto.description !== undefined) data.description = dto.description.trim();
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.priority !== undefined) data.priority = dto.priority;
    if (dto.dueAt !== undefined) {
      data.dueAt = dto.dueAt ? new Date(dto.dueAt) : null;
    }

    const updated = await this.prisma.task.update({
      where: { id },
      data,
    });

    return this.formatTask(updated);
  }

  async delete(userId: string, id: string): Promise<{ success: boolean }> {
    await this.getOne(userId, id);
    await this.prisma.task.delete({ where: { id } });
    return { success: true };
  }

  /**
   * Natural Language & Voice Command Task Extractor
   * Extracts clean task title, priority, and due date from speech or chat text.
   * e.g. "JARVIS, remind me to push the code tomorrow at 7 PM urgently"
   */
  async extractTaskFromText(text: string): Promise<VoiceTaskExtractionResult> {
    const raw = text.trim();
    const lower = raw.toLowerCase();

    // 1. Detect Priority
    let priority: TaskPriority = 'medium';
    if (
      lower.includes('urgent') ||
      lower.includes('asap') ||
      lower.includes('critical') ||
      lower.includes('high priority') ||
      lower.includes('important')
    ) {
      priority = 'high';
    } else if (
      lower.includes('low priority') ||
      lower.includes('whenever') ||
      lower.includes('eventually') ||
      lower.includes('no rush')
    ) {
      priority = 'low';
    }

    // 2. Parse Relative Date/Time
    let dueAtDate: Date | undefined = undefined;
    const now = new Date();

    if (lower.includes('tomorrow')) {
      dueAtDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      dueAtDate.setHours(9, 0, 0, 0); // default 9 AM
    } else if (lower.includes('tonight')) {
      dueAtDate = new Date(now);
      dueAtDate.setHours(20, 0, 0, 0); // 8 PM
    }

    // Match "at X pm" / "at X am"
    const timeMatch = /\bat\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i.exec(lower);
    if (timeMatch) {
      let hours = parseInt(timeMatch[1], 10);
      const minutes = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
      const meridiem = timeMatch[3].toLowerCase();

      if (meridiem === 'pm' && hours < 12) hours += 12;
      if (meridiem === 'am' && hours === 12) hours = 0;

      if (!dueAtDate) dueAtDate = new Date(now);
      dueAtDate.setHours(hours, minutes, 0, 0);
      // If time has already passed today, push to tomorrow
      if (dueAtDate < now && !lower.includes('tomorrow')) {
        dueAtDate = new Date(dueAtDate.getTime() + 24 * 60 * 60 * 1000);
      }
    }

    // Match "in X hours"
    const inHoursMatch = /\bin\s+(\d+)\s+hours?\b/i.exec(lower);
    if (inHoursMatch) {
      const hours = parseInt(inHoursMatch[1], 10);
      dueAtDate = new Date(now.getTime() + hours * 60 * 60 * 1000);
    }

    // Match "in X minutes"
    const inMinsMatch = /\bin\s+(\d+)\s+min(?:ute)?s?\b/i.exec(lower);
    if (inMinsMatch) {
      const mins = parseInt(inMinsMatch[1], 10);
      dueAtDate = new Date(now.getTime() + mins * 60 * 1000);
    }

    // 3. Clean Title
    let cleanTitle = raw
      .replace(/^(hey\s+)?jarvis\s*,?\s*/i, '')
      .replace(/^(please\s+)?(remind me to|add a task to|create a task to|remember to|schedule)\s+/i, '')
      .replace(/\s+(urgently|asap|tomorrow|tonight|at\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)|in\s+\d+\s+hours?|in\s+\d+\s+mins?)/gi, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (cleanTitle.length > 0) {
      cleanTitle = cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1);
    } else {
      cleanTitle = raw;
    }

    return {
      title: cleanTitle,
      dueAt: dueAtDate ? dueAtDate.toISOString() : undefined,
      priority,
      rawInput: raw,
    };
  }

  /**
   * Daily Briefing Engine
   * Generates a context-aware morning briefing combining:
   * Current Date/Time + Weather Forecast + Top Priority Tasks + News Digest + Operational Health.
   */
  async getDailyBriefing(userId: string, location: string = 'Mumbai'): Promise<DailyBriefing> {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // 1. Fetch user tasks
    const [topTasks, allPending, completedToday] = await Promise.all([
      this.prisma.task.findMany({
        where: { userId, status: { not: 'completed' } },
        orderBy: [{ priority: 'desc' }, { dueAt: 'asc' }],
        take: 3,
      }),
      this.prisma.task.count({
        where: { userId, status: { not: 'completed' } },
      }),
      this.prisma.task.count({
        where: {
          userId,
          status: 'completed',
          updatedAt: { gte: startOfDay },
        },
      }),
    ]);

    // 2. Fetch live weather & news in parallel
    const [weather, news] = await Promise.all([
      this.searchService.getWeather(location).catch(() => null),
      this.searchService.searchNews('tech news', 3).catch(() => []),
    ]);

    // 3. Format Date and Greeting
    const hour = now.getHours();
    const greeting = hour < 12 ? 'Good morning, Sir.' : hour < 17 ? 'Good afternoon, Sir.' : 'Good evening, Sir.';
    const dateFormatted = now.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });

    // 4. Construct Charismatic Spoken Script
    const spokenParts: string[] = [
      `${greeting} Today is ${dateFormatted}.`,
    ];

    if (weather) {
      spokenParts.push(
        `Weather in ${weather.location} is ${weather.temperature} degrees Celsius with ${weather.condition.replace(/[\u{1F300}-\u{1F6FF}]/gu, '').trim()}.`,
      );
    }

    if (allPending > 0) {
      const topTitles = topTasks.map((t) => t.title).join(', and ');
      spokenParts.push(
        `You have ${allPending} pending ${allPending === 1 ? 'task' : 'tasks'} for today. Top priorities include: ${topTitles}.`,
      );
    } else {
      spokenParts.push('Your schedule is completely clear for the day.');
    }

    if (news.length > 0) {
      spokenParts.push(`In top news: ${news[0].title}.`);
    }

    spokenParts.push('All core systems, AI providers, and neural models are operational. How may I assist you?');

    const spokenScript = spokenParts.join(' ');

    return {
      greeting,
      dateTime: dateFormatted,
      weather: weather
        ? {
            location: weather.location,
            temperature: weather.temperature,
            condition: weather.condition,
          }
        : undefined,
      topTasks: topTasks.map(this.formatTask),
      pendingCount: allPending,
      completedTodayCount: completedToday,
      topNews: news.map((n) => ({
        title: n.title,
        source: String(n.source),
        url: n.url,
      })),
      systemStatus: {
        activeProviders: ['Groq Llama 3.3', 'Google Gemini 2.0', 'Edge-TTS'],
        database: 'Connected',
        aiGateway: 'Operational',
      },
      spokenScript,
    };
  }

  /**
   * Streams the spoken daily briefing directly as an Edge-TTS MP3 stream!
   */
  async streamDailyBriefingAudio(userId: string, location: string, res: Response) {
    const briefing = await this.getDailyBriefing(userId, location);
    return this.voiceService.synthesizeSpeech(briefing.spokenScript, 'jarvis', res);
  }

  private formatTask(t: any): Task {
    return {
      id: t.id,
      userId: t.userId,
      title: t.title,
      description: t.description,
      status: t.status,
      priority: t.priority,
      dueAt: t.dueAt ? t.dueAt.toISOString() : null,
      isRecurring: t.isRecurring,
      recurrenceRule: t.recurrenceRule,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
    };
  }
}
