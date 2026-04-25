import { PrismaService } from '../../prisma/prisma.service';
import { CreateTeamDto, UpdateTeamDto, InviteMemberDto, UpdateMemberRoleDto } from './dto/team.dto';
export declare class TeamsService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(userId: string): Promise<({
        _count: {
            members: number;
            boards: number;
        };
        members: ({
            user: {
                id: string;
                name: string;
                avatarUrl: string | null;
            };
        } & {
            id: string;
            teamId: string;
            userId: string;
            role: import(".prisma/client").$Enums.Role;
            joinedAt: Date;
        })[];
    } & {
        id: string;
        name: string;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        avatarUrl: string | null;
        slug: string;
        isPersonal: boolean;
    })[]>;
    findOne(teamId: string, userId: string): Promise<{
        members: ({
            user: {
                id: string;
                name: string;
                email: string;
                avatarUrl: string | null;
            };
        } & {
            id: string;
            teamId: string;
            userId: string;
            role: import(".prisma/client").$Enums.Role;
            joinedAt: Date;
        })[];
        boards: {
            id: string;
            name: string;
            description: string | null;
            updatedAt: Date;
        }[];
    } & {
        id: string;
        name: string;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        avatarUrl: string | null;
        slug: string;
        isPersonal: boolean;
    }>;
    create(ownerId: string, dto: CreateTeamDto): Promise<{
        members: ({
            user: {
                id: string;
                name: string;
                avatarUrl: string | null;
            };
        } & {
            id: string;
            teamId: string;
            userId: string;
            role: import(".prisma/client").$Enums.Role;
            joinedAt: Date;
        })[];
    } & {
        id: string;
        name: string;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        avatarUrl: string | null;
        slug: string;
        isPersonal: boolean;
    }>;
    update(teamId: string, userId: string, dto: UpdateTeamDto): Promise<{
        id: string;
        name: string;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        avatarUrl: string | null;
        slug: string;
        isPersonal: boolean;
    }>;
    inviteMember(teamId: string, inviterId: string, dto: InviteMemberDto): Promise<{
        user: {
            id: string;
            name: string;
            email: string;
            avatarUrl: string | null;
        };
    } & {
        id: string;
        teamId: string;
        userId: string;
        role: import(".prisma/client").$Enums.Role;
        joinedAt: Date;
    }>;
    updateMemberRole(teamId: string, targetId: string, actorId: string, dto: UpdateMemberRoleDto): Promise<{
        user: {
            id: string;
            name: string;
            avatarUrl: string | null;
        };
    } & {
        id: string;
        teamId: string;
        userId: string;
        role: import(".prisma/client").$Enums.Role;
        joinedAt: Date;
    }>;
    removeMember(teamId: string, targetId: string, actorId: string): Promise<{
        message: string;
    }>;
    private assertMember;
    private assertRole;
}
