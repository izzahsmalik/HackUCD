import { defineEntity, p } from '@mikro-orm/core';
import { Product } from './product.entity.js';
export const ProductPriceSchema = defineEntity({
    name: 'ProductPrice',
    tableName: 'product_prices',
    properties: {
        id: p.integer().primary(),
        amount: p.integer(),
        setAt: p.datetime(),
        product: () => p.manyToOne(Product),
    },
});
export class ProductPrice extends ProductPriceSchema.class {
}
ProductPriceSchema.setClass(ProductPrice);
//# sourceMappingURL=product-price.entity.js.map