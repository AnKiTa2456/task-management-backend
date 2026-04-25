"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const config_1 = require("@nestjs/config");
const helmet_1 = require("helmet");
const cookieParser = require("cookie-parser");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, {
        logger: ['error', 'warn', 'log'],
    });
    const config = app.get(config_1.ConfigService);
    const port = config.get('port') ?? 3000;
    const isDev = config.get('nodeEnv') !== 'production';
    app.use((0, helmet_1.default)());
    app.use(cookieParser());
    const rawOrigins = config.get('frontendUrl') ?? '';
    const allowedOrigins = new Set([
        ...rawOrigins.split(',').map((s) => s.trim()).filter(Boolean),
        'http://localhost:5173',
        'http://localhost:5174',
    ]);
    app.enableCors({
        origin: (origin, callback) => {
            if (!origin)
                return callback(null, true);
            if (allowedOrigins.has(origin) || origin.endsWith('.vercel.app')) {
                return callback(null, true);
            }
            callback(new Error(`CORS: origin ${origin} not allowed`));
        },
        credentials: true,
        methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    });
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
    }));
    if (isDev) {
        const swaggerConfig = new swagger_1.DocumentBuilder()
            .setTitle('TaskFlow API')
            .setDescription('Production-ready Task Management REST API')
            .setVersion('1.0')
            .addBearerAuth()
            .addTag('Auth', 'Authentication and token management')
            .addTag('Users', 'User profiles and search')
            .addTag('Boards', 'Kanban boards and columns')
            .addTag('Tasks', 'Task CRUD, move, assign')
            .addTag('Comments', 'Task comments')
            .addTag('Activity', 'Activity feed and history')
            .addTag('Teams', 'Team management and roles')
            .build();
        const document = swagger_1.SwaggerModule.createDocument(app, swaggerConfig);
        swagger_1.SwaggerModule.setup('api/docs', app, document, {
            swaggerOptions: { persistAuthorization: true },
        });
    }
    const httpAdapter = app.getHttpAdapter();
    httpAdapter.get('/api/v1/health', (_req, res) => res.json({ status: 'ok' }));
    await app.listen(port);
    console.log(`\n🚀 Server:  http://localhost:${port}/api/v1`);
    if (isDev)
        console.log(`📖 Swagger: http://localhost:${port}/api/docs\n`);
}
bootstrap();
//# sourceMappingURL=main.js.map