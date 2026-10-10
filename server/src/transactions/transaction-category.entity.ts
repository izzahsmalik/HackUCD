import { defineEntity, p } from '@mikro-orm/core';

export const TransactionCategorySchema = defineEntity({
  name: 'TransactionCategory',
  tableName: 'transaction_categories',
  properties: {
    id: p.integer().primary(), // SQLite: INTEGER PK autoincrements
    name: p.string(),
  },
});

export class TransactionCategory extends TransactionCategorySchema.class {}
TransactionCategorySchema.setClass(TransactionCategory);
