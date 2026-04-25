import { ActivityService } from './activity.service';
export declare class ActivityController {
    private activityService;
    constructor(activityService: ActivityService);
    getBoardActivity(boardId: string, page: string, limit: string): Promise<{
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
            metadata: import("@prisma/client/runtime/library").JsonValue;
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
        metadata: import("@prisma/client/runtime/library").JsonValue;
        attachmentId: string | null;
    })[]>;
}
