import { PipeTransform, ArgumentMetadata, BadRequestException } from '@nestjs/common';
import { ZodSchema, ZodError } from 'zod';

export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: ZodSchema) {}

  transform(value: unknown, _metadata: ArgumentMetadata) {
    const result = this.schema.safeParse(value);

    if (!result.success) {
      const err = result.error as ZodError;
      throw new BadRequestException(
        err.issues.map((i) => `${i.path.join('.')}: ${i.message}`),
      );
    }

    return result.data;
  }
}
