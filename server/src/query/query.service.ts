import { BadRequestException, Injectable } from '@nestjs/common';
import { LlmModel } from '../llm/llm.model.js';
import { QueryExecutor, QueryResult } from './query-executor.js';
import {
  ANSWER_SYSTEM_PROMPT,
  QUERY_PLAN_SCHEMA,
  QueryPlan,
  planSystemPrompt,
  validateQueryPlan,
} from './query-plan.js';

export interface AskResponse {
  answer: string;
  plan: QueryPlan;
  data: QueryResult;
}

/**
 * Answers natural-language questions about the stored financial data:
 * one LLM call turns the question into a structured query plan, the executor
 * runs it against the database, and a second LLM call phrases the answer.
 */
@Injectable()
export class QueryService {
  constructor(
    private readonly llm: LlmModel,
    private readonly executor: QueryExecutor,
  ) {}

  async ask(question: string): Promise<AskResponse> {
    const plan = await this.buildPlan(question);
    const data = await this.executor.execute(plan);
    return { answer: await this.phraseAnswer(question, data), plan, data };
  }

  /** Dry-run: just the plan, no execution and no answer phrasing. */
  async planOnly(question: string): Promise<{ plan: QueryPlan }> {
    return { plan: await this.buildPlan(question) };
  }

  private async buildPlan(question: string): Promise<QueryPlan> {
    const trimmed = typeof question === 'string' ? question.trim() : '';
    if (!trimmed) {
      throw new BadRequestException('question must be a non-empty string');
    }
    const value = await this.llm.chatJson(
      [
        { role: 'system', content: planSystemPrompt(new Date()) },
        { role: 'user', content: trimmed },
      ],
      QUERY_PLAN_SCHEMA,
      { temperature: 0 },
    );
    const validation = validateQueryPlan(value);
    if (!validation.ok) {
      throw new BadRequestException(
        `The question could not be turned into a valid query: ${validation.errors.join('; ')}`,
      );
    }
    return validation.plan;
  }

  /** Best-effort phrasing; a failure here falls back to a deterministic answer. */
  private async phraseAnswer(
    question: string,
    data: QueryResult,
  ): Promise<string> {
    try {
      const answer = await this.llm.chat([
        { role: 'system', content: ANSWER_SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Question: ${question}\nQuery result:\n${JSON.stringify(data)}`,
        },
      ]);
      if (answer.trim().length > 0) return answer.trim();
    } catch {
      // fall through to the deterministic answer
    }
    return fallbackAnswer(data);
  }
}

function fallbackAnswer(data: QueryResult): string {
  if (data.rowCount === 0) {
    return 'No matching records were found.';
  }
  if (data.totals.sumCents !== undefined) {
    const major = (data.totals.sumCents / 100).toFixed(2);
    return `Found ${data.rowCount} matching record(s); total ${major} in major units.`;
  }
  return `Found ${data.rowCount} matching record(s).`;
}
