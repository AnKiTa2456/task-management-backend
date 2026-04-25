import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString, IsEnum, IsOptional, IsDateString,
  MinLength, MaxLength, IsArray, IsUUID,
} from 'class-validator';
import { Priority } from '@prisma/client';

export class CreateTaskDto {
  @ApiProperty({ example: 'Fix login page authentication bug' })
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  title: string;

  @ApiPropertyOptional({ example: 'The JWT token is not being validated correctly...' })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @ApiProperty({ example: 'col_123' })
  @IsString()
  columnId: string;

  @ApiPropertyOptional({ enum: Priority, default: 'MEDIUM' })
  @IsOptional()
  @IsEnum(Priority)
  priority?: Priority;

  @ApiPropertyOptional({ example: '2024-12-31T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional({ example: 'user_abc123' })
  @IsOptional()
  @IsString()
  assigneeId?: string;

  @ApiPropertyOptional({ type: [String], example: ['label_1', 'label_2'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  labelIds?: string[];
}
