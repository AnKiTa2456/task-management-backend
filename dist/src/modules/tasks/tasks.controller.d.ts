import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto, MoveTaskDto, AssignTaskDto } from './dto/update-task.dto';
import { FilterTaskDto } from './dto/filter-task.dto';
export declare class TasksController {
    private tasksService;
    constructor(tasksService: TasksService);
    create(user: any, dto: CreateTaskDto): Promise<{
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
    findOne(id: string): Promise<{
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
    update(id: string, user: any, dto: UpdateTaskDto): Promise<{
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
    move(id: string, user: any, dto: MoveTaskDto): Promise<{
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
    assign(id: string, user: any, dto: AssignTaskDto): Promise<{
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
    remove(id: string, user: any): Promise<{
        message: string;
    }>;
}
