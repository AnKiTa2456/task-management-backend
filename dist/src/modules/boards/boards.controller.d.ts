import { BoardsService } from './boards.service';
import { CreateBoardDto, UpdateBoardDto, CreateColumnDto } from './dto/board.dto';
export declare class BoardsController {
    private boardsService;
    constructor(boardsService: BoardsService);
    findAll(user: any): Promise<({
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
    findOne(id: string, user: any): Promise<{
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
    create(user: any, dto: CreateBoardDto): Promise<{
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
    update(id: string, user: any, dto: UpdateBoardDto): Promise<{
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
    remove(id: string, user: any): Promise<{
        message: string;
    }>;
    addColumn(id: string, user: any, dto: CreateColumnDto): Promise<{
        id: string;
        name: string;
        position: number;
        color: string | null;
        boardId: string;
        taskLimit: number | null;
        isDefault: boolean;
    }>;
    removeColumn(columnId: string, user: any): Promise<{
        message: string;
    }>;
}
