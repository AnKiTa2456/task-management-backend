import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsString, IsOptional, IsEnum, IsEmail,
  MinLength, MaxLength, Matches,
} from 'class-validator';
import { Role } from '@prisma/client';

export class CreateTeamDto {
  @ApiProperty({ example: 'Engineering' })
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  name: string;

  @ApiProperty({ example: 'engineering' })
  @IsString()
  @Matches(/^[a-z0-9-]+$/, { message: 'Slug must be lowercase letters, numbers, or hyphens' })
  @MaxLength(60)
  slug: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}

export class UpdateTeamDto extends PartialType(CreateTeamDto) {}

export class InviteMemberDto {
  @ApiProperty({ example: 'bob@example.com' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ enum: Role, default: 'MEMBER' })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;
}

export class UpdateMemberRoleDto {
  @ApiProperty({ enum: Role })
  @IsEnum(Role)
  role: Role;
}
