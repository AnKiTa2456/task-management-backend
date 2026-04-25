import { TaskStatus } from '@prisma/client';
import { CreateTaskDto } from './create-task.dto';
declare const UpdateTaskDto_base: import("@nestjs/common").Type<Partial<CreateTaskDto>>;
export declare class UpdateTaskDto extends UpdateTaskDto_base {
    status?: TaskStatus;
}
export declare class MoveTaskDto {
    columnId: string;
    position: number;
}
export declare class AssignTaskDto {
    assigneeId: string | null;
}
export {};
