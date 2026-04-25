import {
  Injectable, NotFoundException, ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ActivityService } from '../activity/activity.service';
import { CreateBoardDto, UpdateBoardDto, CreateColumnDto } from './dto/board.dto';
import { ActivityType } from '@prisma/client';

@Injectable()
export class BoardsService {
  constructor(
    private prisma:   PrismaService,
    private activity: ActivityService,
  ) {}

  // ── Boards ────────────────────────────────────────────────────────────────

  async findAll(userId: string) {
    return this.prisma.board.findMany({
      where: {
        OR: [
          { ownerId: userId },
          { team: { members: { some: { userId } } } },
        ],
      },
      include: {
        owner:   { select: { id: true, name: true, avatarUrl: true } },
        columns: {
          orderBy: { position: 'asc' },
          include: {
            tasks: {
              orderBy: { position: 'asc' },
              include: {
                assignee: { select: { id: true, name: true, avatarUrl: true } },
                labels:   { select: { id: true, name: true, color: true } },
                _count:   { select: { comments: true } },
              },
            },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findOne(boardId: string, userId: string) {
    const board = await this.prisma.board.findUnique({
      where:   { id: boardId },
      include: {
        owner: { select: { id: true, name: true, avatarUrl: true } },
        columns: {
          orderBy: { position: 'asc' },
          include: {
            tasks: {
              orderBy: { position: 'asc' },
              include: {
                assignee: { select: { id: true, name: true, avatarUrl: true } },
                labels:   { select: { id: true, name: true, color: true } },
                _count:   { select: { comments: true } },
              },
            },
          },
        },
        labels: true,
      },
    });

    if (!board) throw new NotFoundException(`Board ${boardId} not found`);
    await this.assertBoardAccess(board, userId);

    return board;
  }

  async create(ownerId: string, dto: CreateBoardDto) {
    const board = await this.prisma.board.create({
      data: {
        ...dto,
        ownerId,
        columns: {
          create: [
            { name: 'To Do',       position: 0 },
            { name: 'In Progress', position: 1 },
            { name: 'In Review',   position: 2 },
            { name: 'Done',        position: 3 },
          ],
        },
      },
      include: { columns: true },
    });

    await this.activity.log({
      type:    ActivityType.BOARD_CREATED,
      userId:  ownerId,
      boardId: board.id,
      metadata: { boardName: board.name },
    });

    return board;
  }

  async update(boardId: string, userId: string, dto: UpdateBoardDto) {
    const board = await this.assertOwner(boardId, userId);

    return this.prisma.board.update({
      where: { id: boardId },
      data:  dto,
    });
  }

  async remove(boardId: string, userId: string) {
    await this.assertOwner(boardId, userId);
    await this.prisma.board.delete({ where: { id: boardId } });
    return { message: 'Board deleted successfully' };
  }

  // ── Columns ───────────────────────────────────────────────────────────────

  async addColumn(boardId: string, userId: string, dto: CreateColumnDto) {
    await this.assertBoardAccessById(boardId, userId);

    const lastCol = await this.prisma.column.findFirst({
      where:   { boardId },
      orderBy: { position: 'desc' },
    });

    return this.prisma.column.create({
      data: {
        name:     dto.name,
        color:    dto.color,
        position: (lastCol?.position ?? -1) + 1,
        boardId,
      },
    });
  }

  async removeColumn(columnId: string, userId: string) {
    const column = await this.prisma.column.findUnique({
      where:   { id: columnId },
      include: { board: true },
    });

    if (!column) throw new NotFoundException('Column not found');
    await this.assertOwner(column.boardId, userId);

    await this.prisma.column.delete({ where: { id: columnId } });
    return { message: 'Column deleted successfully' };
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private async assertOwner(boardId: string, userId: string) {
    const board = await this.prisma.board.findUnique({ where: { id: boardId } });
    if (!board) throw new NotFoundException(`Board ${boardId} not found`);
    if (board.ownerId !== userId) throw new ForbiddenException('Only the board owner can perform this action');
    return board;
  }

  private async assertBoardAccessById(boardId: string, userId: string) {
    const board = await this.prisma.board.findUnique({
      where:   { id: boardId },
      include: { team: { include: { members: true } } },
    });
    if (!board) throw new NotFoundException(`Board ${boardId} not found`);
    await this.assertBoardAccess(board, userId);
  }

  private async assertBoardAccess(board: any, userId: string) {
    const isOwner  = board.ownerId === userId;
    const isMember = board.team?.members.some((m: any) => m.userId === userId);
    if (!isOwner && !isMember && board.isPrivate) {
      throw new ForbiddenException('You do not have access to this board');
    }
  }
}
