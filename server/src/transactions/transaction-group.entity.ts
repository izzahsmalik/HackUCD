import { defineEntity, p } from '@mikro-orm/core';

export const TransactionGroupSchema = defineEntity({
  name: 'TransactionGroup',
  tableName: 'transaction_groups',
  properties: {
    id: p.integer().primary(), // SQLite: INTEGER PK autoincrements
    originalFileName: p.string(), // name of the CSV file the group was imported from
    groupName: p.string(), // LLM-derived label for the group
  },
});

export class TransactionGroup extends TransactionGroupSchema.class {}
TransactionGroupSchema.setClass(TransactionGroup);
