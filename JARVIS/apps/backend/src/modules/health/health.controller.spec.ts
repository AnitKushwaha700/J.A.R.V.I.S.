import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { PrismaService } from '../../prisma/prisma.service';

describe('HealthController', () => {
  let controller: HealthController;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: PrismaService,
          useValue: {
            $queryRaw: jest.fn().mockResolvedValue([{ 1: 1 }]),
          },
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return healthy status when database is reachable', async () => {
    const result = await controller.check();
    expect(result.status).toBe('healthy');
    expect(result.services.database).toBe('ok');
    expect(result.timestamp).toBeDefined();
  });

  it('should return degraded status when database fails', async () => {
    jest.spyOn(prisma, '$queryRaw').mockRejectedValueOnce(new Error('DB connection failed'));
    const result = await controller.check();
    expect(result.status).toBe('degraded');
    expect(result.services.database).toBe('error');
  });
});
