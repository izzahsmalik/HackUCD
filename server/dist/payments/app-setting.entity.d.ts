export declare const AppSettingSchema: import("@mikro-orm/core").EntitySchemaWithMeta<"AppSetting", "app_settings", import("@mikro-orm/core").InferEntityFromProperties<{
    readonly key: Pick<import("@mikro-orm/core").UniversalPropertyOptionsBuilder<string, Omit<import("@mikro-orm/core").EmptyOptions, "primary"> & {
        primary: true;
    }, keyof import("@mikro-orm/core").PropertyOptions<any> | ("~options" | "~type" | "$type" | "strictNullable" | "lazyRef")>, keyof import("@mikro-orm/core").PropertyOptions<any> | ("~options" | "~type" | "$type" | "strictNullable" | "lazyRef")>;
    readonly value: import("@mikro-orm/core").StringPropertyOptionsBuilder<string, import("@mikro-orm/core").EmptyOptions>;
}, undefined, never, never, false, undefined, undefined, false>, never, {
    readonly key: Pick<import("@mikro-orm/core").UniversalPropertyOptionsBuilder<string, Omit<import("@mikro-orm/core").EmptyOptions, "primary"> & {
        primary: true;
    }, keyof import("@mikro-orm/core").PropertyOptions<any> | ("~options" | "~type" | "$type" | "strictNullable" | "lazyRef")>, keyof import("@mikro-orm/core").PropertyOptions<any> | ("~options" | "~type" | "$type" | "strictNullable" | "lazyRef")>;
    readonly value: import("@mikro-orm/core").StringPropertyOptionsBuilder<string, import("@mikro-orm/core").EmptyOptions>;
}, import("@mikro-orm/core").EntityCtor<import("@mikro-orm/core").InferEntityFromProperties<{
    readonly key: Pick<import("@mikro-orm/core").UniversalPropertyOptionsBuilder<string, Omit<import("@mikro-orm/core").EmptyOptions, "primary"> & {
        primary: true;
    }, keyof import("@mikro-orm/core").PropertyOptions<any> | ("~options" | "~type" | "$type" | "strictNullable" | "lazyRef")>, keyof import("@mikro-orm/core").PropertyOptions<any> | ("~options" | "~type" | "$type" | "strictNullable" | "lazyRef")>;
    readonly value: import("@mikro-orm/core").StringPropertyOptionsBuilder<string, import("@mikro-orm/core").EmptyOptions>;
}, undefined, never, never, false, undefined, undefined, false>>, undefined>;
export declare class AppSetting extends AppSettingSchema.class {
}
