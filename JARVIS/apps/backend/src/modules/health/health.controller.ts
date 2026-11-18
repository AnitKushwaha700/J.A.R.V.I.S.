import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Public } from '../../common/decorators/public.decorator';

@Controller('health')
export class HealthController {
  constructor(private prisma: PrismaService) {}

  @Get()
  @Public()
  async check() {
    let dbStatus = 'ok';
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      dbStatus = 'error';
    }

    const groqConfigured = Boolean(process.env.GROQ_API_KEY);
    const geminiConfigured = Boolean(process.env.GEMINI_API_KEY);
    const openrouterConfigured = Boolean(process.env.OPENROUTER_API_KEY);

    return {
      status: dbStatus === 'ok' ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      services: {
        database: dbStatus,
        groq: groqConfigured ? 'configured' : 'missing_key',
        gemini: geminiConfigured ? 'configured' : 'missing_key',
        openrouter: openrouterConfigured ? 'configured' : 'missing_key',
      },
    };
  }
}
