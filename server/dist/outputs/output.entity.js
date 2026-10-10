import { defineEntity, p } from '@mikro-orm/core';
import { Product } from '../products/product.entity.js';
export const OutputSchema = defineEntity({
    name: 'Output',
    tableName: 'outputs',
    properties: {
        id: p.integer().primary(),
        name: p.string(),
        products: () => p.manyToMany(Product),
    },
});
export class Output extends OutputSchema.class {
}
OutputSchema.setClass(Output);
//# sourceMappingURL=output.entity.js.map