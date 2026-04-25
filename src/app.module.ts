import { Module }           from '@nestjs/common';
import { ConfigModule }     from '@nestjs/config';
import { APP_GUARD, APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';

import configuration            from './config/configuration';
import { PrismaModule }         from './prisma/prisma.module';
import { AuthModule }           from './modules/auth/auth.module';
import { UsersModule }          from './modules/users/users.module';
import { BoardsModule }         from './modules/boards/boards.module';
import { TasksModule }          from './modules/tasks/tasks.module';
import { CommentsModule }       from './modules/comments/comments.module';
import { ActivityModule }       from './modules/activity/activity.module';
import { TeamsModule }          from './modules/teams/teams.module';
import { ContactModule }        from './modules/contact/contact.module';
import { JwtAuthGuard }         from './common/guards/jwt-auth.guard';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { LoggingInterceptor }   from './common/interceptors/logging.interceptor';

@Module({
  imports: [
    // ── Config ────────────────────────────────────────────────────────────
    ConfigModule.forRoot({
      isGlobal:    true,
      load:        [configuration],
      envFilePath: '.env',
    }),

    // ── Rate limiting ─────────────────────────────────────────────────────
    ThrottlerModule.forRoot([{
      ttl:   60_000,   // 60s window
      limit: 100,      // max 100 requests per window
    }]),

    // ── Core ──────────────────────────────────────────────────────────────
    PrismaModule,

    // ── Feature modules ───────────────────────────────────────────────────
    AuthModule,
    UsersModule,
    BoardsModule,
    TasksModule,
    CommentsModule,
    ActivityModule,
    TeamsModule,
    ContactModule,
  ],
  providers: [
    // Apply JWT guard globally — use @Public() to opt-out per route
    { provide: APP_GUARD, useClass: JwtAuthGuard },

    // Apply rate limiting globally
    { provide: APP_GUARD, useClass: ThrottlerGuard },

    // Format ALL exceptions into the standard error shape
    { provide: APP_FILTER, useClass: GlobalExceptionFilter },

    // Wrap ALL responses in { success: true, data: ... }
    { provide: APP_INTERCEPTOR, useClass: TransformInterceptor },

    // Log all requests
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
  ],
})
export class AppModule {}
