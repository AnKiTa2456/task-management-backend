"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TasksService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const activity_service_1 = require("../activity/activity.service");
const client_1 = require("@prisma/client");
const TASK_SELECT = {
    id: true, title: true, description: true,
    status: true, priority: true, position: true, dueDate: true,
    createdAt: true, updatedAt: true, columnId: true,
    creator: { select: { id: true, name: true, avatarUrl: true } },
    assignee: { select: { id: true, name: true, avatarUrl: true } },
    labels: { select: { id: true, name: true, color: true } },
    _count: { select: { comments: true } },
};
let TasksService = class TasksService {
    constructor(prisma, activity) {
        this.prisma = prisma;
        this.activity = activity;
    }
    async create(creatorId, dto) {
        const column = await this.prisma.column.findUnique({
            where: { id: dto.columnId },
            include: { board: true },
        });
        if (!column)
            throw new common_1.NotFoundException('Column not found');
        const lastTask = await this.prisma.task.findFirst({
            where: { columnId: dto.columnId },
            orderBy: { position: 'desc' },
        });
        const position = (lastTask?.position ?? -1) + 1;
        const task = await this.prisma.task.create({
            data: {
                title: dto.title,
                description: dto.description,
                priority: dto.priority ?? 'MEDIUM',
                dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
                position,
                columnId: dto.columnId,
                creatorId,
                assigneeId: dto.assigneeId,
                labels: dto.labelIds
                    ? { connect: dto.labelIds.map(id => ({ id })) }
                    : undefined,
            },
            select: TASK_SELECT,
        });
        await this.activity.log({
            type: client_1.ActivityType.TASK_CREATED,
            userId: creatorId,
            taskId: task.id,
            boardId: column.board.id,
            metadata: { taskTitle: task.title },
        });
        return task;
    }
    async findAll(boardId, filters) {
        const { status, priority, assigneeId, search, page = 1, limit = 20 } = filters;
        const skip = (page - 1) * limit;
        const where = {
            column: { boardId },
            ...(status && { status }),
            ...(priority && { priority }),
            ...(assigneeId && { assigneeId }),
            ...(search && {
                OR: [
                    { title: { contains: search, mode: 'insensitive' } },
                    { description: { contains: search, mode: 'insensitive' } },
                ],
            }),
        };
        const [tasks, total] = await Promise.all([
            this.prisma.task.findMany({
                where,
                select: TASK_SELECT,
                orderBy: [{ columnId: 'asc' }, { position: 'asc' }],
                skip,
                take: limit,
            }),
            this.prisma.task.count({ where }),
        ]);
        return {
            tasks,
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
        };
    }
    async findOne(taskId) {
        const task = await this.prisma.task.findUnique({
            where: { id: taskId },
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
        if (!task)
            throw new common_1.NotFoundException(`Task ${taskId} not found`);
        return task;
    }
    async update(taskId, userId, dto) {
        await this.assertTaskExists(taskId);
        const task = await this.prisma.task.update({
            where: { id: taskId },
            data: {
                ...(dto.title && { title: dto.title }),
                ...(dto.description !== undefined && { description: dto.description }),
                ...(dto.priority && { priority: dto.priority }),
                ...(dto.status && { status: dto.status }),
                ...(dto.dueDate !== undefined && { dueDate: dto.dueDate ? new Date(dto.dueDate) : null }),
                ...(dto.assigneeId !== undefined && { assigneeId: dto.assigneeId }),
                ...(dto.labelIds && { labels: { set: dto.labelIds.map(id => ({ id })) } }),
            },
            select: TASK_SELECT,
        });
        await this.activity.log({
            type: client_1.ActivityType.TASK_UPDATED,
            userId,
            taskId,
            metadata: { changes: Object.keys(dto) },
        });
        return task;
    }
    async move(taskId, userId, dto) {
        const task = await this.assertTaskExists(taskId);
        const fromColumnId = task.columnId;
        if (fromColumnId !== dto.columnId) {
            await this.prisma.task.updateMany({
                where: {
                    columnId: fromColumnId,
                    position: { gt: task.position },
                },
                data: { position: { decrement: 1 } },
            });
            await this.prisma.task.updateMany({
                where: {
                    columnId: dto.columnId,
                    position: { gte: dto.position },
                },
                data: { position: { increment: 1 } },
            });
        }
        else {
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
            data: { columnId: dto.columnId, position: dto.position },
            select: TASK_SELECT,
        });
        await this.activity.log({
            type: client_1.ActivityType.TASK_MOVED,
            userId,
            taskId,
            metadata: { fromColumnId, toColumnId: dto.columnId },
        });
        return updated;
    }
    async assign(taskId, userId, dto) {
        await this.assertTaskExists(taskId);
        const task = await this.prisma.task.update({
            where: { id: taskId },
            data: { assigneeId: dto.assigneeId },
            select: TASK_SELECT,
        });
        await this.activity.log({
            type: client_1.ActivityType.TASK_ASSIGNED,
            userId,
            taskId,
            metadata: { assigneeId: dto.assigneeId },
        });
        return task;
    }
    async remove(taskId, userId) {
        const task = await this.assertTaskExists(taskId);
        if (task.creatorId !== userId) {
            throw new common_1.ForbiddenException('Only the task creator can delete this task');
        }
        await this.prisma.task.delete({ where: { id: taskId } });
        return { message: 'Task deleted successfully' };
    }
    async assertTaskExists(taskId) {
        const task = await this.prisma.task.findUnique({ where: { id: taskId } });
        if (!task)
            throw new common_1.NotFoundException(`Task ${taskId} not found`);
        return task;
    }
};
exports.TasksService = TasksService;
exports.TasksService = TasksService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        activity_service_1.ActivityService])
], TasksService);
//# sourceMappingURL=tasks.service.js.map