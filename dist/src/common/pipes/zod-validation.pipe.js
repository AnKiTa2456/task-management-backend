"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ZodValidationPipe = void 0;
const common_1 = require("@nestjs/common");
class ZodValidationPipe {
    constructor(schema) {
        this.schema = schema;
    }
    transform(value, _metadata) {
        const result = this.schema.safeParse(value);
        if (!result.success) {
            const err = result.error;
            throw new common_1.BadRequestException(err.issues.map((i) => `${i.path.join('.')}: ${i.message}`));
        }
        return result.data;
    }
}
exports.ZodValidationPipe = ZodValidationPipe;
//# sourceMappingURL=zod-validation.pipe.js.map