import { defineEntity, p } from '@mikro-orm/core';
import { Brand } from '../brands/brand.entity.js';
export const ProductSchema = defineEntity({
    name: 'Product',
    tableName: 'products',
    properties: {
        id: p.integer().primary(),
        name: p.string(),
        brand: () => p.manyToOne(Brand),
    },
});
export class Product extends ProductSchema.class {
}
ProductSchema.setClass(Product);
//# sourceMappingURL=product.entity.js.map