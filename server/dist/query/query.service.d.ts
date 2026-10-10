import { LlmModelFactory } from '../llm/llm.factory.js';
import { QueryExecutor, QueryResult } from './query-executor.js';
import { QueryPlan } from './query-plan.js';
export interface AskResponse {
    answer: string;
    plan: QueryPlan;
    data: QueryResult;
}
export declare class QueryService {
    private readonly llmFactory;
    private readonly executor;
    constructor(llmFactory: LlmModelFactory, executor: QueryExecutor);
    ask(question: string, model?: string): Promise<AskResponse>;
    planOnly(question: string, model?: string): Promise<{
        plan: QueryPlan;
    }>;
    private buildPlan;
    private phraseAnswer;
}
