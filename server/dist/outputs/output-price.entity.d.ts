import { Output } from './output.entity.js';
export declare const OutputPriceSchema: import("@mikro-orm/core").EntitySchemaWithMeta<"OutputPrice", "output_prices", import("@mikro-orm/core").InferEntityFromProperties<{
    readonly id: Pick<import("@mikro-orm/core").UniversalPropertyOptionsBuilder<number, Omit<import("@mikro-orm/core").EmptyOptions, "primary"> & {
        primary: true;
    }, keyof import("@mikro-orm/core").PropertyOptions<any> | ("~options" | "~type" | "$type" | "strictNullable" | "lazyRef")>, keyof import("@mikro-orm/core").PropertyOptions<any> | ("~options" | "~type" | "$type" | "strictNullable" | "lazyRef")>;
    readonly amount: import("@mikro-orm/core").UniversalPropertyOptionsBuilder<number, import("@mikro-orm/core").EmptyOptions, keyof import("@mikro-orm/core").PropertyOptions<any> | ("~options" | "~type" | "$type" | "strictNullable" | "lazyRef")>;
    readonly setAt: import("@mikro-orm/core").UniversalPropertyOptionsBuilder<Date, import("@mikro-orm/core").EmptyOptions, keyof import("@mikro-orm/core").PropertyOptions<any> | ("~options" | "~type" | "$type" | "strictNullable" | "lazyRef")>;
    readonly output: () => import("@mikro-orm/core").PropertyChain<Output, import("@mikro-orm/core").EmptyOptions & {
        kind: "m:1";
    }>;
}, undefined, never, never, false, undefined, undefined, false>, never, {
    readonly id: Pick<import("@mikro-orm/core").UniversalPropertyOptionsBuilder<number, Omit<import("@mikro-orm/core").EmptyOptions, "primary"> & {
        primary: true;
    }, keyof import("@mikro-orm/core").PropertyOptions<any> | ("~options" | "~type" | "$type" | "strictNullable" | "lazyRef")>, keyof import("@mikro-orm/core").PropertyOptions<any> | ("~options" | "~type" | "$type" | "strictNullable" | "lazyRef")>;
    readonly amount: import("@mikro-orm/core").UniversalPropertyOptionsBuilder<number, import("@mikro-orm/core").EmptyOptions, keyof import("@mikro-orm/core").PropertyOptions<any> | ("~options" | "~type" | "$type" | "strictNullable" | "lazyRef")>;
    readonly setAt: import("@mikro-orm/core").UniversalPropertyOptionsBuilder<Date, import("@mikro-orm/core").EmptyOptions, keyof import("@mikro-orm/core").PropertyOptions<any> | ("~options" | "~type" | "$type" | "strictNullable" | "lazyRef")>;
    readonly output: () => import("@mikro-orm/core").PropertyChain<Output, import("@mikro-orm/core").EmptyOptions & {
        kind: "m:1";
    }>;
}, import("@mikro-orm/core").EntityCtor<import("@mikro-orm/core").InferEntityFromProperties<{
    readonly id: Pick<import("@mikro-orm/core").UniversalPropertyOptionsBuilder<number, Omit<import("@mikro-orm/core").EmptyOptions, "primary"> & {
        primary: true;
    }, keyof import("@mikro-orm/core").PropertyOptions<any> | ("~options" | "~type" | "$type" | "strictNullable" | "lazyRef")>, keyof import("@mikro-orm/core").PropertyOptions<any> | ("~options" | "~type" | "$type" | "strictNullable" | "lazyRef")>;
    readonly amount: import("@mikro-orm/core").UniversalPropertyOptionsBuilder<number, import("@mikro-orm/core").EmptyOptions, keyof import("@mikro-orm/core").PropertyOptions<any> | ("~options" | "~type" | "$type" | "strictNullable" | "lazyRef")>;
    readonly setAt: import("@mikro-orm/core").UniversalPropertyOptionsBuilder<Date, import("@mikro-orm/core").EmptyOptions, keyof import("@mikro-orm/core").PropertyOptions<any> | ("~options" | "~type" | "$type" | "strictNullable" | "lazyRef")>;
    readonly output: () => import("@mikro-orm/core").PropertyChain<Output, import("@mikro-orm/core").EmptyOptions & {
        kind: "m:1";
    }>;
}, undefined, never, never, false, undefined, undefined, false>>, undefined>;
export declare class OutputPrice extends OutputPriceSchema.class {
}
