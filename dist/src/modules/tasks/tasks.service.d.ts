import { PrismaService } from '../../prisma/prisma.service';
import { ActivityService } from '../activity/activity.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto, MoveTaskDto, AssignTaskDto } from './dto/update-task.dto';
import { FilterTaskDto } from './dto/filter-task.dto';
export declare class TasksService {
    private prisma;
    private activity;
    constructor(prisma: PrismaService, activity: ActivityService);
    create(creatorId: string, dto: CreateTaskDto): Promise<{
        id: string;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        labels: {
            id: string;
            name: string;
            color: string;
        }[];
        position: number;
        _count: {
            comments: number;
        };
        title: string;
        status: import(".prisma/client").$Enums.TaskStatus;
        priority: import(".prisma/client").$Enums.Priority;
        dueDate: Date | null;
        columnId: string;
        creator: {
            id: string;
            name: string;
            avatarUrl: string | null;
        };
        assignee: {
            id: string;
            name: string;
            avatarUrl: string | null;
        } | null;
    }>;
    findAll(boardId: string, filters: FilterTaskDto): Promise<{
        tasks: {
            id: string;
            description: string | null;
            createdAt: Date;
            updatedAt: Date;
            labels: {
                id: string;
                name: string;
                color: string;
            }[];
            position: number;
            _count: {
                comments: number;
            };
            title: string;
            status: import(".prisma/client").$Enums.TaskStatus;
            priority: import(".prisma/client").$Enums.Priority;
            dueDate: Date | null;
            columnId: string;
            creator: {
                id: string;
                name: string;
                avatarUrl: string | null;
            };
            assignee: {
                id: string;
                name: string;
                avatarUrl: string | null;
            } | null;
        }[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    findOne(taskId: string): Promise<{
        id: string;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        labels: {
            id: string;
            name: string;
            color: string;
        }[];
        position: number;
        comments: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            content: string;
            author: {
                id: string;
                name: string;
                avatarUrl: string | null;
            };
        }[];
        _count: {
            comments: number;
        };
        title: string;
        status: import(".prisma/client").$Enums.TaskStatus;
        priority: import(".prisma/client").$Enums.Priority;
        dueDate: Date | null;
        columnId: string;
        creator: {
            id: string;
            name: string;
            avatarUrl: string | null;
        };
        assignee: {
            id: string;
            name: string;
            avatarUrl: string | null;
        } | null;
    }>;
    update(taskId: string, userId: string, dto: UpdateTaskDto): Promise<{
        id: string;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        labels: {
            id: string;
            name: string;
            color: string;
        }[];
        position: number;
        _count: {
            comments: number;
        };
        title: string;
        status: import(".prisma/client").$Enums.TaskStatus;
        priority: import(".prisma/client").$Enums.Priority;
        dueDate: Date | null;
        columnId: string;
        creator: {
            id: string;
            name: string;
            avatarUrl: string | null;
        };
        assignee: {
            id: string;
            name: string;
            avatarUrl: string | null;
        } | null;
    }>;
    move(taskId: string, userId: string, dto: MoveTaskDto): Promise<{
        id: string;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        labels: {
            id: string;
            name: string;
            color: string;
        }[];
        position: number;
        _count: {
            comments: number;
        };
        title: string;
        status: import(".prisma/client").$Enums.TaskStatus;
        priority: import(".prisma/client").$Enums.Priority;
        dueDate: Date | null;
        columnId: string;
        creator: {
            id: string;
            name: string;
            avatarUrl: string | null;
        };
        assignee: {
            id: string;
            name: string;
            avatarUrl: string | null;
        } | null;
    }>;
    assign(taskId: string, userId: string, dto: AssignTaskDto): Promise<{
        id: string;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        labels: {
            id: string;
            name: string;
            color: string;
        }[];
        position: number;
        _count: {
            comments: number;
        };
        title: string;
        status: import(".prisma/client").$Enums.TaskStatus;
        priority: import(".prisma/client").$Enums.Priority;
        dueDate: Date | null;
        columnId: string;
        creator: {
            id: string;
            name: string;
            avatarUrl: string | null;
        };
        assignee: {
            id: string;
            name: string;
            avatarUrl: string | null;
        } | null;
    }>;
    remove(taskId: string, userId: string): Promise<{
        message: string;
    }>;
    private assertTaskExists;
}
