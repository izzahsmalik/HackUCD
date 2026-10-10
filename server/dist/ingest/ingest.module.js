var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Brand } from '../brands/brand.entity.js';
import { LlmModule } from '../llm/llm.module.js';
import { ActionQueueModule } from '../action-queue/action-queue.module.js';
import { Product } from '../products/product.entity.js';
import { ProductPrice } from '../products/product-price.entity.js';
import { Transaction } from '../transactions/transaction.entity.js';
import { TransactionCategory } from '../transactions/transaction-category.entity.js';
import { TransactionGroup } from '../transactions/transaction-group.entity.js';
import { FileClassifier } from './file-classifier.js';
import { IngestController } from './ingest.controller.js';
import { IngestService } from './ingest.service.js';
import { ProductsIngestService } from './products-ingest.service.js';
import { TransactionsIngestService } from './transactions-ingest.service.js';
let IngestModule = class IngestModule {
};
IngestModule = __decorate([
    Module({
        imports: [
            MikroOrmModule.forFeature([
                Transaction,
                TransactionCategory,
                TransactionGroup,
                Product,
                ProductPrice,
                Brand,
            ]),
            LlmModule,
            ActionQueueModule,
        ],
        controllers: [IngestController],
        providers: [
            FileClassifier,
            IngestService,
            TransactionsIngestService,
            ProductsIngestService,
        ],
    })
], IngestModule);
export { IngestModule };
//# sourceMappingURL=ingest.module.js.map