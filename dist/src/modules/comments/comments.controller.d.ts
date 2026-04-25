import { CommentsService } from './comments.service';
import { CreateCommentDto, UpdateCommentDto } from './dto/comment.dto';
export declare class CommentsController {
    private commentsService;
    constructor(commentsService: CommentsService);
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
    create(taskId: string, user: any, dto: CreateCommentDto): Promise<{
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
    update(id: string, user: any, dto: UpdateCommentDto): Promise<{
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
    remove(id: string, user: any): Promise<{
        message: string;
    }>;
}
