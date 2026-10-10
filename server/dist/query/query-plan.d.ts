import type { JsonSchema } from '../llm/llm.model.js';
export type QueryAggregation = 'sum' | 'count' | 'avg' | 'min' | 'max';
export interface TransactionQueryPlan {
    entity: 'transactions';
    dateFrom?: string;
    dateTo?: string;
    categoryNames?: string[];
    groupNames?: string[];
    aggregation?: QueryAggregation;
    groupBy?: 'category' | 'group';
    limit?: number;
    orderByAmount?: 'asc' | 'desc';
}
export interface ProductPriceQueryPlan {
    entity: 'productPrices';
    setAtFrom?: string;
    setAtTo?: string;
    productNames?: string[];
    brandNames?: string[];
    aggregation?: QueryAggregation;
    groupBy?: 'product' | 'brand';
    limit?: number;
    orderByAmount?: 'asc' | 'desc';
}
export type QueryPlan = TransactionQueryPlan | ProductPriceQueryPlan;
export declare const QUERY_PLAN_SCHEMA: JsonSchema;
export type QueryPlanValidation = {
    ok: true;
    plan: QueryPlan;
} | {
    ok: false;
    errors: string[];
};
export declare function validateQueryPlan(value: unknown): QueryPlanValidation;
export declare function planSystemPrompt(now: Date): string;
export declare const ANSWER_SYSTEM_PROMPT: string;
