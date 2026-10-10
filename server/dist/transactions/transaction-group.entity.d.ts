export declare const TransactionGroupSchema: import("@mikro-orm/core").EntitySchemaWithMeta<"TransactionGroup", "transaction_groups", import("@mikro-orm/core").InferEntityFromProperties<{
    readonly id: Pick<import("@mikro-orm/core").UniversalPropertyOptionsBuilder<number, Omit<import("@mikro-orm/core").EmptyOptions, "primary"> & {
        primary: true;
    }, keyof import("@mikro-orm/core").PropertyOptions<any> | ("~options" | "~type" | "$type" | "strictNullable" | "lazyRef")>, keyof import("@mikro-orm/core").PropertyOptions<any> | ("~options" | "~type" | "$type" | "strictNullable" | "lazyRef")>;
    readonly originalFileName: import("@mikro-orm/core").StringPropertyOptionsBuilder<string, import("@mikro-orm/core").EmptyOptions>;
    readonly groupName: import("@mikro-orm/core").StringPropertyOptionsBuilder<string, import("@mikro-orm/core").EmptyOptions>;
}, undefined, never, never, false, undefined, undefined, false>, never, {
    readonly id: Pick<import("@mikro-orm/core").UniversalPropertyOptionsBuilder<number, Omit<import("@mikro-orm/core").EmptyOptions, "primary"> & {
        primary: true;
    }, keyof import("@mikro-orm/core").PropertyOptions<any> | ("~options" | "~type" | "$type" | "strictNullable" | "lazyRef")>, keyof import("@mikro-orm/core").PropertyOptions<any> | ("~options" | "~type" | "$type" | "strictNullable" | "lazyRef")>;
    readonly originalFileName: import("@mikro-orm/core").StringPropertyOptionsBuilder<string, import("@mikro-orm/core").EmptyOptions>;
    readonly groupName: import("@mikro-orm/core").StringPropertyOptionsBuilder<string, import("@mikro-orm/core").EmptyOptions>;
}, import("@mikro-orm/core").EntityCtor<import("@mikro-orm/core").InferEntityFromProperties<{
    readonly id: Pick<import("@mikro-orm/core").UniversalPropertyOptionsBuilder<number, Omit<import("@mikro-orm/core").EmptyOptions, "primary"> & {
        primary: true;
    }, keyof import("@mikro-orm/core").PropertyOptions<any> | ("~options" | "~type" | "$type" | "strictNullable" | "lazyRef")>, keyof import("@mikro-orm/core").PropertyOptions<any> | ("~options" | "~type" | "$type" | "strictNullable" | "lazyRef")>;
    readonly originalFileName: import("@mikro-orm/core").StringPropertyOptionsBuilder<string, import("@mikro-orm/core").EmptyOptions>;
    readonly groupName: import("@mikro-orm/core").StringPropertyOptionsBuilder<string, import("@mikro-orm/core").EmptyOptions>;
}, undefined, never, never, false, undefined, undefined, false>>, undefined>;
export declare class TransactionGroup extends TransactionGroupSchema.class {
}
