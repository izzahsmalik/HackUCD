import { Product } from './product.entity.js';
export declare const ProductPriceSchema: import("@mikro-orm/core").EntitySchemaWithMeta<"ProductPrice", "product_prices", import("@mikro-orm/core").InferEntityFromProperties<{
    readonly id: Pick<import("@mikro-orm/core").UniversalPropertyOptionsBuilder<number, Omit<import("@mikro-orm/core").EmptyOptions, "primary"> & {
        primary: true;
    }, keyof import("@mikro-orm/core").PropertyOptions<any> | ("~options" | "~type" | "$type" | "strictNullable" | "lazyRef")>, keyof import("@mikro-orm/core").PropertyOptions<any> | ("~options" | "~type" | "$type" | "strictNullable" | "lazyRef")>;
    readonly amount: import("@mikro-orm/core").UniversalPropertyOptionsBuilder<number, import("@mikro-orm/core").EmptyOptions, keyof import("@mikro-orm/core").PropertyOptions<any> | ("~options" | "~type" | "$type" | "strictNullable" | "lazyRef")>;
    readonly setAt: import("@mikro-orm/core").UniversalPropertyOptionsBuilder<Date, import("@mikro-orm/core").EmptyOptions, keyof import("@mikro-orm/core").PropertyOptions<any> | ("~options" | "~type" | "$type" | "strictNullable" | "lazyRef")>;
    readonly product: () => import("@mikro-orm/core").PropertyChain<Product, import("@mikro-orm/core").EmptyOptions & {
        kind: "m:1";
    }>;
}, undefined, never, never, false, undefined, undefined, false>, never, {
    readonly id: Pick<import("@mikro-orm/core").UniversalPropertyOptionsBuilder<number, Omit<import("@mikro-orm/core").EmptyOptions, "primary"> & {
        primary: true;
    }, keyof import("@mikro-orm/core").PropertyOptions<any> | ("~options" | "~type" | "$type" | "strictNullable" | "lazyRef")>, keyof import("@mikro-orm/core").PropertyOptions<any> | ("~options" | "~type" | "$type" | "strictNullable" | "lazyRef")>;
    readonly amount: import("@mikro-orm/core").UniversalPropertyOptionsBuilder<number, import("@mikro-orm/core").EmptyOptions, keyof import("@mikro-orm/core").PropertyOptions<any> | ("~options" | "~type" | "$type" | "strictNullable" | "lazyRef")>;
    readonly setAt: import("@mikro-orm/core").UniversalPropertyOptionsBuilder<Date, import("@mikro-orm/core").EmptyOptions, keyof import("@mikro-orm/core").PropertyOptions<any> | ("~options" | "~type" | "$type" | "strictNullable" | "lazyRef")>;
    readonly product: () => import("@mikro-orm/core").PropertyChain<Product, import("@mikro-orm/core").EmptyOptions & {
        kind: "m:1";
    }>;
}, import("@mikro-orm/core").EntityCtor<import("@mikro-orm/core").InferEntityFromProperties<{
    readonly id: Pick<import("@mikro-orm/core").UniversalPropertyOptionsBuilder<number, Omit<import("@mikro-orm/core").EmptyOptions, "primary"> & {
        primary: true;
    }, keyof import("@mikro-orm/core").PropertyOptions<any> | ("~options" | "~type" | "$type" | "strictNullable" | "lazyRef")>, keyof import("@mikro-orm/core").PropertyOptions<any> | ("~options" | "~type" | "$type" | "strictNullable" | "lazyRef")>;
    readonly amount: import("@mikro-orm/core").UniversalPropertyOptionsBuilder<number, import("@mikro-orm/core").EmptyOptions, keyof import("@mikro-orm/core").PropertyOptions<any> | ("~options" | "~type" | "$type" | "strictNullable" | "lazyRef")>;
    readonly setAt: import("@mikro-orm/core").UniversalPropertyOptionsBuilder<Date, import("@mikro-orm/core").EmptyOptions, keyof import("@mikro-orm/core").PropertyOptions<any> | ("~options" | "~type" | "$type" | "strictNullable" | "lazyRef")>;
    readonly product: () => import("@mikro-orm/core").PropertyChain<Product, import("@mikro-orm/core").EmptyOptions & {
        kind: "m:1";
    }>;
}, undefined, never, never, false, undefined, undefined, false>>, undefined>;
export declare class ProductPrice extends ProductPriceSchema.class {
}
