import { defineEntity, p } from '@mikro-orm/core';
import { Output } from './output.entity.js';
export const OutputPriceSchema = defineEntity({
    name: 'OutputPrice',
    tableName: 'output_prices',
    properties: {
        id: p.integer().primary(),
        amount: p.integer(),
        setAt: p.datetime(),
        output: () => p.manyToOne(Output),
    },
});
export class OutputPrice extends OutputPriceSchema.class {
}
OutputPriceSchema.setClass(OutputPrice);
//# sourceMappingURL=output-price.entity.js.map