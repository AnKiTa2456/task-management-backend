import {
  Injectable, NotFoundException,
  ForbiddenException, BadRequestException,
} from '@nestjs/common';
import { PrismaService }    from '../../prisma/prisma.service';
import { ActivityService }  from '../activity/activity.service';
import { CreateTaskDto }    from './dto/create-task.dto';
import { UpdateTaskDto, MoveTaskDto, AssignTaskDto } from './dto/update-task.dto';
import { FilterTaskDto }    from './dto/filter-task.dto';
import { ActivityType }     from '@prisma/client';

// Select shape reused across queries
const TASK_SELECT = {
  id: true, title: true, description: true,
  status: true, priority: true, position: true, dueDate: true,
  createdAt: true, updatedAt: true, columnId: true,
  creator:  { select: { id: true, name: true, avatarUrl: true } },
  assignee: { select: { id: true, name: true, avatarUrl: true } },
  labels:   { select: { id: true, name: true, color: true } },
  _count:   { select: { comments: true } },
};

@Injectable()
export class TasksService {
  constructor(
    private prisma:    PrismaService,
    private activity:  ActivityService,
  ) {}

  // ── Create ─────────────────────────────────────────────────────────────────

  async create(creatorId: string, dto: CreateTaskDto) {
    const column = await this.prisma.column.findUnique({
      where: { id: dto.columnId },
      include: { board: true },
    });
    if (!column) throw new NotFoundException('Column not found');

    // Calculate next position
    const lastTask = await this.prisma.task.findFirst({
      where:   { columnId: dto.columnId },
      orderBy: { position: 'desc' },
    });
    const position = (lastTask?.position ?? -1) + 1;

    const task = await this.prisma.task.create({
      data: {
        title:       dto.title,
        description: dto.description,
        priority:    dto.priority ?? 'MEDIUM',
        dueDate:     dto.dueDate ? new Date(dto.dueDate) : undefined,
        position,
        columnId:    dto.columnId,
        creatorId,
        assigneeId:  dto.assigneeId,
        labels:      dto.labelIds
          ? { connect: dto.labelIds.map(id => ({ id })) }
          : undefined,
      },
      select: TASK_SELECT,
    });

    await this.activity.log({
      type:    ActivityType.TASK_CREATED,
      userId:  creatorId,
      taskId:  task.id,
      boardId: column.board.id,
      metadata: { taskTitle: task.title },
    });

    return task;
  }

  // ── Find all (with filters + pagination) ───────────────────────────────────

  async findAll(boardId: string, filters: FilterTaskDto) {
    const { status, priority, assigneeId, search, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const where = {
      column: { boardId },
      ...(status     && { status }),
      ...(priority   && { priority }),
      ...(assigneeId && { assigneeId }),
      ...(search     && {
        OR: [
          { title:       { contains: search, mode: 'insensitive' as const } },
          { description: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    };

    const [tasks, total] = await Promise.all([
      this.prisma.task.findMany({
        where,
        select:  TASK_SELECT,
        orderBy: [{ columnId: 'asc' }, { position: 'asc' }],
        skip,
        take:    limit,
      }),
      this.prisma.task.count({ where }),
    ]);

    return {
      tasks,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  // ── Find one ───────────────────────────────────────────────────────────────

  async findOne(taskId: string) {
    const task = await this.prisma.task.findUnique({
      where:  { id: taskId },
      select: {
        ...TASK_SELECT,
        comments: {
          select: {
            id: true, content: true, createdAt: true, updatedAt: true,
            author: { select: { id: true, name: true, avatarUrl: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!task) throw new NotFoundException(`Task ${taskId} not found`);
    return task;
  }

  // ── Update ─────────────────────────────────────────────────────────────────

  async update(taskId: string, userId: string, dto: UpdateTaskDto) {
    await this.assertTaskExists(taskId);

    const task = await this.prisma.task.update({
      where: { id: taskId },
      data:  {
        ...(dto.title       && { title: dto.title }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.priority    && { priority: dto.priority }),
        ...(dto.status      && { status: dto.status }),
        ...(dto.dueDate     !== undefined && { dueDate: dto.dueDate ? new Date(dto.dueDate) : null }),
        ...(dto.assigneeId  !== undefined && { assigneeId: dto.assigneeId }),
        ...(dto.labelIds    && { labels: { set: dto.labelIds.map(id => ({ id })) } }),
      },
      select: TASK_SELECT,
    });

    await this.activity.log({
      type:    ActivityType.TASK_UPDATED,
      userId,
      taskId,
      metadata: { changes: Object.keys(dto) },
    });

    return task;
  }

  // ── Move task (drag-and-drop) ──────────────────────────────────────────────

  async move(taskId: string, userId: string, dto: MoveTaskDto) {
    const task = await this.assertTaskExists(taskId);
    const fromColumnId = task.columnId;

    // Reorder tasks in source column
    if (fromColumnId !== dto.columnId) {
      // Remove from source
      await this.prisma.task.updateMany({
        where: {
          columnId: fromColumnId,
          position: { gt: task.position },
        },
        data: { position: { decrement: 1 } },
      });

      // Make room in destination
      await this.prisma.task.updateMany({
        where: {
          columnId: dto.columnId,
          position: { gte: dto.position },
        },
        data: { position: { increment: 1 } },
      });
    } else {
      // Same-column reorder
      const isMovingDown = dto.position > task.position;
      await this.prisma.task.updateMany({
        where: {
          columnId: fromColumnId,
          position: isMovingDown
            ? { gt: task.position, lte: dto.position }
            : { gte: dto.position, lt: task.position },
        },
        data: { position: { increment: isMovingDown ? -1 : 1 } },
      });
    }

    const updated = await this.prisma.task.update({
      where: { id: taskId },
      data:  { columnId: dto.columnId, position: dto.position },
      select: TASK_SELECT,
    });

    await this.activity.log({
      type:    ActivityType.TASK_MOVED,
      userId,
      taskId,
      metadata: { fromColumnId, toColumnId: dto.columnId },
    });

    return updated;
  }

  // ── Assign ────────────────────────────────────────────────────────────────

  async assign(taskId: string, userId: string, dto: AssignTaskDto) {
    await this.assertTaskExists(taskId);

    const task = await this.prisma.task.update({
      where: { id: taskId },
      data:  { assigneeId: dto.assigneeId },
      select: TASK_SELECT,
    });

    await this.activity.log({
      type:    ActivityType.TASK_ASSIGNED,
      userId,
      taskId,
      metadata: { assigneeId: dto.assigneeId },
    });

    return task;
  }

  // ── Delete ────────────────────────────────────────────────────────────────

  async remove(taskId: string, userId: string) {
    const task = await this.assertTaskExists(taskId);

    // Only creator can delete
    if (task.creatorId !== userId) {
      throw new ForbiddenException('Only the task creator can delete this task');
    }

    await this.prisma.task.delete({ where: { id: taskId } });

    return { message: 'Task deleted successfully' };
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private async assertTaskExists(taskId: string) {
    const task = await this.prisma.task.findUnique({ where: { id: taskId } });
    if (!task) throw new NotFoundException(`Task ${taskId} not found`);
    return task;
  }
}
