var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { defineConfig } from '@mikro-orm/sqlite';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { BrandsModule } from './brands/brands.module.js';
import { ProductsModule } from './products/products.module.js';
import { OutputsModule } from './outputs/outputs.module.js';
import { TransactionsModule } from './transactions/transactions.module.js';
import { ActionQueueModule } from './action-queue/action-queue.module.js';
import { IngestModule } from './ingest/ingest.module.js';
import { QueryModule } from './query/query.module.js';
import { McpModule } from './mcp/mcp.module.js';
import { PaymentsModule } from './payments/payments.module.js';
let AppModule = class AppModule {
};
AppModule = __decorate([
    Module({
        imports: [
            MikroOrmModule.forRoot({
                ...defineConfig({
                    dbName: 'data/db.sqlite3',
                    entities: [],
                    ensureDatabase: { create: true },
                }),
                autoLoadEntities: true,
            }),
            BrandsModule,
            ProductsModule,
            OutputsModule,
            TransactionsModule,
            ActionQueueModule,
            IngestModule,
            QueryModule,
            McpModule,
            PaymentsModule,
        ],
        controllers: [AppController],
        providers: [AppService],
    })
], AppModule);
export { AppModule };
//# sourceMappingURL=app.module.js.map