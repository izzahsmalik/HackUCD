import { Brand } from '../brands/brand.entity.js';
export declare const ProductSchema: import("@mikro-orm/core").EntitySchemaWithMeta<"Product", "products", import("@mikro-orm/core").InferEntityFromProperties<{
    readonly id: Pick<import("@mikro-orm/core").UniversalPropertyOptionsBuilder<number, Omit<import("@mikro-orm/core").EmptyOptions, "primary"> & {
        primary: true;
    }, keyof import("@mikro-orm/core").PropertyOptions<any> | ("~options" | "~type" | "$type" | "strictNullable" | "lazyRef")>, keyof import("@mikro-orm/core").PropertyOptions<any> | ("~options" | "~type" | "$type" | "strictNullable" | "lazyRef")>;
    readonly name: import("@mikro-orm/core").StringPropertyOptionsBuilder<string, import("@mikro-orm/core").EmptyOptions>;
    readonly price: import("@mikro-orm/core").UniversalPropertyOptionsBuilder<number, import("@mikro-orm/core").EmptyOptions, keyof import("@mikro-orm/core").PropertyOptions<any> | ("~options" | "~type" | "$type" | "strictNullable" | "lazyRef")>;
    readonly brand: () => import("@mikro-orm/core").PropertyChain<Brand, import("@mikro-orm/core").EmptyOptions & {
        kind: "m:1";
    }>;
}, undefined, never, never, false, undefined, undefined, false>, never, {
    readonly id: Pick<import("@mikro-orm/core").UniversalPropertyOptionsBuilder<number, Omit<import("@mikro-orm/core").EmptyOptions, "primary"> & {
        primary: true;
    }, keyof import("@mikro-orm/core").PropertyOptions<any> | ("~options" | "~type" | "$type" | "strictNullable" | "lazyRef")>, keyof import("@mikro-orm/core").PropertyOptions<any> | ("~options" | "~type" | "$type" | "strictNullable" | "lazyRef")>;
    readonly name: import("@mikro-orm/core").StringPropertyOptionsBuilder<string, import("@mikro-orm/core").EmptyOptions>;
    readonly price: import("@mikro-orm/core").UniversalPropertyOptionsBuilder<number, import("@mikro-orm/core").EmptyOptions, keyof import("@mikro-orm/core").PropertyOptions<any> | ("~options" | "~type" | "$type" | "strictNullable" | "lazyRef")>;
    readonly brand: () => import("@mikro-orm/core").PropertyChain<Brand, import("@mikro-orm/core").EmptyOptions & {
        kind: "m:1";
    }>;
}, import("@mikro-orm/core").EntityCtor<import("@mikro-orm/core").InferEntityFromProperties<{
    readonly id: Pick<import("@mikro-orm/core").UniversalPropertyOptionsBuilder<number, Omit<import("@mikro-orm/core").EmptyOptions, "primary"> & {
        primary: true;
    }, keyof import("@mikro-orm/core").PropertyOptions<any> | ("~options" | "~type" | "$type" | "strictNullable" | "lazyRef")>, keyof import("@mikro-orm/core").PropertyOptions<any> | ("~options" | "~type" | "$type" | "strictNullable" | "lazyRef")>;
    readonly name: import("@mikro-orm/core").StringPropertyOptionsBuilder<string, import("@mikro-orm/core").EmptyOptions>;
    readonly price: import("@mikro-orm/core").UniversalPropertyOptionsBuilder<number, import("@mikro-orm/core").EmptyOptions, keyof import("@mikro-orm/core").PropertyOptions<any> | ("~options" | "~type" | "$type" | "strictNullable" | "lazyRef")>;
    readonly brand: () => import("@mikro-orm/core").PropertyChain<Brand, import("@mikro-orm/core").EmptyOptions & {
        kind: "m:1";
    }>;
}, undefined, never, never, false, undefined, undefined, false>>, undefined>;
export declare class Product extends ProductSchema.class {
}
