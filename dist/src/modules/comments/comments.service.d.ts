import { PrismaService } from '../../prisma/prisma.service';
import { ActivityService } from '../activity/activity.service';
import { CreateCommentDto, UpdateCommentDto } from './dto/comment.dto';
export declare class CommentsService {
    private prisma;
    private activity;
    constructor(prisma: PrismaService, activity: ActivityService);
    findAll(taskId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        content: string;
        author: {
            id: string;
            name: string;
            avatarUrl: string | null;
        };
    }[]>;
    create(taskId: string, authorId: string, dto: CreateCommentDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        content: string;
        author: {
            id: string;
            name: string;
            avatarUrl: string | null;
        };
    }>;
    update(commentId: string, userId: string, dto: UpdateCommentDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        content: string;
        author: {
            id: string;
            name: string;
            avatarUrl: string | null;
        };
    }>;
    remove(commentId: string, userId: string): Promise<{
        message: string;
    }>;
    private assertTaskExists;
    private assertCommentExists;
    private assertOwnership;
}
