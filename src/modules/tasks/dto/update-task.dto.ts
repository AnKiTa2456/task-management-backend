import { PartialType } from '@nestjs/swagger';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { TaskStatus } from '@prisma/client';
import { CreateTaskDto } from './create-task.dto';

export class UpdateTaskDto extends PartialType(CreateTaskDto) {
  @ApiPropertyOptional({ enum: TaskStatus })
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;
}

export class MoveTaskDto {
  @ApiPropertyOptional({ example: 'col_456' })
  @IsString()
  columnId: string;

  @ApiPropertyOptional({ example: 2 })
  position: number;
}

export class AssignTaskDto {
  @ApiPropertyOptional({ example: 'user_abc123', nullable: true })
  @IsOptional()
  @IsString()
  assigneeId: string | null;
}
