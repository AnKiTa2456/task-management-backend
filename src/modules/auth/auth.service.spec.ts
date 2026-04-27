import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService }    from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService }   from './auth.service';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

// ── Mocks ───────────────────────────────────────────────────────────────────

const mockUser = {
  id:           'user-1',
  email:        'alice@example.com',
  name:         'Alice Morgan',
  passwordHash: bcrypt.hashSync('Password1!', 10),
  isActive:     true,
  avatarUrl:    null,
  createdAt:    new Date(),
  updatedAt:    new Date(),
};

const prismaMock = {
  user: {
    findUnique: jest.fn(),
    create:     jest.fn().mockResolvedValue(mockUser),
  },
  refreshToken: {
    create:      jest.fn(),
    findUnique:  jest.fn(),
    delete:      jest.fn(),
    deleteMany:  jest.fn(),
  },
};

const jwtMock = {
  signAsync: jest.fn().mockResolvedValue('mock-token'),
  verify:    jest.fn(),
};

const configMock = {
  get: jest.fn((key: string) => {
    const map: Record<string, string> = {
      'jwt.secret':          'test-secret',
      'jwt.expiresIn':       '15m',
      'jwt.refreshSecret':   'test-refresh-secret',
      'jwt.refreshExpiresIn':'7d',
    };
    return map[key];
  }),
};

// ── Tests ────────────────────────────────────────────────────────────────────

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService,  useValue: prismaMock },
        { provide: JwtService,     useValue: jwtMock    },
        { provide: ConfigService,  useValue: configMock },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  // ── register ──────────────────────────────────────────────────────────────

  describe('register', () => {
    it('creates a new user and returns tokens', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);   // email not taken
      prismaMock.user.create.mockResolvedValue(mockUser);
      prismaMock.refreshToken.create.mockResolvedValue({});

      const result = await service.register({
        name: 'Alice Morgan', email: 'alice@example.com', password: 'Password1!',
      });

      expect(result.user.email).toBe('alice@example.com');
      expect(result.accessToken).toBe('mock-token');
      expect(result.user).not.toHaveProperty('passwordHash');
    });

    it('throws ConflictException when email already exists', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser);

      await expect(
        service.register({ name: 'X', email: 'alice@example.com', password: 'Password1!' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  // ── login ─────────────────────────────────────────────────────────────────

  describe('login', () => {
    it('returns tokens for valid credentials', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      prismaMock.refreshToken.create.mockResolvedValue({});

      const result = await service.login({
        email: 'alice@example.com', password: 'Password1!',
      });

      expect(result.accessToken).toBe('mock-token');
      expect(result.user).not.toHaveProperty('passwordHash');
    });

    it('throws UnauthorizedException for wrong password', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser);

      await expect(
        service.login({ email: 'alice@example.com', password: 'wrong' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException when user not found', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login({ email: 'nobody@example.com', password: 'Password1!' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  // ── logout ────────────────────────────────────────────────────────────────

  describe('logout', () => {
    it('deletes all refresh tokens for the user', async () => {
      prismaMock.refreshToken.deleteMany.mockResolvedValue({ count: 2 });

      const result = await service.logout('user-1');
      expect(prismaMock.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
      });
      expect(result.message).toContain('Logged out');
    });
  });
});
