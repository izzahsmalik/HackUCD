import { defineEntity, p } from '@mikro-orm/core';
export const BrandSchema = defineEntity({
    name: 'Brand',
    tableName: 'brands',
    properties: {
        id: p.integer().primary(),
        name: p.string(),
    },
});
export class Brand extends BrandSchema.class {
}
BrandSchema.setClass(Brand);
//# sourceMappingURL=brand.entity.js.map