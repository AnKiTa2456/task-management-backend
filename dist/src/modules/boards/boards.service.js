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
exports.BoardsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const activity_service_1 = require("../activity/activity.service");
const client_1 = require("@prisma/client");
let BoardsService = class BoardsService {
    constructor(prisma, activity) {
        this.prisma = prisma;
        this.activity = activity;
    }
    async findAll(userId) {
        return this.prisma.board.findMany({
            where: {
                OR: [
                    { ownerId: userId },
                    { team: { members: { some: { userId } } } },
                ],
            },
            include: {
                owner: { select: { id: true, name: true, avatarUrl: true } },
                columns: {
                    orderBy: { position: 'asc' },
                    include: {
                        tasks: {
                            orderBy: { position: 'asc' },
                            include: {
                                assignee: { select: { id: true, name: true, avatarUrl: true } },
                                labels: { select: { id: true, name: true, color: true } },
                                _count: { select: { comments: true } },
                            },
                        },
                    },
                },
            },
            orderBy: { updatedAt: 'desc' },
        });
    }
    async findOne(boardId, userId) {
        const board = await this.prisma.board.findUnique({
            where: { id: boardId },
            include: {
                owner: { select: { id: true, name: true, avatarUrl: true } },
                columns: {
                    orderBy: { position: 'asc' },
                    include: {
                        tasks: {
                            orderBy: { position: 'asc' },
                            include: {
                                assignee: { select: { id: true, name: true, avatarUrl: true } },
                                labels: { select: { id: true, name: true, color: true } },
                                _count: { select: { comments: true } },
                            },
                        },
                    },
                },
                labels: true,
            },
        });
        if (!board)
            throw new common_1.NotFoundException(`Board ${boardId} not found`);
        await this.assertBoardAccess(board, userId);
        return board;
    }
    async create(ownerId, dto) {
        const board = await this.prisma.board.create({
            data: {
                ...dto,
                ownerId,
                columns: {
                    create: [
                        { name: 'To Do', position: 0 },
                        { name: 'In Progress', position: 1 },
                        { name: 'In Review', position: 2 },
                        { name: 'Done', position: 3 },
                    ],
                },
            },
            include: { columns: true },
        });
        await this.activity.log({
            type: client_1.ActivityType.BOARD_CREATED,
            userId: ownerId,
            boardId: board.id,
            metadata: { boardName: board.name },
        });
        return board;
    }
    async update(boardId, userId, dto) {
        const board = await this.assertOwner(boardId, userId);
        return this.prisma.board.update({
            where: { id: boardId },
            data: dto,
        });
    }
    async remove(boardId, userId) {
        await this.assertOwner(boardId, userId);
        await this.prisma.board.delete({ where: { id: boardId } });
        return { message: 'Board deleted successfully' };
    }
    async addColumn(boardId, userId, dto) {
        await this.assertBoardAccessById(boardId, userId);
        const lastCol = await this.prisma.column.findFirst({
            where: { boardId },
            orderBy: { position: 'desc' },
        });
        return this.prisma.column.create({
            data: {
                name: dto.name,
                color: dto.color,
                position: (lastCol?.position ?? -1) + 1,
                boardId,
            },
        });
    }
    async removeColumn(columnId, userId) {
        const column = await this.prisma.column.findUnique({
            where: { id: columnId },
            include: { board: true },
        });
        if (!column)
            throw new common_1.NotFoundException('Column not found');
        await this.assertOwner(column.boardId, userId);
        await this.prisma.column.delete({ where: { id: columnId } });
        return { message: 'Column deleted successfully' };
    }
    async assertOwner(boardId, userId) {
        const board = await this.prisma.board.findUnique({ where: { id: boardId } });
        if (!board)
            throw new common_1.NotFoundException(`Board ${boardId} not found`);
        if (board.ownerId !== userId)
            throw new common_1.ForbiddenException('Only the board owner can perform this action');
        return board;
    }
    async assertBoardAccessById(boardId, userId) {
        const board = await this.prisma.board.findUnique({
            where: { id: boardId },
            include: { team: { include: { members: true } } },
        });
        if (!board)
            throw new common_1.NotFoundException(`Board ${boardId} not found`);
        await this.assertBoardAccess(board, userId);
    }
    async assertBoardAccess(board, userId) {
        const isOwner = board.ownerId === userId;
        const isMember = board.team?.members.some((m) => m.userId === userId);
        if (!isOwner && !isMember && board.isPrivate) {
            throw new common_1.ForbiddenException('You do not have access to this board');
        }
    }
};
exports.BoardsService = BoardsService;
exports.BoardsService = BoardsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        activity_service_1.ActivityService])
], BoardsService);
//# sourceMappingURL=boards.service.js.map