import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class UsageTrackingService {
  private readonly logger = new Logger(UsageTrackingService.name);

  constructor(private prisma: PrismaService) {}

  async trackUsage(params: {
    userId: string;
    providerName: string;
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  }) {
    try {
      // Find or create AiProvider in database
      const provider = await this.prisma.aiProvider.upsert({
        where: { name: params.providerName },
        create: {
          name: params.providerName,
          baseUrl: 'https://api.jarvis.local',
          isActive: true,
        },
        update: {},
      });

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      await this.prisma.providerUsage.upsert({
        where: {
          userId_providerId_usageDate: {
            userId: params.userId,
            providerId: provider.id,
            usageDate: today,
          },
        },
        create: {
          userId: params.userId,
          providerId: provider.id,
          usageDate: today,
          requestCount: 1,
          promptTokens: params.promptTokens,
          completionTokens: params.completionTokens,
          totalTokens: params.totalTokens,
        },
        update: {
          requestCount: { increment: 1 },
          promptTokens: { increment: params.promptTokens },
          completionTokens: { increment: params.completionTokens },
          totalTokens: { increment: params.totalTokens },
        },
      });
    } catch (err: unknown) {
      // Non-blocking log if tracking fails
      this.logger.warn(`Failed to track usage: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  async getUsageStats(userId?: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const where: Record<string, unknown> = {
      usageDate: { gte: today },
    };
    if (userId) {
      where.userId = userId;
    }

    const records = await this.prisma.providerUsage.findMany({
      where,
      include: { provider: true },
    });

    return records.map((r) => ({
      provider: r.provider.name,
      requestCount: r.requestCount,
      promptTokens: r.promptTokens,
      completionTokens: r.completionTokens,
      totalTokens: r.totalTokens,
      date: r.usageDate.toISOString().split('T')[0],
    }));
  }
}
