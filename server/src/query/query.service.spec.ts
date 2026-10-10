import { BadRequestException } from '@nestjs/common';
import { LlmModel } from '../llm/llm.model.js';
import { QueryExecutor, QueryResult } from './query-executor.js';
import { QueryService } from './query.service.js';

const PLAN = { entity: 'transactions', aggregation: 'sum' };

const DATA: QueryResult = {
  entity: 'transactions',
  rowCount: 2,
  totals: {
    count: 2,
    sumCents: -1050,
    avgCents: -525,
    minCents: -600,
    maxCents: -450,
  },
  rows: [],
};

function makeService(
  llm: { chatJson: ReturnType<typeof vi.fn>; chat: ReturnType<typeof vi.fn> },
  executor: { execute: ReturnType<typeof vi.fn> },
) {
  return new QueryService(
    llm as unknown as LlmModel,
    executor as unknown as QueryExecutor,
  );
}

describe('QueryService', () => {
  it('plans, executes, and phrases an answer', async () => {
    const llm = {
      chatJson: vi.fn().mockResolvedValue(PLAN),
      chat: vi.fn().mockResolvedValue('You spent $10.50.'),
    };
    const executor = { execute: vi.fn().mockResolvedValue(DATA) };
    const service = makeService(llm, executor);

    const response = await service.ask('How much did I spend?');

    expect(response).toEqual({
      answer: 'You spent $10.50.',
      plan: PLAN,
      data: DATA,
    });
    // Plan call used temperature 0; the phrasing call received the result data.
    expect(llm.chatJson).toHaveBeenCalledTimes(1);
    expect(llm.chatJson.mock.calls[0]![2]).toEqual({ temperature: 0 });
    expect(executor.execute).toHaveBeenCalledWith(PLAN);
    expect(llm.chat.mock.calls[0]![0][1].content).toContain('Query result');
  });

  it('rejects an empty question before any LLM call', async () => {
    const llm = { chatJson: vi.fn(), chat: vi.fn() };
    const executor = { execute: vi.fn() };
    const service = makeService(llm, executor);

    await expect(service.ask('   ')).rejects.toThrow(BadRequestException);
    expect(llm.chatJson).not.toHaveBeenCalled();
    expect(executor.execute).not.toHaveBeenCalled();
  });

  it('rejects when the LLM returns an invalid plan and never executes', async () => {
    const llm = {
      chatJson: vi.fn().mockResolvedValue({ entity: 'brands' }),
      chat: vi.fn(),
    };
    const executor = { execute: vi.fn() };
    const service = makeService(llm, executor);

    await expect(service.ask('weird question')).rejects.toThrow(
      BadRequestException,
    );
    expect(executor.execute).not.toHaveBeenCalled();
    expect(llm.chat).not.toHaveBeenCalled();
  });

  it('falls back to a deterministic answer when phrasing fails', async () => {
    const llm = {
      chatJson: vi.fn().mockResolvedValue(PLAN),
      chat: vi.fn().mockRejectedValue(new Error('phrasing down')),
    };
    const executor = { execute: vi.fn().mockResolvedValue(DATA) };
    const service = makeService(llm, executor);

    const response = await service.ask('How much did I spend?');

    expect(response.answer).toContain('Found 2 matching record(s)');
    expect(response.answer).toContain('-10.50');
  });

  it('reports no matching records for an empty result', async () => {
    const llm = {
      chatJson: vi.fn().mockResolvedValue(PLAN),
      chat: vi.fn().mockRejectedValue(new Error('phrasing down')),
    };
    const executor = {
      execute: vi.fn().mockResolvedValue({
        entity: 'transactions',
        rowCount: 0,
        totals: { count: 0 },
        rows: [],
      } satisfies QueryResult),
    };
    const service = makeService(llm, executor);

    const response = await service.ask('How much did I spend on temples?');

    expect(response.answer).toContain('No matching records');
  });

  it('planOnly validates and returns the plan without executing', async () => {
    const llm = {
      chatJson: vi.fn().mockResolvedValue(PLAN),
      chat: vi.fn(),
    };
    const executor = { execute: vi.fn() };
    const service = makeService(llm, executor);

    const result = await service.planOnly('How much did I spend?');

    expect(result).toEqual({ plan: PLAN });
    expect(executor.execute).not.toHaveBeenCalled();
    expect(llm.chat).not.toHaveBeenCalled();
  });
});
