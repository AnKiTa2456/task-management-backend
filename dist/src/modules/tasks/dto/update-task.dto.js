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
exports.AssignTaskDto = exports.MoveTaskDto = exports.UpdateTaskDto = void 0;
const openapi = require("@nestjs/swagger");
const swagger_1 = require("@nestjs/swagger");
const swagger_2 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const client_1 = require("@prisma/client");
const create_task_dto_1 = require("./create-task.dto");
class UpdateTaskDto extends (0, swagger_1.PartialType)(create_task_dto_1.CreateTaskDto) {
    static _OPENAPI_METADATA_FACTORY() {
        return { status: { required: false, type: () => Object } };
    }
}
exports.UpdateTaskDto = UpdateTaskDto;
__decorate([
    (0, swagger_2.ApiPropertyOptional)({ enum: client_1.TaskStatus }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.TaskStatus),
    __metadata("design:type", String)
], UpdateTaskDto.prototype, "status", void 0);
class MoveTaskDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { columnId: { required: true, type: () => String }, position: { required: true, type: () => Number } };
    }
}
exports.MoveTaskDto = MoveTaskDto;
__decorate([
    (0, swagger_2.ApiPropertyOptional)({ example: 'col_456' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MoveTaskDto.prototype, "columnId", void 0);
__decorate([
    (0, swagger_2.ApiPropertyOptional)({ example: 2 }),
    __metadata("design:type", Number)
], MoveTaskDto.prototype, "position", void 0);
class AssignTaskDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { assigneeId: { required: true, type: () => String, nullable: true } };
    }
}
exports.AssignTaskDto = AssignTaskDto;
__decorate([
    (0, swagger_2.ApiPropertyOptional)({ example: 'user_abc123', nullable: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", Object)
], AssignTaskDto.prototype, "assigneeId", void 0);
//# sourceMappingURL=update-task.dto.js.map