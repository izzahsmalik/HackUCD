import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
const BODY_LIMIT = '10mb';
async function bootstrap() {
    const app = await NestFactory.create(AppModule, {
        bodyParser: false,
        rawBody: true,
    });
    app.useBodyParser('json', { limit: BODY_LIMIT });
    await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
//# sourceMappingURL=main.js.map