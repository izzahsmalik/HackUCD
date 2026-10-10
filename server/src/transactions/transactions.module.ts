import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Transaction } from './transaction.entity.js';
import { TransactionCategory } from './transaction-category.entity.js';
import { TransactionGroup } from './transaction-group.entity.js';
import { TransactionCategoriesController } from './transaction-categories.controller.js';
import { TransactionCategoriesService } from './transaction-categories.service.js';
import { TransactionGroupsController } from './transaction-groups.controller.js';
import { TransactionGroupsService } from './transaction-groups.service.js';
import { TransactionsController } from './transactions.controller.js';
import { TransactionsService } from './transactions.service.js';

@Module({
  imports: [
    MikroOrmModule.forFeature([
      Transaction,
      TransactionCategory,
      TransactionGroup,
    ]),
  ],
  controllers: [
    TransactionsController,
    TransactionCategoriesController,
    TransactionGroupsController,
  ],
  providers: [
    TransactionsService,
    TransactionCategoriesService,
    TransactionGroupsService,
  ],
})
export class TransactionsModule {}
