import { BadRequestException, Injectable } from '@nestjs/common';
import { LlmModelFactory } from '../llm/llm.factory.js';
import { LlmError } from '../llm/llm.model.js';
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
 * Each call may pick its own OpenRouter model via the optional model argument.
 */
@Injectable()
export class QueryService {
  constructor(
    private readonly llmFactory: LlmModelFactory,
    private readonly executor: QueryExecutor,
  ) {}

  async ask(question: string, model?: string): Promise<AskResponse> {
    const llm = this.llmFactory.create(model);
    const plan = await this.buildPlan(question, llm);
    const data = await this.executor.execute(plan);
    return { answer: await this.phraseAnswer(question, data, llm), plan, data };
  }

  /** Dry-run: just the plan, no execution and no answer phrasing. */
  async planOnly(
    question: string,
    model?: string,
  ): Promise<{ plan: QueryPlan }> {
    return {
      plan: await this.buildPlan(question, this.llmFactory.create(model)),
    };
  }

  private async buildPlan(
    question: string,
    llm: ReturnType<LlmModelFactory['create']>,
  ): Promise<QueryPlan> {
    const trimmed = typeof question === 'string' ? question.trim() : '';
    if (!trimmed) {
      throw new BadRequestException('question must be a non-empty string');
    }
    let value: unknown;
    try {
      value = await llm.chatJson(
        [
          { role: 'system', content: planSystemPrompt(new Date()) },
          { role: 'user', content: trimmed },
        ],
        QUERY_PLAN_SCHEMA,
        { temperature: 0 },
      );
    } catch (error) {
      // An unknown or rejecting model should read as a client error, not a 500.
      if (
        error instanceof LlmError &&
        error.status !== undefined &&
        error.status >= 400 &&
        error.status < 500
      ) {
        throw new BadRequestException(
          `The AI model rejected the request: ${error.message}`,
        );
      }
      throw error;
    }
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
    llm: ReturnType<LlmModelFactory['create']>,
  ): Promise<string> {
    try {
      const answer = await llm.chat([
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
