import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { IsString, IsBoolean, IsNumber, IsOptional, Min, Max } from 'class-validator';

export class UpdatePreferencesDto {
  @IsString() @IsOptional() defaultModel?: string;
  @IsString() @IsOptional() defaultProvider?: string;
  @IsString() @IsOptional() voiceId?: string;
  @IsNumber() @Min(0.5) @Max(2.0) @IsOptional() speechRate?: number;
  @IsBoolean() @IsOptional() autoSpeak?: boolean;
  @IsString() @IsOptional() uiTheme?: string;
}

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        role: true,
        createdAt: true,
        preferences: true,
      },
    });
    if (!user) throw new NotFoundException('User not found.');
    return user;
  }

  async updatePreferences(userId: string, dto: UpdatePreferencesDto) {
    return this.prisma.userPreference.upsert({
      where: { userId },
      create: { userId, ...dto },
      update: dto,
    });
  }

  async getUsageSummary(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const usage = await this.prisma.providerUsage.findMany({
      where: { userId, usageDate: { gte: today } },
      include: { provider: true },
    });

    return usage.map((u) => ({
      provider: u.provider.name,
      requestsToday: u.requestCount,
      tokensToday: u.totalTokens,
    }));
  }
}
