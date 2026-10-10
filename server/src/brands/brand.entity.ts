import { defineEntity, p } from '@mikro-orm/core';

export const BrandSchema = defineEntity({
  name: 'Brand',
  tableName: 'brands',
  properties: {
    id: p.integer().primary(), // SQLite: INTEGER PK autoincrements
    name: p.string(),
  },
});

export class Brand extends BrandSchema.class {}
BrandSchema.setClass(Brand);
