import { Injectable } from '@nestjs/common';
import { Prisma }     from '@prisma/client';
import { ActivityType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

interface LogActivityParams {
  type:      ActivityType;
  userId:    string;
  taskId?:   string;
  boardId?:  string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class ActivityService {
  constructor(private prisma: PrismaService) {}

  async log(params: LogActivityParams) {
    return this.prisma.activity.create({
      data: {
        type:     params.type,
        userId:   params.userId,
        taskId:   params.taskId,
        boardId:  params.boardId,
        metadata: (params.metadata ?? {}) as Prisma.InputJsonValue,
      },
    });
  }

  async getBoardActivity(boardId: string, page = 1, limit = 30) {
    const skip = (page - 1) * limit;
    const [activities, total] = await Promise.all([
      this.prisma.activity.findMany({
        where:   { boardId },
        include: {
          user: { select: { id: true, name: true, avatarUrl: true } },
          task: { select: { id: true, title: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.activity.count({ where: { boardId } }),
    ]);

    return {
      activities,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getTaskActivity(taskId: string) {
    return this.prisma.activity.findMany({
      where:   { taskId },
      include: { user: { select: { id: true, name: true, avatarUrl: true } } },
      orderBy: { createdAt: 'desc' },
      take:    50,
    });
  }
}
