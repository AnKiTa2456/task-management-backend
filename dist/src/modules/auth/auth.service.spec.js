"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const auth_service_1 = require("./auth.service");
const prisma_service_1 = require("../../prisma/prisma.service");
const bcrypt = require("bcryptjs");
const mockUser = {
    id: 'user-1',
    email: 'alice@example.com',
    name: 'Alice Morgan',
    passwordHash: bcrypt.hashSync('Password1!', 10),
    isActive: true,
    avatarUrl: null,
    createdAt: new Date(),
    updatedAt: new Date(),
};
const prismaMock = {
    user: {
        findUnique: jest.fn(),
        create: jest.fn().mockResolvedValue(mockUser),
    },
    refreshToken: {
        create: jest.fn(),
        findUnique: jest.fn(),
        delete: jest.fn(),
        deleteMany: jest.fn(),
    },
};
const jwtMock = {
    signAsync: jest.fn().mockResolvedValue('mock-token'),
    verify: jest.fn(),
};
const configMock = {
    get: jest.fn((key) => {
        const map = {
            'jwt.secret': 'test-secret',
            'jwt.expiresIn': '15m',
            'jwt.refreshSecret': 'test-refresh-secret',
            'jwt.refreshExpiresIn': '7d',
        };
        return map[key];
    }),
};
describe('AuthService', () => {
    let service;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [
                auth_service_1.AuthService,
                { provide: prisma_service_1.PrismaService, useValue: prismaMock },
                { provide: jwt_1.JwtService, useValue: jwtMock },
                { provide: config_1.ConfigService, useValue: configMock },
            ],
        }).compile();
        service = module.get(auth_service_1.AuthService);
        jest.clearAllMocks();
    });
    describe('register', () => {
        it('creates a new user and returns tokens', async () => {
            prismaMock.user.findUnique.mockResolvedValue(null);
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
            await expect(service.register({ name: 'X', email: 'alice@example.com', password: 'Password1!' })).rejects.toThrow(common_1.ConflictException);
        });
    });
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
            await expect(service.login({ email: 'alice@example.com', password: 'wrong' })).rejects.toThrow(common_1.UnauthorizedException);
        });
        it('throws UnauthorizedException when user not found', async () => {
            prismaMock.user.findUnique.mockResolvedValue(null);
            await expect(service.login({ email: 'nobody@example.com', password: 'Password1!' })).rejects.toThrow(common_1.UnauthorizedException);
        });
    });
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
//# sourceMappingURL=auth.service.spec.js.map