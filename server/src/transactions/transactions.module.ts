import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Transaction } from './transaction.entity.js';
import { TransactionCategory } from './transaction-category.entity.js';
import { TransactionCategoriesController } from './transaction-categories.controller.js';
import { TransactionCategoriesService } from './transaction-categories.service.js';
import { TransactionsController } from './transactions.controller.js';
import { TransactionsService } from './transactions.service.js';

@Module({
  imports: [MikroOrmModule.forFeature([Transaction, TransactionCategory])],
  controllers: [TransactionsController, TransactionCategoriesController],
  providers: [TransactionsService, TransactionCategoriesService],
})
export class TransactionsModule {}