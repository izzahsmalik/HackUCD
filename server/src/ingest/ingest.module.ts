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

@Module({
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
export class IngestModule {}
