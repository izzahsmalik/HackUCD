import { defineEntity, p } from '@mikro-orm/core';
export const TransactionGroupSchema = defineEntity({
    name: 'TransactionGroup',
    tableName: 'transaction_groups',
    properties: {
        id: p.integer().primary(),
        originalFileName: p.string(),
        groupName: p.string(),
    },
});
export class TransactionGroup extends TransactionGroupSchema.class {
}
TransactionGroupSchema.setClass(TransactionGroup);
//# sourceMappingURL=transaction-group.entity.js.map