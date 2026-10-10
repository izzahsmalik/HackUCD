import { Product } from '../products/product.entity.js';
export declare const OutputSchema: import("@mikro-orm/core").EntitySchemaWithMeta<"Output", "outputs", import("@mikro-orm/core").InferEntityFromProperties<{
    readonly id: Pick<import("@mikro-orm/core").UniversalPropertyOptionsBuilder<number, Omit<import("@mikro-orm/core").EmptyOptions, "primary"> & {
        primary: true;
    }, keyof import("@mikro-orm/core").PropertyOptions<any> | ("~options" | "~type" | "$type" | "strictNullable" | "lazyRef")>, keyof import("@mikro-orm/core").PropertyOptions<any> | ("~options" | "~type" | "$type" | "strictNullable" | "lazyRef")>;
    readonly name: import("@mikro-orm/core").StringPropertyOptionsBuilder<string, import("@mikro-orm/core").EmptyOptions>;
    readonly products: () => import("@mikro-orm/core").PropertyChain<Product, import("@mikro-orm/core").EmptyOptions & {
        kind: "m:n";
    }>;
}, undefined, never, never, false, undefined, undefined, false>, never, {
    readonly id: Pick<import("@mikro-orm/core").UniversalPropertyOptionsBuilder<number, Omit<import("@mikro-orm/core").EmptyOptions, "primary"> & {
        primary: true;
    }, keyof import("@mikro-orm/core").PropertyOptions<any> | ("~options" | "~type" | "$type" | "strictNullable" | "lazyRef")>, keyof import("@mikro-orm/core").PropertyOptions<any> | ("~options" | "~type" | "$type" | "strictNullable" | "lazyRef")>;
    readonly name: import("@mikro-orm/core").StringPropertyOptionsBuilder<string, import("@mikro-orm/core").EmptyOptions>;
    readonly products: () => import("@mikro-orm/core").PropertyChain<Product, import("@mikro-orm/core").EmptyOptions & {
        kind: "m:n";
    }>;
}, import("@mikro-orm/core").EntityCtor<import("@mikro-orm/core").InferEntityFromProperties<{
    readonly id: Pick<import("@mikro-orm/core").UniversalPropertyOptionsBuilder<number, Omit<import("@mikro-orm/core").EmptyOptions, "primary"> & {
        primary: true;
    }, keyof import("@mikro-orm/core").PropertyOptions<any> | ("~options" | "~type" | "$type" | "strictNullable" | "lazyRef")>, keyof import("@mikro-orm/core").PropertyOptions<any> | ("~options" | "~type" | "$type" | "strictNullable" | "lazyRef")>;
    readonly name: import("@mikro-orm/core").StringPropertyOptionsBuilder<string, import("@mikro-orm/core").EmptyOptions>;
    readonly products: () => import("@mikro-orm/core").PropertyChain<Product, import("@mikro-orm/core").EmptyOptions & {
        kind: "m:n";
    }>;
}, undefined, never, never, false, undefined, undefined, false>>, undefined>;
export declare class Output extends OutputSchema.class {
}
