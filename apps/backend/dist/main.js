"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const core_1 = require("@nestjs/core");
const swagger_1 = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    // Global validation pipe
    app.useGlobalPipes(new common_1.ValidationPipe({ transform: true }));
    // CORS
    app.enableCors({
        origin: process.env.CORS_ORIGIN || ['http://localhost:3001', 'http://localhost:8081'],
        credentials: true,
    });
    // Swagger API documentation
    const config = new swagger_1.DocumentBuilder()
        .setTitle('ZIII Living API')
        .setDescription('SaaS platform for condominium and community administration')
        .setVersion('0.1.0')
        .addBearerAuth()
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('docs', app, document);
    const port = process.env.API_PORT || 3000;
    await app.listen(port);
    console.log(`✓ ZIII Living API running on http://localhost:${port}`);
    console.log(`✓ Swagger API docs: http://localhost:${port}/docs`);
}
bootstrap().catch((error) => {
    console.error('Failed to start application:', error);
    process.exit(1);
});
//# sourceMappingURL=main.js.map