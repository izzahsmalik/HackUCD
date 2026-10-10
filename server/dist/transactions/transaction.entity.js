import { defineEntity, p } from '@mikro-orm/core';
import { TransactionCategory } from './transaction-category.entity.js';
import { TransactionGroup } from './transaction-group.entity.js';
export const TransactionSchema = defineEntity({
    name: 'Transaction',
    tableName: 'transactions',
    properties: {
        id: p.integer().primary(),
        amount: p.integer(),
        date: p.date(),
        category: () => p.manyToOne(TransactionCategory),
        group: () => p.manyToOne(TransactionGroup),
    },
});
export class Transaction extends TransactionSchema.class {
}
TransactionSchema.setClass(Transaction);
//# sourceMappingURL=transaction.entity.js.map