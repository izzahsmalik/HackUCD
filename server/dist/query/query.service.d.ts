import { LlmModel } from '../llm/llm.model.js';
import { QueryExecutor, QueryResult } from './query-executor.js';
import { QueryPlan } from './query-plan.js';
export interface AskResponse {
    answer: string;
    plan: QueryPlan;
    data: QueryResult;
}
export declare class QueryService {
    private readonly llm;
    private readonly executor;
    constructor(llm: LlmModel, executor: QueryExecutor);
    ask(question: string): Promise<AskResponse>;
    planOnly(question: string): Promise<{
        plan: QueryPlan;
    }>;
    private buildPlan;
    private phraseAnswer;
}
