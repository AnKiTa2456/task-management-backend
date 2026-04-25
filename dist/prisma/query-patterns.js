"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function boardQueries() {
    const board = await prisma.board.findUnique({
        where: { id: 'board_id' },
        include: {
            columns: {
                orderBy: { position: 'asc' },
                include: {
                    tasks: {
                        where: { deletedAt: null },
                        orderBy: { position: 'asc' },
                        include: {
                            assignee: { select: { id: true, name: true, avatarUrl: true } },
                            labels: { select: { id: true, name: true, color: true } },
                            _count: { select: { comments: true, attachments: true } },
                        },
                    },
                },
            },
            labels: true,
        },
    });
    const userBoards = await prisma.board.findMany({
        where: {
            isArchived: false,
            OR: [
                { ownerId: 'user_id' },
                { team: { members: { some: { userId: 'user_id' } } } },
            ],
        },
        include: {
            owner: { select: { id: true, name: true, avatarUrl: true } },
            _count: { select: { columns: true } },
        },
        orderBy: { updatedAt: 'desc' },
    });
}
async function taskQueries() {
    const task = await prisma.task.findUnique({
        where: { id: 'task_id' },
        include: {
            creator: { select: { id: true, name: true, avatarUrl: true } },
            assignee: { select: { id: true, name: true, avatarUrl: true } },
            labels: true,
            comments: {
                where: { deletedAt: null, parentId: null },
                orderBy: { createdAt: 'asc' },
                include: {
                    author: { select: { id: true, name: true, avatarUrl: true } },
                    replies: {
                        where: { deletedAt: null },
                        orderBy: { createdAt: 'asc' },
                        include: { author: { select: { id: true, name: true, avatarUrl: true } } },
                    },
                },
            },
            attachments: {
                where: { deletedAt: null },
                orderBy: { createdAt: 'desc' },
                include: { uploader: { select: { id: true, name: true } } },
            },
            watchers: { include: { user: { select: { id: true, name: true, avatarUrl: true } } } },
        },
    });
    const myTasks = await prisma.task.findMany({
        where: {
            assigneeId: 'user_id',
            deletedAt: null,
            status: { notIn: ['DONE', 'CANCELLED'] },
        },
        orderBy: [
            { priority: 'desc' },
            { dueDate: { sort: 'asc', nulls: 'last' } },
        ],
        include: {
            labels: { select: { id: true, name: true, color: true } },
            column: { select: { id: true, name: true, boardId: true } },
        },
        take: 10,
    });
    const page = 1;
    const limit = 20;
    const [tasks, total] = await Promise.all([
        prisma.task.findMany({
            where: {
                column: { boardId: 'board_id' },
                deletedAt: null,
                status: 'IN_PROGRESS',
                priority: 'HIGH',
                assigneeId: 'user_id',
                title: { contains: 'auth', mode: 'insensitive' },
            },
            include: {
                assignee: { select: { id: true, name: true, avatarUrl: true } },
                labels: true,
            },
            orderBy: { position: 'asc' },
            skip: (page - 1) * limit,
            take: limit,
        }),
        prisma.task.count({
            where: {
                column: { boardId: 'board_id' },
                deletedAt: null,
                status: 'IN_PROGRESS',
            },
        }),
    ]);
    const overdueTasks = await prisma.task.count({
        where: {
            assigneeId: 'user_id',
            deletedAt: null,
            dueDate: { lt: new Date() },
            status: { notIn: ['DONE', 'CANCELLED'] },
        },
    });
    const tasksByStatus = await prisma.task.groupBy({
        by: ['status'],
        where: { column: { boardId: 'board_id' }, deletedAt: null },
        _count: { _all: true },
    });
    const tasksByPriority = await prisma.task.groupBy({
        by: ['priority'],
        where: { column: { boardId: 'board_id' }, deletedAt: null },
        _count: { _all: true },
    });
}
async function moveTask(taskId, fromColumnId, toColumnId, newPosition, userId) {
    const task = await prisma.task.findUniqueOrThrow({ where: { id: taskId } });
    await prisma.$transaction(async (tx) => {
        if (fromColumnId !== toColumnId) {
            await tx.task.updateMany({
                where: { columnId: fromColumnId, position: { gt: task.position } },
                data: { position: { decrement: 1 } },
            });
            await tx.task.updateMany({
                where: { columnId: toColumnId, position: { gte: newPosition } },
                data: { position: { increment: 1 } },
            });
        }
        else {
            const movingDown = newPosition > task.position;
            await tx.task.updateMany({
                where: {
                    columnId: fromColumnId,
                    position: movingDown
                        ? { gt: task.position, lte: newPosition }
                        : { gte: newPosition, lt: task.position },
                },
                data: { position: { increment: movingDown ? -1 : 1 } },
            });
        }
        await tx.task.update({
            where: { id: taskId },
            data: { columnId: toColumnId, position: newPosition },
        });
        await tx.activity.create({
            data: {
                type: client_1.ActivityType.TASK_MOVED,
                userId,
                taskId,
                metadata: { fromColumnId, toColumnId, position: newPosition },
            },
        });
    });
}
async function commentQueries() {
    const { comment } = await prisma.$transaction(async (tx) => {
        const comment = await tx.comment.create({
            data: { content: 'Looks good to me!', taskId: 'task_id', authorId: 'user_id' },
            include: { author: { select: { id: true, name: true, avatarUrl: true } } },
        });
        await tx.activity.create({
            data: {
                type: client_1.ActivityType.COMMENT_ADDED,
                userId: 'user_id',
                taskId: 'task_id',
                metadata: { commentId: comment.id, preview: 'Looks good to me!' },
            },
        });
        const watchers = await tx.taskWatcher.findMany({
            where: { taskId: 'task_id', userId: { not: 'user_id' } },
        });
        await tx.notification.createMany({
            data: watchers.map(w => ({
                userId: w.userId,
                title: 'New comment on a task you watch',
                body: 'Looks good to me!',
                actionUrl: `/tasks/task_id`,
            })),
        });
        return { comment };
    });
    const deleted = await prisma.comment.update({
        where: { id: 'comment_id' },
        data: { deletedAt: new Date(), content: '' },
    });
}
async function attachmentQueries() {
    const attachment = await prisma.$transaction(async (tx) => {
        const att = await tx.taskAttachment.create({
            data: {
                filename: 'design-spec.pdf',
                storageKey: `uploads/task_id/${crypto.randomUUID()}.pdf`,
                mimeType: 'application/pdf',
                sizeBytes: 204_800,
                type: 'DOCUMENT',
                taskId: 'task_id',
                uploaderId: 'user_id',
            },
        });
        await tx.activity.create({
            data: {
                type: client_1.ActivityType.ATTACHMENT_UPLOADED,
                userId: 'user_id',
                taskId: 'task_id',
                attachmentId: att.id,
                metadata: { filename: att.filename, sizeBytes: att.sizeBytes },
            },
        });
        return att;
    });
    const attachments = await prisma.taskAttachment.findMany({
        where: { taskId: 'task_id', deletedAt: null },
        orderBy: { createdAt: 'desc' },
        include: { uploader: { select: { id: true, name: true } } },
    });
    await prisma.taskAttachment.update({
        where: { id: 'attachment_id' },
        data: { deletedAt: new Date() },
    });
}
async function activityQueries() {
    const feed = await prisma.activity.findMany({
        where: { boardId: 'board_id' },
        include: {
            user: { select: { id: true, name: true, avatarUrl: true } },
            task: { select: { id: true, title: true } },
            attachment: { select: { id: true, filename: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 30,
        skip: 0,
    });
    const taskTimeline = await prisma.activity.findMany({
        where: { taskId: 'task_id' },
        include: { user: { select: { id: true, name: true, avatarUrl: true } } },
        orderBy: { createdAt: 'asc' },
    });
    const userActivity = await prisma.activity.findMany({
        where: { userId: 'user_id' },
        include: {
            task: { select: { id: true, title: true } },
            board: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
    });
}
async function teamQueries() {
    const invite = async (teamId, email, inviterId) => {
        const user = await prisma.user.findUniqueOrThrow({ where: { email } });
        return prisma.teamMember.create({
            data: { teamId, userId: user.id, role: 'MEMBER' },
            include: { user: { select: { id: true, name: true, email: true } } },
        });
    };
    const admins = await prisma.teamMember.findMany({
        where: { teamId: 'team_id', role: { in: ['OWNER', 'ADMIN'] } },
        include: { user: { select: { id: true, name: true, email: true } } },
    });
}
async function notificationQueries() {
    const unreadCount = await prisma.notification.count({
        where: { userId: 'user_id', status: 'UNREAD' },
    });
    await prisma.notification.updateMany({
        where: { userId: 'user_id', status: 'UNREAD' },
        data: { status: 'READ', readAt: new Date() },
    });
    const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    await prisma.notification.deleteMany({
        where: { status: { not: 'UNREAD' }, createdAt: { lt: cutoff } },
    });
}
async function searchTasks(boardId, query) {
    return prisma.task.findMany({
        where: {
            column: { boardId },
            deletedAt: null,
            OR: [
                { title: { contains: query, mode: 'insensitive' } },
                { description: { contains: query, mode: 'insensitive' } },
            ],
        },
        include: {
            assignee: { select: { id: true, name: true, avatarUrl: true } },
            labels: true,
            column: { select: { id: true, name: true } },
        },
        take: 20,
    });
}
//# sourceMappingURL=query-patterns.js.map