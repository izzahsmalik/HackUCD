import { defineEntity, p } from '@mikro-orm/core';
import { TransactionCategory } from './transaction-category.entity.js';
import { TransactionGroup } from './transaction-group.entity.js';

export const TransactionSchema = defineEntity({
  name: 'Transaction',
  tableName: 'transactions',
  properties: {
    id: p.integer().primary(), // SQLite: INTEGER PK autoincrements
    amount: p.integer(), // cents — never floats; negative = expense, positive = income
    date: p.date(), // transaction date
    category: () => p.manyToOne(TransactionCategory), // required m:1; FK column category_id, FK constraint ON
    group: () => p.manyToOne(TransactionGroup), // required m:1; FK column group_id, FK constraint ON
  },
});

export class Transaction extends TransactionSchema.class {}
TransactionSchema.setClass(Transaction);
