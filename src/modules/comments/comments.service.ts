import {
  Injectable, NotFoundException, ForbiddenException,
} from '@nestjs/common';
import { PrismaService }    from '../../prisma/prisma.service';
import { ActivityService }  from '../activity/activity.service';
import { CreateCommentDto, UpdateCommentDto } from './dto/comment.dto';
import { ActivityType } from '@prisma/client';

const COMMENT_SELECT = {
  id: true, content: true, createdAt: true, updatedAt: true,
  author: { select: { id: true, name: true, avatarUrl: true } },
};

@Injectable()
export class CommentsService {
  constructor(
    private prisma:   PrismaService,
    private activity: ActivityService,
  ) {}

  // GET /tasks/:taskId/comments
  async findAll(taskId: string) {
    await this.assertTaskExists(taskId);
    return this.prisma.comment.findMany({
      where:   { taskId },
      select:  COMMENT_SELECT,
      orderBy: { createdAt: 'asc' },
    });
  }

  // POST /tasks/:taskId/comments
  async create(taskId: string, authorId: string, dto: CreateCommentDto) {
    const task = await this.assertTaskExists(taskId);

    const comment = await this.prisma.comment.create({
      data:   { content: dto.content, taskId, authorId },
      select: COMMENT_SELECT,
    });

    await this.activity.log({
      type:    ActivityType.COMMENT_ADDED,
      userId:  authorId,
      taskId,
      metadata: { commentId: comment.id, preview: dto.content.slice(0, 60) },
    });

    return comment;
  }

  // PATCH /comments/:id
  async update(commentId: string, userId: string, dto: UpdateCommentDto) {
    const comment = await this.assertCommentExists(commentId);
    this.assertOwnership(comment.authorId, userId);

    const updated = await this.prisma.comment.update({
      where:  { id: commentId },
      data:   { content: dto.content },
      select: COMMENT_SELECT,
    });

    await this.activity.log({
      type:    ActivityType.COMMENT_EDITED,
      userId,
      taskId:  comment.taskId,
      metadata: { commentId, preview: dto.content.slice(0, 60) },
    });

    return updated;
  }

  // DELETE /comments/:id
  async remove(commentId: string, userId: string) {
    const comment = await this.assertCommentExists(commentId);
    this.assertOwnership(comment.authorId, userId);

    await this.prisma.comment.delete({ where: { id: commentId } });

    await this.activity.log({
      type:    ActivityType.COMMENT_DELETED,
      userId,
      taskId:  comment.taskId,
      metadata: { commentId },
    });

    return { message: 'Comment deleted' };
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  private async assertTaskExists(taskId: string) {
    const task = await this.prisma.task.findUnique({ where: { id: taskId } });
    if (!task) throw new NotFoundException(`Task ${taskId} not found`);
    return task;
  }

  private async assertCommentExists(commentId: string) {
    const comment = await this.prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment) throw new NotFoundException(`Comment ${commentId} not found`);
    return comment;
  }

  private assertOwnership(ownerId: string, userId: string) {
    if (ownerId !== userId) {
      throw new ForbiddenException('You can only modify your own comments');
    }
  }
}
