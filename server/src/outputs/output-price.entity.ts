import { defineEntity, p } from '@mikro-orm/core';
import { Output } from './output.entity.js';

export const OutputPriceSchema = defineEntity({
  name: 'OutputPrice',
  tableName: 'output_prices',
  properties: {
    id: p.integer().primary(), // SQLite: INTEGER PK autoincrements
    amount: p.integer(), // cents — never floats
    setAt: p.datetime(), // when the output was set at this price (defaults to insertion time)
    output: () => p.manyToOne(Output), // required m:1; FK column output_id, FK constraint ON
  },
});

export class OutputPrice extends OutputPriceSchema.class {}
OutputPriceSchema.setClass(OutputPrice);
