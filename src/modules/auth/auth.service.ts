import {
  Injectable, ConflictException,
  UnauthorizedException, NotFoundException,
} from '@nestjs/common';
import { JwtService }    from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt       from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterDto }   from './dto/register.dto';
import { LoginDto }      from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma:  PrismaService,
    private jwt:     JwtService,
    private config:  ConfigService,
  ) {}

  // ── Register ───────────────────────────────────────────────────────────────

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: { email: dto.email, name: dto.name, passwordHash },
    });

    const tokens = await this.issueTokens(user.id, user.email);
    await this.saveRefreshToken(user.id, tokens.refreshToken);

    return { user: this.sanitize(user), ...tokens };
  }

  // ── Login ──────────────────────────────────────────────────────────────────

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      // Same error for both cases — prevents email enumeration
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('This account has been deactivated');
    }

    const tokens = await this.issueTokens(user.id, user.email);
    await this.saveRefreshToken(user.id, tokens.refreshToken);

    return { user: this.sanitize(user), ...tokens };
  }

  // ── Refresh ────────────────────────────────────────────────────────────────

  async refresh(rawRefreshToken: string) {
    // 1. Verify the token cryptographically
    let payload: { sub: string; email: string };
    try {
      payload = this.jwt.verify(rawRefreshToken, {
        secret: this.config.get<string>('jwt.refreshSecret'),
      });
    } catch {
      throw new UnauthorizedException('Refresh token is invalid or expired');
    }

    // 2. Check it exists in DB (rotation — one-time use)
    const stored = await this.prisma.refreshToken.findUnique({
      where: { token: rawRefreshToken },
    });

    if (!stored || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token not found or expired');
    }

    // 3. Delete old token (rotation)
    await this.prisma.refreshToken.delete({ where: { id: stored.id } });

    // 4. Issue new pair
    const tokens = await this.issueTokens(payload.sub, payload.email);
    await this.saveRefreshToken(payload.sub, tokens.refreshToken);

    return tokens;
  }

  // ── Logout ─────────────────────────────────────────────────────────────────

  async logout(userId: string) {
    // Delete all refresh tokens for this user (logout from all devices)
    await this.prisma.refreshToken.deleteMany({ where: { userId } });
    return { message: 'Logged out successfully' };
  }

  // ── Me ─────────────────────────────────────────────────────────────────────

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    return this.sanitize(user);
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  private async issueTokens(userId: string, email: string) {
    const payload = { sub: userId, email };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(payload, {
        secret:    this.config.get<string>('jwt.secret'),
        expiresIn: this.config.get<string>('jwt.expiresIn'),
      }),
      this.jwt.signAsync(payload, {
        secret:    this.config.get<string>('jwt.refreshSecret'),
        expiresIn: this.config.get<string>('jwt.refreshExpiresIn'),
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private async saveRefreshToken(userId: string, token: string) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);   // 7 days

    await this.prisma.refreshToken.create({
      data: { userId, token, expiresAt },
    });
  }

  private sanitize(user: any) {
    const { passwordHash: _, ...safe } = user;
    return safe;
  }
}
