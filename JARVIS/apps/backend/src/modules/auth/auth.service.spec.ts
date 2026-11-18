import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException, ConflictException } from '@nestjs/common';
import * as argon2 from 'argon2';

jest.mock('argon2');

describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaService;
  let jwt: JwtService;

  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    refreshToken: {
      create: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
  };

  const mockJwt = {
    sign: jest.fn().mockReturnValue('mock_jwt_token'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwt },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
    jwt = module.get<JwtService>(JwtService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should throw ConflictException if email exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce({ id: '1', email: 'test@example.com' });
      await expect(
        service.register({ name: 'Test', email: 'test@example.com', password: 'Password123!' }),
      ).rejects.toThrow(ConflictException);
    });

    it('should register a new user and return tokens', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce(null);
      (argon2.hash as jest.Mock).mockResolvedValueOnce('hashed_pw');
      mockPrisma.user.create.mockResolvedValueOnce({
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test',
        createdAt: new Date(),
      });
      mockPrisma.refreshToken.create.mockResolvedValueOnce({});

      const result = await service.register({
        name: 'Test',
        email: 'test@example.com',
        password: 'Password123!',
      });

      expect(result.user.id).toBe('user-123');
      expect(result.accessToken).toBe('mock_jwt_token');
      expect(result.refreshToken).toBeDefined();
    });
  });

  describe('login', () => {
    it('should throw UnauthorizedException if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce(null);
      await expect(
        service.login({ email: 'unknown@example.com', password: 'Password123!' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password mismatch', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        id: 'user-1',
        email: 'test@example.com',
        passwordHash: 'hash',
        isActive: true,
      });
      (argon2.verify as jest.Mock).mockResolvedValueOnce(false);

      await expect(
        service.login({ email: 'test@example.com', password: 'WrongPassword' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
