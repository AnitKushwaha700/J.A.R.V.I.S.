import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as argon2 from 'argon2';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (existing) throw new ConflictException('Email already registered.');

    const passwordHash = await argon2.hash(dto.password, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
    });

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email.toLowerCase(),
        passwordHash,
        preferences: { create: {} },
      },
      select: { id: true, email: true, name: true, createdAt: true },
    });

    const tokens = await this.generateTokens(user.id, user.email);
    return { user, ...tokens };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (!user || !user.isActive)
      throw new UnauthorizedException('Invalid credentials.');

    const valid = await argon2.verify(user.passwordHash, dto.password);
    if (!valid) throw new UnauthorizedException('Invalid credentials.');

    // Audit log
    await this.prisma.auditLog.create({
      data: { userId: user.id, action: 'LOGIN', metadata: {} },
    });

    const tokens = await this.generateTokens(user.id, user.email);
    return {
      user: { id: user.id, email: user.email, name: user.name },
      ...tokens,
    };
  }

  async refresh(refreshToken: string) {
    const stored = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!stored || stored.expiresAt < new Date()) {
      if (stored) {
        await this.prisma.refreshToken.delete({ where: { id: stored.id } });
      }
      throw new UnauthorizedException('Refresh token is invalid or expired.');
    }

    // Rotate: delete old token and issue new pair
    await this.prisma.refreshToken.delete({ where: { id: stored.id } });
    return this.generateTokens(stored.user.id, stored.user.email);
  }

  async logout(refreshToken: string) {
    await this.prisma.refreshToken
      .delete({ where: { token: refreshToken } })
      .catch(() => {});
    return { success: true };
  }

  private async generateTokens(userId: string, email: string) {
    const payload = { sub: userId, email };
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: (process.env.JWT_EXPIRES_IN || '15m') as any,
    });

    // Store refresh token
    const rawRefreshToken = uuidv4() + '-' + uuidv4();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.prisma.refreshToken.create({
      data: { userId, token: rawRefreshToken, expiresAt },
    });

    return { accessToken, refreshToken: rawRefreshToken };
  }
}
