import { NestFactory }          from '@nestjs/core';
import { ValidationPipe }        from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService }         from '@nestjs/config';
import helmet                    from 'helmet';
import * as cookieParser         from 'cookie-parser';
import { AppModule }             from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  const config = app.get(ConfigService);
  const port   = config.get<number>('port') ?? 3000;
  const isDev  = config.get<string>('nodeEnv') !== 'production';

  // ── Security headers ─────────────────────────────────────────────────────
  app.use(helmet());

  // ── Cookie parser (REQUIRED for httpOnly refresh token) ──────────────────
  app.use(cookieParser());

  // ── CORS ──────────────────────────────────────────────────────────────────
  const rawOrigins = config.get<string>('frontendUrl') ?? '';
  const allowedOrigins = new Set([
    ...rawOrigins.split(',').map((s) => s.trim()).filter(Boolean),
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
  ]);

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, Postman)
      if (!origin) return callback(null, true);
      // Allow exact matches and any *.vercel.app preview deployment
      if (allowedOrigins.has(origin) || origin.endsWith('.vercel.app')) {
        return callback(null, true);
      }
      callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
    methods:     ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  // ── Global prefix ─────────────────────────────────────────────────────────
  app.setGlobalPrefix('api/v1');

  // ── Validation pipe ───────────────────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist:            true,   // strip unknown properties
      forbidNonWhitelisted: true,
      transform:            true,   // auto-cast query params
      transformOptions:     { enableImplicitConversion: true },
    }),
  );

  // ── Swagger (dev only) ────────────────────────────────────────────────────
  if (isDev) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('TaskFlow API')
      .setDescription('Production-ready Task Management REST API')
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('Auth',     'Authentication and token management')
      .addTag('Users',    'User profiles and search')
      .addTag('Boards',   'Kanban boards and columns')
      .addTag('Tasks',    'Task CRUD, move, assign')
      .addTag('Comments', 'Task comments')
      .addTag('Activity', 'Activity feed and history')
      .addTag('Teams',    'Team management and roles')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: { persistAuthorization: true },
    });
  }

  // Health check – used by frontend to wake Render from cold start
  const httpAdapter = app.getHttpAdapter();
  httpAdapter.get('/api/v1/health', (_req: unknown, res: { json: (o: object) => void }) =>
    res.json({ status: 'ok' }),
  );

  await app.listen(port);
  console.log(`\n🚀 Server:  http://localhost:${port}/api/v1`);
  if (isDev) console.log(`📖 Swagger: http://localhost:${port}/api/docs\n`);
}

bootstrap();
