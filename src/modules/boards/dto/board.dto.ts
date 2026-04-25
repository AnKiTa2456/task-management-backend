import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsString, IsOptional, IsBoolean,
  MinLength, MaxLength, IsHexColor,
} from 'class-validator';

export class CreateBoardDto {
  @ApiProperty({ example: 'Sprint 12' })
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name: string;

  @ApiPropertyOptional({ example: 'Q4 engineering sprint' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ example: '#6366f1' })
  @IsOptional()
  @IsHexColor()
  background?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isPrivate?: boolean;

  @ApiPropertyOptional({ example: 'team_abc123' })
  @IsOptional()
  @IsString()
  teamId?: string;
}

export class UpdateBoardDto extends PartialType(CreateBoardDto) {}

export class CreateColumnDto {
  @ApiProperty({ example: 'Blocked' })
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  name: string;

  @ApiPropertyOptional({ example: '#ef4444' })
  @IsOptional()
  @IsHexColor()
  color?: string;
}
