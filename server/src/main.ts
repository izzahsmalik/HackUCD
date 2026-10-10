import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module.js';

// CSV uploads arrive both as multipart (multer handles its own limits) and as
// JSON text via the MCP endpoint; the default 100kb JSON limit would cut real
// CSVs off, so it is raised to match the upload cap.
const BODY_LIMIT = '10mb';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false,
  });
  app.useBodyParser('json', { limit: BODY_LIMIT });
  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
