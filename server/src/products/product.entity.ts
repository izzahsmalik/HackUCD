import { defineEntity, p } from '@mikro-orm/core';
import { Brand } from '../brands/brand.entity.js';

export const ProductSchema = defineEntity({
  name: 'Product',
  tableName: 'products',
  properties: {
    id: p.integer().primary(), // SQLite: INTEGER PK autoincrements
    name: p.string(),
    brand: () => p.manyToOne(Brand), // required m:1; FK column brand_id, FK constraint ON
  },
});

export class Product extends ProductSchema.class {}
ProductSchema.setClass(Product);
