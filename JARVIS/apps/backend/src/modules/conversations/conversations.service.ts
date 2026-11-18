import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AIGatewayService } from '../ai/ai-gateway.service';
import { MemoryService } from '../memory/memory.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { Response } from 'express';
import { MessageRole } from '@prisma/client';
import { ChatMessage } from '@jarvis/shared-types';

@Injectable()
export class ConversationsService {
  private readonly logger = new Logger(ConversationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiGateway: AIGatewayService,
    private readonly memoryService: MemoryService,
  ) {}

  async list(userId: string) {
    return this.prisma.conversation.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      include: {
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          select: { content: true, role: true, createdAt: true },
        },
      },
    });
  }

  async create(userId: string, dto: CreateConversationDto) {
    return this.prisma.conversation.create({
      data: {
        userId,
        title: dto.title || 'New Conversation',
        mode: dto.mode || 'assistant',
        modelId: dto.modelId || null,
      },
    });
  }

  async getOne(id: string, userId: string) {
    const conversation = await this.prisma.conversation.findFirst({
      where: { id, userId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          include: { attachments: true },
        },
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found.');
    }

    return conversation;
  }

  async delete(id: string, userId: string) {
    const existing = await this.prisma.conversation.findFirst({
      where: { id, userId },
    });
    if (!existing) {
      throw new NotFoundException('Conversation not found.');
    }

    await this.prisma.conversation.delete({ where: { id } });
    return { success: true };
  }

  async streamMessage(
    conversationId: string,
    userId: string,
    dto: SendMessageDto,
    res: Response,
  ) {
    const conversation = await this.prisma.conversation.findFirst({
      where: { id: conversationId, userId },
    });

    if (!conversation) {
      res.status(404).json({ message: 'Conversation not found.' });
      return;
    }

    // 1. Save user message to database
    await this.prisma.message.create({
      data: {
        conversationId,
        role: 'user',
        content: dto.content,
      },
    });

    // 2. Fetch context history (last 20 messages)
    const history = await this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      take: 20,
    });

    const chatMessages = history.map((m) => ({
      role: m.role as 'user' | 'assistant' | 'system' | 'tool',
      content: m.content,
    }));

    // 3. Set SSE response headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();

    let fullAssistantResponse = '';
    let providerUsed = 'offline';
    let modelUsed = dto.model || conversation.modelId || 'auto';

    try {
      // Fetch relevant user memories & knowledge chunks (RAG)
      const ragSnippet = await this.memoryService.getRAGContext(userId, dto.content);
      const combinedSystemPrompt = (dto.systemPrompt ? dto.systemPrompt + '\n' : '') + (ragSnippet || '');

      const stream = this.aiGateway.stream(
        {
          model: modelUsed,
          messages: chatMessages,
          systemPrompt: combinedSystemPrompt || undefined,
        },
        userId,
      );

      for await (const chunk of stream) {
        if (chunk.delta) {
          fullAssistantResponse += chunk.delta;
        }
        if (chunk.provider) {
          providerUsed = chunk.provider;
        }
        if (chunk.model) {
          modelUsed = chunk.model;
        }

        res.write(`data: ${JSON.stringify(chunk)}\n\n`);
      }

      // 4. Save assistant response to DB
      const approxTokens = Math.ceil(fullAssistantResponse.length / 4);
      await this.prisma.message.create({
        data: {
          conversationId,
          role: 'assistant',
          content: fullAssistantResponse,
          providerUsed,
          modelUsed,
          tokenCount: approxTokens,
        },
      });

      // 5. Auto-update conversation title if still default
      if (conversation.title === 'New Conversation' && dto.content) {
        const autoTitle = dto.content.slice(0, 40).trim() + (dto.content.length > 40 ? '...' : '');
        await this.prisma.conversation.update({
          where: { id: conversationId },
          data: { title: autoTitle, updatedAt: new Date() },
        });
      } else {
        await this.prisma.conversation.update({
          where: { id: conversationId },
          data: { updatedAt: new Date() },
        });
      }

      res.write('data: [DONE]\n\n');
      res.end();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      this.logger.error(`Error streaming message: ${errorMsg}`);
      res.write(`data: ${JSON.stringify({ error: errorMsg })}\n\n`);
      res.end();
    }
  }
}
