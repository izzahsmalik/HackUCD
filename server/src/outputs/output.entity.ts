import { defineEntity, p } from '@mikro-orm/core';
import { Product } from '../products/product.entity.js';

export const OutputSchema = defineEntity({
  name: 'Output',
  tableName: 'outputs',
  properties: {
    id: p.integer().primary(), // SQLite: INTEGER PK autoincrements
    name: p.string(),
    products: () => p.manyToMany(Product), // owner side; Products this Output is made from
  },
});

export class Output extends OutputSchema.class {}
OutputSchema.setClass(Output);
