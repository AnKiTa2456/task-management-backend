/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║  TaskFlow — Prisma Query Patterns Reference                               ║
 * ║  Every common data-access pattern used across the application.            ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 *
 * Run this file with:  ts-node prisma/query-patterns.ts
 */

import { PrismaClient, TaskStatus, Priority, ActivityType } from '@prisma/client';

const prisma = new PrismaClient();

// ─────────────────────────────────────────────────────────────────────────────
// 1. BOARD QUERIES
// ─────────────────────────────────────────────────────────────────────────────

async function boardQueries() {
  // ── Full Kanban board (columns + tasks + assignees + labels) ──────────────
  // Used by: KanbanPage on initial load
  const board = await prisma.board.findUnique({
    where: { id: 'board_id' },
    include: {
      columns: {
        orderBy: { position: 'asc' },
        include: {
          tasks: {
            where:   { deletedAt: null },           // exclude soft-deleted
            orderBy: { position: 'asc' },
            include: {
              assignee: { select: { id: true, name: true, avatarUrl: true } },
              labels:   { select: { id: true, name: true, color: true } },
              _count:   { select: { comments: true, attachments: true } },
            },
          },
        },
      },
      labels: true,
    },
  });

  // ── All boards a user can access (owned + team member) ────────────────────
  // Used by: BoardsPage sidebar
  const userBoards = await prisma.board.findMany({
    where: {
      isArchived: false,
      OR: [
        { ownerId: 'user_id' },
        { team: { members: { some: { userId: 'user_id' } } } },
      ],
    },
    include: {
      owner:  { select: { id: true, name: true, avatarUrl: true } },
      _count: { select: { columns: true } },
    },
    orderBy: { updatedAt: 'desc' },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. TASK QUERIES
// ─────────────────────────────────────────────────────────────────────────────

async function taskQueries() {
  // ── Task detail (full — includes comments + attachments) ──────────────────
  // Used by: TaskDetailPanel
  const task = await prisma.task.findUnique({
    where: { id: 'task_id' },
    include: {
      creator:  { select: { id: true, name: true, avatarUrl: true } },
      assignee: { select: { id: true, name: true, avatarUrl: true } },
      labels:   true,
      comments: {
        where:   { deletedAt: null, parentId: null },   // top-level only
        orderBy: { createdAt: 'asc' },
        include: {
          author:  { select: { id: true, name: true, avatarUrl: true } },
          replies: {
            where:   { deletedAt: null },
            orderBy: { createdAt: 'asc' },
            include: { author: { select: { id: true, name: true, avatarUrl: true } } },
          },
        },
      },
      attachments: {
        where:   { deletedAt: null },
        orderBy: { createdAt: 'desc' },
        include: { uploader: { select: { id: true, name: true } } },
      },
      watchers: { include: { user: { select: { id: true, name: true, avatarUrl: true } } } },
    },
  });

  // ── "My Tasks" dashboard widget ───────────────────────────────────────────
  // Assigned to me, not done, ordered by urgency then due date
  const myTasks = await prisma.task.findMany({
    where: {
      assigneeId: 'user_id',
      deletedAt:  null,
      status:     { notIn: ['DONE', 'CANCELLED'] },
    },
    orderBy: [
      // Urgent first
      { priority: 'desc' },
      // Then by due date (overdue first)
      { dueDate: { sort: 'asc', nulls: 'last' } },
    ],
    include: {
      labels: { select: { id: true, name: true, color: true } },
      column: { select: { id: true, name: true, boardId: true } },
    },
    take: 10,
  });

  // ── Filter + paginate tasks on a board ────────────────────────────────────
  // Used by: board search & filter toolbar
  const page  = 1;
  const limit = 20;

  const [tasks, total] = await Promise.all([
    prisma.task.findMany({
      where: {
        column:    { boardId: 'board_id' },
        deletedAt: null,
        status:    'IN_PROGRESS',
        priority:  'HIGH',
        assigneeId: 'user_id',
        title:     { contains: 'auth', mode: 'insensitive' },
      },
      include: {
        assignee: { select: { id: true, name: true, avatarUrl: true } },
        labels:   true,
      },
      orderBy: { position: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.task.count({
      where: {
        column:    { boardId: 'board_id' },
        deletedAt: null,
        status:    'IN_PROGRESS',
      },
    }),
  ]);

  // ── Overdue tasks across all boards for a user ────────────────────────────
  // Used by: dashboard "Overdue" stat card
  const overdueTasks = await prisma.task.count({
    where: {
      assigneeId: 'user_id',
      deletedAt:  null,
      dueDate:    { lt: new Date() },
      status:     { notIn: ['DONE', 'CANCELLED'] },
    },
  });

  // ── Dashboard statistics ──────────────────────────────────────────────────
  // One aggregation query using groupBy
  const tasksByStatus = await prisma.task.groupBy({
    by:    ['status'],
    where: { column: { boardId: 'board_id' }, deletedAt: null },
    _count: { _all: true },
  });

  const tasksByPriority = await prisma.task.groupBy({
    by:    ['priority'],
    where: { column: { boardId: 'board_id' }, deletedAt: null },
    _count: { _all: true },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. DRAG-AND-DROP MOVE LOGIC
// ─────────────────────────────────────────────────────────────────────────────

async function moveTask(
  taskId:      string,
  fromColumnId: string,
  toColumnId:   string,
  newPosition:  number,
  userId:       string,
) {
  const task = await prisma.task.findUniqueOrThrow({ where: { id: taskId } });

  await prisma.$transaction(async (tx) => {
    if (fromColumnId !== toColumnId) {
      // 1. Close the gap in the source column
      await tx.task.updateMany({
        where: { columnId: fromColumnId, position: { gt: task.position } },
        data:  { position: { decrement: 1 } },
      });
      // 2. Open space in the destination column
      await tx.task.updateMany({
        where: { columnId: toColumnId, position: { gte: newPosition } },
        data:  { position: { increment: 1 } },
      });
    } else {
      // Same-column reorder
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

    // 3. Place the task at its new position
    await tx.task.update({
      where: { id: taskId },
      data:  { columnId: toColumnId, position: newPosition },
    });

    // 4. Log the activity inside the same transaction
    await tx.activity.create({
      data: {
        type:    ActivityType.TASK_MOVED,
        userId,
        taskId,
        metadata: { fromColumnId, toColumnId, position: newPosition },
      },
    });
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. COMMENT QUERIES
// ─────────────────────────────────────────────────────────────────────────────

async function commentQueries() {
  // ── Add a comment + log activity in one transaction ───────────────────────
  const { comment } = await prisma.$transaction(async (tx) => {
    const comment = await tx.comment.create({
      data:   { content: 'Looks good to me!', taskId: 'task_id', authorId: 'user_id' },
      include: { author: { select: { id: true, name: true, avatarUrl: true } } },
    });

    await tx.activity.create({
      data: {
        type:     ActivityType.COMMENT_ADDED,
        userId:   'user_id',
        taskId:   'task_id',
        metadata: { commentId: comment.id, preview: 'Looks good to me!' },
      },
    });

    // Notify all watchers (excluding the commenter)
    const watchers = await tx.taskWatcher.findMany({
      where: { taskId: 'task_id', userId: { not: 'user_id' } },
    });
    await tx.notification.createMany({
      data: watchers.map(w => ({
        userId:    w.userId,
        title:     'New comment on a task you watch',
        body:      'Looks good to me!',
        actionUrl: `/tasks/task_id`,
      })),
    });

    return { comment };
  });

  // ── Soft-delete a comment ─────────────────────────────────────────────────
  const deleted = await prisma.comment.update({
    where: { id: 'comment_id' },
    data:  { deletedAt: new Date(), content: '' },  // clear content for privacy
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. ATTACHMENT QUERIES
// ─────────────────────────────────────────────────────────────────────────────

async function attachmentQueries() {
  // ── Create attachment record after upload to S3 ───────────────────────────
  const attachment = await prisma.$transaction(async (tx) => {
    const att = await tx.taskAttachment.create({
      data: {
        filename:   'design-spec.pdf',
        storageKey: `uploads/task_id/${crypto.randomUUID()}.pdf`,
        mimeType:   'application/pdf',
        sizeBytes:  204_800,
        type:       'DOCUMENT',
        taskId:     'task_id',
        uploaderId: 'user_id',
      },
    });

    await tx.activity.create({
      data: {
        type:         ActivityType.ATTACHMENT_UPLOADED,
        userId:       'user_id',
        taskId:       'task_id',
        attachmentId: att.id,
        metadata:     { filename: att.filename, sizeBytes: att.sizeBytes },
      },
    });

    return att;
  });

  // ── Get all attachments for a task, grouped by type ───────────────────────
  const attachments = await prisma.taskAttachment.findMany({
    where:   { taskId: 'task_id', deletedAt: null },
    orderBy: { createdAt: 'desc' },
    include: { uploader: { select: { id: true, name: true } } },
  });

  // ── Soft-delete an attachment ─────────────────────────────────────────────
  // NOTE: Also delete from S3 in the service layer
  await prisma.taskAttachment.update({
    where: { id: 'attachment_id' },
    data:  { deletedAt: new Date() },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. ACTIVITY / FEED QUERIES
// ─────────────────────────────────────────────────────────────────────────────

async function activityQueries() {
  // ── Board activity feed (newest first, paginated) ─────────────────────────
  const feed = await prisma.activity.findMany({
    where:   { boardId: 'board_id' },
    include: {
      user:       { select: { id: true, name: true, avatarUrl: true } },
      task:       { select: { id: true, title: true } },
      attachment: { select: { id: true, filename: true } },
    },
    orderBy: { createdAt: 'desc' },
    take:    30,
    skip:    0,
  });

  // ── Task timeline (all events for a specific task) ────────────────────────
  const taskTimeline = await prisma.activity.findMany({
    where:   { taskId: 'task_id' },
    include: { user: { select: { id: true, name: true, avatarUrl: true } } },
    orderBy: { createdAt: 'asc' },
  });

  // ── User's recent activity across all boards ──────────────────────────────
  const userActivity = await prisma.activity.findMany({
    where:   { userId: 'user_id' },
    include: {
      task:  { select: { id: true, title: true } },
      board: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
    take:    20,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. TEAM QUERIES
// ─────────────────────────────────────────────────────────────────────────────

async function teamQueries() {
  // ── Invite user by email ──────────────────────────────────────────────────
  const invite = async (teamId: string, email: string, inviterId: string) => {
    const user = await prisma.user.findUniqueOrThrow({ where: { email } });

    return prisma.teamMember.create({
      data: { teamId, userId: user.id, role: 'MEMBER' },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
  };

  // ── Get all admins and owners of a team ───────────────────────────────────
  const admins = await prisma.teamMember.findMany({
    where: { teamId: 'team_id', role: { in: ['OWNER', 'ADMIN'] } },
    include: { user: { select: { id: true, name: true, email: true } } },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. NOTIFICATION QUERIES
// ─────────────────────────────────────────────────────────────────────────────

async function notificationQueries() {
  // ── Unread count (badge in navbar) ───────────────────────────────────────
  const unreadCount = await prisma.notification.count({
    where: { userId: 'user_id', status: 'UNREAD' },
  });

  // ── Mark all as read ──────────────────────────────────────────────────────
  await prisma.notification.updateMany({
    where: { userId: 'user_id', status: 'UNREAD' },
    data:  { status: 'READ', readAt: new Date() },
  });

  // ── Cleanup: delete notifications older than 90 days ─────────────────────
  const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  await prisma.notification.deleteMany({
    where: { status: { not: 'UNREAD' }, createdAt: { lt: cutoff } },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// 9. SEARCH (PostgreSQL full-text via Prisma preview feature)
// ─────────────────────────────────────────────────────────────────────────────

async function searchTasks(boardId: string, query: string) {
  // Standard contains search (works without FTS extension)
  return prisma.task.findMany({
    where: {
      column:    { boardId },
      deletedAt: null,
      OR: [
        { title:       { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
      ],
    },
    include: {
      assignee: { select: { id: true, name: true, avatarUrl: true } },
      labels:   true,
      column:   { select: { id: true, name: true } },
    },
    take: 20,
  });
}
