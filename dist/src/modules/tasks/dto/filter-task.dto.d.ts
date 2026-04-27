import { TaskStatus, Priority } from '@prisma/client';
export declare class FilterTaskDto {
    status?: TaskStatus;
    priority?: Priority;
    assigneeId?: string;
    search?: string;
    page?: number;
    limit?: number;
}
