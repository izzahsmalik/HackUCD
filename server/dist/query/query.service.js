var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { BadRequestException, Injectable } from '@nestjs/common';
import { LlmModel } from '../llm/llm.model.js';
import { QueryExecutor } from './query-executor.js';
import { ANSWER_SYSTEM_PROMPT, QUERY_PLAN_SCHEMA, planSystemPrompt, validateQueryPlan, } from './query-plan.js';
let QueryService = class QueryService {
    llm;
    executor;
    constructor(llm, executor) {
        this.llm = llm;
        this.executor = executor;
    }
    async ask(question) {
        const plan = await this.buildPlan(question);
        const data = await this.executor.execute(plan);
        return { answer: await this.phraseAnswer(question, data), plan, data };
    }
    async planOnly(question) {
        return { plan: await this.buildPlan(question) };
    }
    async buildPlan(question) {
        const trimmed = typeof question === 'string' ? question.trim() : '';
        if (!trimmed) {
            throw new BadRequestException('question must be a non-empty string');
        }
        const value = await this.llm.chatJson([
            { role: 'system', content: planSystemPrompt(new Date()) },
            { role: 'user', content: trimmed },
        ], QUERY_PLAN_SCHEMA, { temperature: 0 });
        const validation = validateQueryPlan(value);
        if (!validation.ok) {
            throw new BadRequestException(`The question could not be turned into a valid query: ${validation.errors.join('; ')}`);
        }
        return validation.plan;
    }
    async phraseAnswer(question, data) {
        try {
            const answer = await this.llm.chat([
                { role: 'system', content: ANSWER_SYSTEM_PROMPT },
                {
                    role: 'user',
                    content: `Question: ${question}\nQuery result:\n${JSON.stringify(data)}`,
                },
            ]);
            if (answer.trim().length > 0)
                return answer.trim();
        }
        catch {
        }
        return fallbackAnswer(data);
    }
};
QueryService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [LlmModel,
        QueryExecutor])
], QueryService);
export { QueryService };
function fallbackAnswer(data) {
    if (data.rowCount === 0) {
        return 'No matching records were found.';
    }
    if (data.totals.sumCents !== undefined) {
        const major = (data.totals.sumCents / 100).toFixed(2);
        return `Found ${data.rowCount} matching record(s); total ${major} in major units.`;
    }
    return `Found ${data.rowCount} matching record(s).`;
}
//# sourceMappingURL=query.service.js.map