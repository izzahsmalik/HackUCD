import { BadRequestException } from '@nestjs/common';
import { LlmModelFactory } from '../llm/llm.factory.js';
import { LlmError } from '../llm/llm.model.js';
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

type LlmFake = {
  chatJson: ReturnType<typeof vi.fn>;
  chat: ReturnType<typeof vi.fn>;
};

function makeService(
  llm: LlmFake,
  executor: { execute: ReturnType<typeof vi.fn> },
) {
  const factory = {
    create: vi.fn(() => llm),
  };
  return {
    factory,
    service: new QueryService(
      factory as unknown as LlmModelFactory,
      executor as unknown as QueryExecutor,
    ),
  };
}

describe('QueryService', () => {
  it('plans, executes, and phrases an answer', async () => {
    const llm = {
      chatJson: vi.fn().mockResolvedValue(PLAN),
      chat: vi.fn().mockResolvedValue('You spent $10.50.'),
    };
    const executor = { execute: vi.fn().mockResolvedValue(DATA) };
    const { service } = makeService(llm, executor);

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

  it('uses the default model when none is given', async () => {
    const llm = { chatJson: vi.fn().mockResolvedValue(PLAN), chat: vi.fn() };
    const executor = { execute: vi.fn().mockResolvedValue(DATA) };
    const { factory, service } = makeService(llm, executor);

    await service.ask('How much did I spend?');

    expect(factory.create).toHaveBeenCalledWith(undefined);
  });

  it('uses the requested model for the whole ask', async () => {
    const llm = {
      chatJson: vi.fn().mockResolvedValue(PLAN),
      chat: vi.fn().mockResolvedValue('Answer.'),
    };
    const executor = { execute: vi.fn().mockResolvedValue(DATA) };
    const { factory, service } = makeService(llm, executor);

    await service.ask('How much did I spend?', 'openai/gpt-4o-mini');

    expect(factory.create).toHaveBeenCalledWith('openai/gpt-4o-mini');
    // One instance per ask: plan and phrasing share it.
    expect(factory.create).toHaveBeenCalledTimes(1);
  });

  it('maps a 4xx LLM rejection to a BadRequestException', async () => {
    const llm = {
      chatJson: vi
        .fn()
        .mockRejectedValue(new LlmError('nope/model', 'HTTP 404', 404, '')),
      chat: vi.fn(),
    };
    const executor = { execute: vi.fn() };
    const { service } = makeService(llm, executor);

    await expect(service.ask('How much?')).rejects.toThrow(
      BadRequestException,
    );
    expect(executor.execute).not.toHaveBeenCalled();
  });

  it('rethrows 5xx LLM failures untouched', async () => {
    const llm = {
      chatJson: vi
        .fn()
        .mockRejectedValue(new LlmError('some/model', 'HTTP 502', 502, '')),
      chat: vi.fn(),
    };
    const executor = { execute: vi.fn() };
    const { service } = makeService(llm, executor);

    await expect(service.ask('How much?')).rejects.toThrow(LlmError);
  });

  it('rejects an empty question before any LLM call', async () => {
    const llm = { chatJson: vi.fn(), chat: vi.fn() };
    const executor = { execute: vi.fn() };
    const { service } = makeService(llm, executor);

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
    const { service } = makeService(llm, executor);

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
    const { service } = makeService(llm, executor);

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
    const { service } = makeService(llm, executor);

    const response = await service.ask('How much did I spend on temples?');

    expect(response.answer).toContain('No matching records');
  });

  it('planOnly validates and returns the plan without executing', async () => {
    const llm = {
      chatJson: vi.fn().mockResolvedValue(PLAN),
      chat: vi.fn(),
    };
    const executor = { execute: vi.fn() };
    const { service } = makeService(llm, executor);

    const result = await service.planOnly('How much did I spend?');

    expect(result).toEqual({ plan: PLAN });
    expect(executor.execute).not.toHaveBeenCalled();
    expect(llm.chat).not.toHaveBeenCalled();
  });
});
