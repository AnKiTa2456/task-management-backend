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
exports.ActivityService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let ActivityService = class ActivityService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async log(params) {
        return this.prisma.activity.create({
            data: {
                type: params.type,
                userId: params.userId,
                taskId: params.taskId,
                boardId: params.boardId,
                metadata: (params.metadata ?? {}),
            },
        });
    }
    async getBoardActivity(boardId, page = 1, limit = 30) {
        const skip = (page - 1) * limit;
        const [activities, total] = await Promise.all([
            this.prisma.activity.findMany({
                where: { boardId },
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
    async getTaskActivity(taskId) {
        return this.prisma.activity.findMany({
            where: { taskId },
            include: { user: { select: { id: true, name: true, avatarUrl: true } } },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });
    }
};
exports.ActivityService = ActivityService;
exports.ActivityService = ActivityService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ActivityService);
//# sourceMappingURL=activity.service.js.map