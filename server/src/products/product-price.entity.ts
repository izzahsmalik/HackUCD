import { defineEntity, p } from '@mikro-orm/core';
import { Product } from './product.entity.js';

export const ProductPriceSchema = defineEntity({
  name: 'ProductPrice',
  tableName: 'product_prices',
  properties: {
    id: p.integer().primary(), // SQLite: INTEGER PK autoincrements
    amount: p.integer(), // cents — never floats
    setAt: p.datetime(), // when the product was set at this price (or insertion time if the CSV omitted it)
    product: () => p.manyToOne(Product), // required m:1; FK column product_id, FK constraint ON
  },
});

export class ProductPrice extends ProductPriceSchema.class {}
ProductPriceSchema.setClass(ProductPrice);
