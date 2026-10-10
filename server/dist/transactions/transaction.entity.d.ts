import { TransactionCategory } from './transaction-category.entity.js';
import { TransactionGroup } from './transaction-group.entity.js';
export declare const TransactionSchema: import("@mikro-orm/core").EntitySchemaWithMeta<"Transaction", "transactions", import("@mikro-orm/core").InferEntityFromProperties<{
    readonly id: Pick<import("@mikro-orm/core").UniversalPropertyOptionsBuilder<number, Omit<import("@mikro-orm/core").EmptyOptions, "primary"> & {
        primary: true;
    }, keyof import("@mikro-orm/core").PropertyOptions<any> | ("~options" | "~type" | "$type" | "strictNullable" | "lazyRef")>, keyof import("@mikro-orm/core").PropertyOptions<any> | ("~options" | "~type" | "$type" | "strictNullable" | "lazyRef")>;
    readonly amount: import("@mikro-orm/core").UniversalPropertyOptionsBuilder<number, import("@mikro-orm/core").EmptyOptions, keyof import("@mikro-orm/core").PropertyOptions<any> | ("~options" | "~type" | "$type" | "strictNullable" | "lazyRef")>;
    readonly date: import("@mikro-orm/core").UniversalPropertyOptionsBuilder<string, import("@mikro-orm/core").EmptyOptions, keyof import("@mikro-orm/core").PropertyOptions<any> | ("~options" | "~type" | "$type" | "strictNullable" | "lazyRef")>;
    readonly category: () => import("@mikro-orm/core").PropertyChain<TransactionCategory, import("@mikro-orm/core").EmptyOptions & {
        kind: "m:1";
    }>;
    readonly group: () => import("@mikro-orm/core").PropertyChain<TransactionGroup, import("@mikro-orm/core").EmptyOptions & {
        kind: "m:1";
    }>;
}, undefined, never, never, false, undefined, undefined, false>, never, {
    readonly id: Pick<import("@mikro-orm/core").UniversalPropertyOptionsBuilder<number, Omit<import("@mikro-orm/core").EmptyOptions, "primary"> & {
        primary: true;
    }, keyof import("@mikro-orm/core").PropertyOptions<any> | ("~options" | "~type" | "$type" | "strictNullable" | "lazyRef")>, keyof import("@mikro-orm/core").PropertyOptions<any> | ("~options" | "~type" | "$type" | "strictNullable" | "lazyRef")>;
    readonly amount: import("@mikro-orm/core").UniversalPropertyOptionsBuilder<number, import("@mikro-orm/core").EmptyOptions, keyof import("@mikro-orm/core").PropertyOptions<any> | ("~options" | "~type" | "$type" | "strictNullable" | "lazyRef")>;
    readonly date: import("@mikro-orm/core").UniversalPropertyOptionsBuilder<string, import("@mikro-orm/core").EmptyOptions, keyof import("@mikro-orm/core").PropertyOptions<any> | ("~options" | "~type" | "$type" | "strictNullable" | "lazyRef")>;
    readonly category: () => import("@mikro-orm/core").PropertyChain<TransactionCategory, import("@mikro-orm/core").EmptyOptions & {
        kind: "m:1";
    }>;
    readonly group: () => import("@mikro-orm/core").PropertyChain<TransactionGroup, import("@mikro-orm/core").EmptyOptions & {
        kind: "m:1";
    }>;
}, import("@mikro-orm/core").EntityCtor<import("@mikro-orm/core").InferEntityFromProperties<{
    readonly id: Pick<import("@mikro-orm/core").UniversalPropertyOptionsBuilder<number, Omit<import("@mikro-orm/core").EmptyOptions, "primary"> & {
        primary: true;
    }, keyof import("@mikro-orm/core").PropertyOptions<any> | ("~options" | "~type" | "$type" | "strictNullable" | "lazyRef")>, keyof import("@mikro-orm/core").PropertyOptions<any> | ("~options" | "~type" | "$type" | "strictNullable" | "lazyRef")>;
    readonly amount: import("@mikro-orm/core").UniversalPropertyOptionsBuilder<number, import("@mikro-orm/core").EmptyOptions, keyof import("@mikro-orm/core").PropertyOptions<any> | ("~options" | "~type" | "$type" | "strictNullable" | "lazyRef")>;
    readonly date: import("@mikro-orm/core").UniversalPropertyOptionsBuilder<string, import("@mikro-orm/core").EmptyOptions, keyof import("@mikro-orm/core").PropertyOptions<any> | ("~options" | "~type" | "$type" | "strictNullable" | "lazyRef")>;
    readonly category: () => import("@mikro-orm/core").PropertyChain<TransactionCategory, import("@mikro-orm/core").EmptyOptions & {
        kind: "m:1";
    }>;
    readonly group: () => import("@mikro-orm/core").PropertyChain<TransactionGroup, import("@mikro-orm/core").EmptyOptions & {
        kind: "m:1";
    }>;
}, undefined, never, never, false, undefined, undefined, false>>, undefined>;
export declare class Transaction extends TransactionSchema.class {
}
