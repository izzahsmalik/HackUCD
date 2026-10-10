import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { Brand } from '../brands/brand.entity.js';
import { Product } from '../products/product.entity.js';
import { ProductPrice } from '../products/product-price.entity.js';
import { Transaction } from '../transactions/transaction.entity.js';
import { TransactionCategory } from '../transactions/transaction-category.entity.js';
import { TransactionGroup } from '../transactions/transaction-group.entity.js';
import { LlmModule } from '../llm/llm.module.js';
import { PaymentsModule } from '../payments/payments.module.js';
import { QueryController } from './query.controller.js';
import { QueryExecutor } from './query-executor.js';
import { QueryService } from './query.service.js';

// The MCP module (server/src/mcp/, built in a separate worktree) should import
// QueryModule and use QueryService + the query-tool.ts exports for its tool.
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
    // Provides PremiumGuard for the Pro-gated ask route.
    PaymentsModule,
  ],
  controllers: [QueryController],
  providers: [QueryExecutor, QueryService],
  exports: [QueryService, QueryExecutor],
})
export class QueryModule {}
