import { AskResponse, QueryService } from './query.service.js';
import { QueryPlan } from './query-plan.js';
export interface AskQuestionDto {
    question: string;
}
export declare class QueryController {
    private readonly queryService;
    constructor(queryService: QueryService);
    ask(dto: AskQuestionDto): Promise<AskResponse>;
    plan(dto: AskQuestionDto): Promise<{
        plan: QueryPlan;
    }>;
}
