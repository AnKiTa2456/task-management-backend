"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TeamsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const client_1 = require("@prisma/client");
let TeamsService = class TeamsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(userId) {
        return this.prisma.team.findMany({
            where: { members: { some: { userId } } },
            include: {
                _count: { select: { members: true, boards: true } },
                members: {
                    take: 5,
                    include: { user: { select: { id: true, name: true, avatarUrl: true } } },
                },
            },
        });
    }
    async findOne(teamId, userId) {
        const team = await this.prisma.team.findUnique({
            where: { id: teamId },
            include: {
                members: {
                    include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } },
                    orderBy: { joinedAt: 'asc' },
                },
                boards: {
                    select: { id: true, name: true, description: true, updatedAt: true },
                    orderBy: { updatedAt: 'desc' },
                },
            },
        });
        if (!team)
            throw new common_1.NotFoundException(`Team ${teamId} not found`);
        await this.assertMember(teamId, userId);
        return team;
    }
    async create(ownerId, dto) {
        const existing = await this.prisma.team.findUnique({ where: { slug: dto.slug } });
        if (existing)
            throw new common_1.ConflictException(`Team slug "${dto.slug}" is already taken`);
        return this.prisma.team.create({
            data: {
                ...dto,
                members: {
                    create: { userId: ownerId, role: client_1.Role.OWNER },
                },
            },
            include: {
                members: {
                    include: { user: { select: { id: true, name: true, avatarUrl: true } } },
                },
            },
        });
    }
    async update(teamId, userId, dto) {
        await this.assertRole(teamId, userId, [client_1.Role.OWNER, client_1.Role.ADMIN]);
        return this.prisma.team.update({ where: { id: teamId }, data: dto });
    }
    async inviteMember(teamId, inviterId, dto) {
        await this.assertRole(teamId, inviterId, [client_1.Role.OWNER, client_1.Role.ADMIN]);
        const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
        if (!user)
            throw new common_1.NotFoundException(`No user found with email ${dto.email}`);
        const existing = await this.prisma.teamMember.findUnique({
            where: { userId_teamId: { userId: user.id, teamId } },
        });
        if (existing)
            throw new common_1.ConflictException('User is already a member of this team');
        return this.prisma.teamMember.create({
            data: { userId: user.id, teamId, role: dto.role ?? client_1.Role.MEMBER },
            include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } },
        });
    }
    async updateMemberRole(teamId, targetId, actorId, dto) {
        await this.assertRole(teamId, actorId, [client_1.Role.OWNER, client_1.Role.ADMIN]);
        if (dto.role !== client_1.Role.OWNER) {
            const ownerCount = await this.prisma.teamMember.count({
                where: { teamId, role: client_1.Role.OWNER },
            });
            const isTarget = await this.prisma.teamMember.findUnique({
                where: { userId_teamId: { userId: targetId, teamId } },
            });
            if (ownerCount === 1 && isTarget?.role === client_1.Role.OWNER) {
                throw new common_1.BadRequestException('Cannot change the role of the last owner');
            }
        }
        return this.prisma.teamMember.update({
            where: { userId_teamId: { userId: targetId, teamId } },
            data: { role: dto.role },
            include: { user: { select: { id: true, name: true, avatarUrl: true } } },
        });
    }
    async removeMember(teamId, targetId, actorId) {
        await this.assertRole(teamId, actorId, [client_1.Role.OWNER, client_1.Role.ADMIN]);
        const member = await this.prisma.teamMember.findUnique({
            where: { userId_teamId: { userId: targetId, teamId } },
        });
        if (!member)
            throw new common_1.NotFoundException('Member not found');
        if (member.role === client_1.Role.OWNER)
            throw new common_1.ForbiddenException('Cannot remove the team owner');
        await this.prisma.teamMember.delete({
            where: { userId_teamId: { userId: targetId, teamId } },
        });
        return { message: 'Member removed successfully' };
    }
    async assertMember(teamId, userId) {
        const m = await this.prisma.teamMember.findUnique({
            where: { userId_teamId: { userId, teamId } },
        });
        if (!m)
            throw new common_1.ForbiddenException('You are not a member of this team');
        return m;
    }
    async assertRole(teamId, userId, allowed) {
        const m = await this.assertMember(teamId, userId);
        if (!allowed.includes(m.role)) {
            throw new common_1.ForbiddenException(`This action requires one of these roles: ${allowed.join(', ')}`);
        }
        return m;
    }
};
exports.TeamsService = TeamsService;
exports.TeamsService = TeamsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TeamsService);
//# sourceMappingURL=teams.service.js.map