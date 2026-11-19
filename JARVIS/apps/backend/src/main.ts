import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import * as helmetPkg from 'helmet';
import * as compressionPkg from 'compression';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const helmet: any = (helmetPkg as any).default ?? helmetPkg;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const compression: any = (compressionPkg as any).default ?? compressionPkg;

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  // Security
  app.use(helmet());
  app.use(compression());

  // Global API prefix
  app.setGlobalPrefix('api');

  // CORS
  const corsOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3000,http://localhost:8081')
    .split(',')
    .map((o) => o.trim());
  app.enableCors({
    origin: corsOrigins,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Global filters & interceptors
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor(), new TransformInterceptor());

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`🚀 JARVIS API running on http://localhost:${port}/api`);
}
bootstrap();
