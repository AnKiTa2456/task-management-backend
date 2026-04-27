import { Role } from '@prisma/client';
export declare class CreateTeamDto {
    name: string;
    slug: string;
    description?: string;
}
declare const UpdateTeamDto_base: import("@nestjs/common").Type<Partial<CreateTeamDto>>;
export declare class UpdateTeamDto extends UpdateTeamDto_base {
}
export declare class InviteMemberDto {
    email: string;
    role?: Role;
}
export declare class UpdateMemberRoleDto {
    role: Role;
}
export {};
