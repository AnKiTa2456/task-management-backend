import {
  ExceptionFilter, Catch, ArgumentsHost,
  HttpException, HttpStatus, Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

/**
 * Catches ALL exceptions and formats them into the standard API error shape:
 * { success: false, error: { code, message, statusCode } }
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx      = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request  = ctx.getRequest<Request>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message    = 'Internal server error';
    let code       = 'INTERNAL_ERROR';

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const res  = exception.getResponse();
      message    = typeof res === 'string'
        ? res
        : (res as any).message ?? exception.message;
      code       = (res as any).error ?? exception.name;
    }

    // Log 5xx errors with full stack
    if (statusCode >= 500) {
      this.logger.error(
        `[${request.method}] ${request.url} → ${statusCode}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    response.status(statusCode).json({
      success: false,
      error: {
        code,
        message: Array.isArray(message) ? message : [message],
        statusCode,
        path:      request.url,
        timestamp: new Date().toISOString(),
      },
    });
  }
}
