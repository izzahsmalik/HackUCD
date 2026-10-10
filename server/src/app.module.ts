import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { defineConfig } from '@mikro-orm/sqlite';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { BrandsModule } from './brands/brands.module.js';
import { ProductsModule } from './products/products.module.js';
import { TransactionsModule } from './transactions/transactions.module.js';
import { ActionQueueModule } from './action-queue/action-queue.module.js';
import { IngestModule } from './ingest/ingest.module.js';
import { QueryModule } from './query/query.module.js';

@Module({
  imports: [
    MikroOrmModule.forRoot({
      ...defineConfig({
        dbName: 'data/db.sqlite3',
        entities: [], // forFeature() registrations are auto-loaded
        ensureDatabase: { create: true }, // creates the file and tables from metadata on first connect
      }),
      autoLoadEntities: true, // entities registered via forFeature() are added automatically
    }),
    BrandsModule,
    ProductsModule,
    TransactionsModule,
    ActionQueueModule,
    IngestModule,
    // The MCP module (server/src/mcp/, built separately) should import QueryModule
    // and use QueryService + the query-tool.ts exports for its tool.
    QueryModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
