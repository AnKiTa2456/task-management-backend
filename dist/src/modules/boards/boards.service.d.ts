import { PrismaService } from '../../prisma/prisma.service';
import { ActivityService } from '../activity/activity.service';
import { CreateBoardDto, UpdateBoardDto, CreateColumnDto } from './dto/board.dto';
export declare class BoardsService {
    private prisma;
    private activity;
    constructor(prisma: PrismaService, activity: ActivityService);
    findAll(userId: string): Promise<({
        owner: {
            id: string;
            name: string;
            avatarUrl: string | null;
        };
        columns: ({
            tasks: ({
                labels: {
                    id: string;
                    name: string;
                    color: string;
                }[];
                _count: {
                    comments: number;
                };
                assignee: {
                    id: string;
                    name: string;
                    avatarUrl: string | null;
                } | null;
            } & {
                id: string;
                description: string | null;
                createdAt: Date;
                updatedAt: Date;
                position: number;
                deletedAt: Date | null;
                title: string;
                status: import(".prisma/client").$Enums.TaskStatus;
                priority: import(".prisma/client").$Enums.Priority;
                dueDate: Date | null;
                startDate: Date | null;
                completedAt: Date | null;
                storyPoints: number | null;
                columnId: string;
                creatorId: string;
                assigneeId: string | null;
            })[];
        } & {
            id: string;
            name: string;
            position: number;
            color: string | null;
            boardId: string;
            taskLimit: number | null;
            isDefault: boolean;
        })[];
    } & {
        id: string;
        name: string;
        description: string | null;
        background: string | null;
        isPrivate: boolean;
        isArchived: boolean;
        archivedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        ownerId: string;
        teamId: string | null;
    })[]>;
    findOne(boardId: string, userId: string): Promise<{
        owner: {
            id: string;
            name: string;
            avatarUrl: string | null;
        };
        columns: ({
            tasks: ({
                labels: {
                    id: string;
                    name: string;
                    color: string;
                }[];
                _count: {
                    comments: number;
                };
                assignee: {
                    id: string;
                    name: string;
                    avatarUrl: string | null;
                } | null;
            } & {
                id: string;
                description: string | null;
                createdAt: Date;
                updatedAt: Date;
                position: number;
                deletedAt: Date | null;
                title: string;
                status: import(".prisma/client").$Enums.TaskStatus;
                priority: import(".prisma/client").$Enums.Priority;
                dueDate: Date | null;
                startDate: Date | null;
                completedAt: Date | null;
                storyPoints: number | null;
                columnId: string;
                creatorId: string;
                assigneeId: string | null;
            })[];
        } & {
            id: string;
            name: string;
            position: number;
            color: string | null;
            boardId: string;
            taskLimit: number | null;
            isDefault: boolean;
        })[];
        labels: {
            id: string;
            name: string;
            createdAt: Date;
            color: string;
            boardId: string;
        }[];
    } & {
        id: string;
        name: string;
        description: string | null;
        background: string | null;
        isPrivate: boolean;
        isArchived: boolean;
        archivedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        ownerId: string;
        teamId: string | null;
    }>;
    create(ownerId: string, dto: CreateBoardDto): Promise<{
        columns: {
            id: string;
            name: string;
            position: number;
            color: string | null;
            boardId: string;
            taskLimit: number | null;
            isDefault: boolean;
        }[];
    } & {
        id: string;
        name: string;
        description: string | null;
        background: string | null;
        isPrivate: boolean;
        isArchived: boolean;
        archivedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        ownerId: string;
        teamId: string | null;
    }>;
    update(boardId: string, userId: string, dto: UpdateBoardDto): Promise<{
        id: string;
        name: string;
        description: string | null;
        background: string | null;
        isPrivate: boolean;
        isArchived: boolean;
        archivedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        ownerId: string;
        teamId: string | null;
    }>;
    remove(boardId: string, userId: string): Promise<{
        message: string;
    }>;
    addColumn(boardId: string, userId: string, dto: CreateColumnDto): Promise<{
        id: string;
        name: string;
        position: number;
        color: string | null;
        boardId: string;
        taskLimit: number | null;
        isDefault: boolean;
    }>;
    removeColumn(columnId: string, userId: string): Promise<{
        message: string;
    }>;
    private assertOwner;
    private assertBoardAccessById;
    private assertBoardAccess;
}
