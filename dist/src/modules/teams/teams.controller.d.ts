import { TeamsService } from './teams.service';
import { CreateTeamDto, UpdateTeamDto, InviteMemberDto, UpdateMemberRoleDto } from './dto/team.dto';
export declare class TeamsController {
    private teamsService;
    constructor(teamsService: TeamsService);
    findAll(user: any): Promise<({
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
    findOne(id: string, user: any): Promise<{
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
    create(user: any, dto: CreateTeamDto): Promise<{
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
    update(id: string, user: any, dto: UpdateTeamDto): Promise<{
        id: string;
        name: string;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        avatarUrl: string | null;
        slug: string;
        isPersonal: boolean;
    }>;
    invite(id: string, user: any, dto: InviteMemberDto): Promise<{
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
    updateRole(id: string, targetId: string, user: any, dto: UpdateMemberRoleDto): Promise<{
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
    removeMember(id: string, targetId: string, user: any): Promise<{
        message: string;
    }>;
}
