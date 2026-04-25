import {
  Injectable, NotFoundException, ConflictException,
  ForbiddenException, BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateTeamDto, UpdateTeamDto,
  InviteMemberDto, UpdateMemberRoleDto,
} from './dto/team.dto';
import { Role } from '@prisma/client';

@Injectable()
export class TeamsService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string) {
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

  async findOne(teamId: string, userId: string) {
    const team = await this.prisma.team.findUnique({
      where:   { id: teamId },
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

    if (!team) throw new NotFoundException(`Team ${teamId} not found`);
    await this.assertMember(teamId, userId);

    return team;
  }

  async create(ownerId: string, dto: CreateTeamDto) {
    const existing = await this.prisma.team.findUnique({ where: { slug: dto.slug } });
    if (existing) throw new ConflictException(`Team slug "${dto.slug}" is already taken`);

    return this.prisma.team.create({
      data: {
        ...dto,
        members: {
          create: { userId: ownerId, role: Role.OWNER },
        },
      },
      include: {
        members: {
          include: { user: { select: { id: true, name: true, avatarUrl: true } } },
        },
      },
    });
  }

  async update(teamId: string, userId: string, dto: UpdateTeamDto) {
    await this.assertRole(teamId, userId, [Role.OWNER, Role.ADMIN]);
    return this.prisma.team.update({ where: { id: teamId }, data: dto });
  }

  async inviteMember(teamId: string, inviterId: string, dto: InviteMemberDto) {
    await this.assertRole(teamId, inviterId, [Role.OWNER, Role.ADMIN]);

    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) throw new NotFoundException(`No user found with email ${dto.email}`);

    const existing = await this.prisma.teamMember.findUnique({
      where: { userId_teamId: { userId: user.id, teamId } },
    });
    if (existing) throw new ConflictException('User is already a member of this team');

    return this.prisma.teamMember.create({
      data: { userId: user.id, teamId, role: dto.role ?? Role.MEMBER },
      include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } },
    });
  }

  async updateMemberRole(
    teamId:   string,
    targetId: string,
    actorId:  string,
    dto:      UpdateMemberRoleDto,
  ) {
    await this.assertRole(teamId, actorId, [Role.OWNER, Role.ADMIN]);

    // Prevent removing last owner
    if (dto.role !== Role.OWNER) {
      const ownerCount = await this.prisma.teamMember.count({
        where: { teamId, role: Role.OWNER },
      });
      const isTarget = await this.prisma.teamMember.findUnique({
        where: { userId_teamId: { userId: targetId, teamId } },
      });
      if (ownerCount === 1 && isTarget?.role === Role.OWNER) {
        throw new BadRequestException('Cannot change the role of the last owner');
      }
    }

    return this.prisma.teamMember.update({
      where: { userId_teamId: { userId: targetId, teamId } },
      data:  { role: dto.role },
      include: { user: { select: { id: true, name: true, avatarUrl: true } } },
    });
  }

  async removeMember(teamId: string, targetId: string, actorId: string) {
    await this.assertRole(teamId, actorId, [Role.OWNER, Role.ADMIN]);

    const member = await this.prisma.teamMember.findUnique({
      where: { userId_teamId: { userId: targetId, teamId } },
    });
    if (!member) throw new NotFoundException('Member not found');
    if (member.role === Role.OWNER) throw new ForbiddenException('Cannot remove the team owner');

    await this.prisma.teamMember.delete({
      where: { userId_teamId: { userId: targetId, teamId } },
    });

    return { message: 'Member removed successfully' };
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  private async assertMember(teamId: string, userId: string) {
    const m = await this.prisma.teamMember.findUnique({
      where: { userId_teamId: { userId, teamId } },
    });
    if (!m) throw new ForbiddenException('You are not a member of this team');
    return m;
  }

  private async assertRole(teamId: string, userId: string, allowed: Role[]) {
    const m = await this.assertMember(teamId, userId);
    if (!allowed.includes(m.role)) {
      throw new ForbiddenException(
        `This action requires one of these roles: ${allowed.join(', ')}`,
      );
    }
    return m;
  }
}
