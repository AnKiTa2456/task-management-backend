import { Priority } from '@prisma/client';
export declare class CreateTaskDto {
    title: string;
    description?: string;
    columnId: string;
    priority?: Priority;
    dueDate?: string;
    assigneeId?: string;
    labelIds?: string[];
}
