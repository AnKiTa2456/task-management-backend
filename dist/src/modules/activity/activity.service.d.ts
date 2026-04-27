import { Prisma } from '@prisma/client';
import { ActivityType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
interface LogActivityParams {
    type: ActivityType;
    userId: string;
    taskId?: string;
    boardId?: string;
    metadata?: Record<string, unknown>;
}
export declare class ActivityService {
    private prisma;
    constructor(prisma: PrismaService);
    log(params: LogActivityParams): Promise<{
        id: string;
        createdAt: Date;
        boardId: string | null;
        userId: string;
        taskId: string | null;
        type: import(".prisma/client").$Enums.ActivityType;
        metadata: Prisma.JsonValue;
        attachmentId: string | null;
    }>;
    getBoardActivity(boardId: string, page?: number, limit?: number): Promise<{
        activities: ({
            user: {
                id: string;
                name: string;
                avatarUrl: string | null;
            };
            task: {
                id: string;
                title: string;
            } | null;
        } & {
            id: string;
            createdAt: Date;
            boardId: string | null;
            userId: string;
            taskId: string | null;
            type: import(".prisma/client").$Enums.ActivityType;
            metadata: Prisma.JsonValue;
            attachmentId: string | null;
        })[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    getTaskActivity(taskId: string): Promise<({
        user: {
            id: string;
            name: string;
            avatarUrl: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        boardId: string | null;
        userId: string;
        taskId: string | null;
        type: import(".prisma/client").$Enums.ActivityType;
        metadata: Prisma.JsonValue;
        attachmentId: string | null;
    })[]>;
}
export {};
