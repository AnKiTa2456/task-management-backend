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
exports.CommentsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const activity_service_1 = require("../activity/activity.service");
const client_1 = require("@prisma/client");
const COMMENT_SELECT = {
    id: true, content: true, createdAt: true, updatedAt: true,
    author: { select: { id: true, name: true, avatarUrl: true } },
};
let CommentsService = class CommentsService {
    constructor(prisma, activity) {
        this.prisma = prisma;
        this.activity = activity;
    }
    async findAll(taskId) {
        await this.assertTaskExists(taskId);
        return this.prisma.comment.findMany({
            where: { taskId },
            select: COMMENT_SELECT,
            orderBy: { createdAt: 'asc' },
        });
    }
    async create(taskId, authorId, dto) {
        const task = await this.assertTaskExists(taskId);
        const comment = await this.prisma.comment.create({
            data: { content: dto.content, taskId, authorId },
            select: COMMENT_SELECT,
        });
        await this.activity.log({
            type: client_1.ActivityType.COMMENT_ADDED,
            userId: authorId,
            taskId,
            metadata: { commentId: comment.id, preview: dto.content.slice(0, 60) },
        });
        return comment;
    }
    async update(commentId, userId, dto) {
        const comment = await this.assertCommentExists(commentId);
        this.assertOwnership(comment.authorId, userId);
        const updated = await this.prisma.comment.update({
            where: { id: commentId },
            data: { content: dto.content },
            select: COMMENT_SELECT,
        });
        await this.activity.log({
            type: client_1.ActivityType.COMMENT_EDITED,
            userId,
            taskId: comment.taskId,
            metadata: { commentId, preview: dto.content.slice(0, 60) },
        });
        return updated;
    }
    async remove(commentId, userId) {
        const comment = await this.assertCommentExists(commentId);
        this.assertOwnership(comment.authorId, userId);
        await this.prisma.comment.delete({ where: { id: commentId } });
        await this.activity.log({
            type: client_1.ActivityType.COMMENT_DELETED,
            userId,
            taskId: comment.taskId,
            metadata: { commentId },
        });
        return { message: 'Comment deleted' };
    }
    async assertTaskExists(taskId) {
        const task = await this.prisma.task.findUnique({ where: { id: taskId } });
        if (!task)
            throw new common_1.NotFoundException(`Task ${taskId} not found`);
        return task;
    }
    async assertCommentExists(commentId) {
        const comment = await this.prisma.comment.findUnique({ where: { id: commentId } });
        if (!comment)
            throw new common_1.NotFoundException(`Comment ${commentId} not found`);
        return comment;
    }
    assertOwnership(ownerId, userId) {
        if (ownerId !== userId) {
            throw new common_1.ForbiddenException('You can only modify your own comments');
        }
    }
};
exports.CommentsService = CommentsService;
exports.CommentsService = CommentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        activity_service_1.ActivityService])
], CommentsService);
//# sourceMappingURL=comments.service.js.map