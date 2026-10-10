import { EntityRepository } from '@mikro-orm/core';
import { LlmModel } from '../llm/llm.model.js';
import { ActionQueueService } from '../action-queue/action-queue.service.js';
import { Transaction } from '../transactions/transaction.entity.js';
import { TransactionCategory } from '../transactions/transaction-category.entity.js';
import { TransactionGroup } from '../transactions/transaction-group.entity.js';
import { TransactionsIngestService } from './transactions-ingest.service.js';

function makeEm() {
  const em = {
    persisted: [] as Record<string, unknown>[],
    nextId: 1,
    persist: vi.fn((entity: Record<string, unknown>) => {
      em.persisted.push(entity);
      return em;
    }),
    flush: vi.fn(async () => {
      for (const entity of em.persisted) {
        if (entity.id === undefined) entity.id = em.nextId++;
      }
    }),
  };
  return em;
}

function makeRepos(em: ReturnType<typeof makeEm>) {
  return {
    transactionRepository: {
      create: vi.fn((data) => ({ ...data })),
      getEntityManager: vi.fn(() => em),
    },
    categoryRepository: {
      findAll: vi.fn(),
      create: vi.fn((data) => ({ ...data })),
      getEntityManager: vi.fn(() => em),
    },
    groupRepository: {
      create: vi.fn((data) => ({ ...data })),
      assign: vi.fn((entity, data) => Object.assign(entity, data)),
      getEntityManager: vi.fn(() => em),
    },
  };
}

type Repos = ReturnType<typeof makeRepos>;

function makeService(
  repos: Repos,
  llm: { chatJson: ReturnType<typeof vi.fn> },
) {
  return new TransactionsIngestService(
    repos.transactionRepository as unknown as EntityRepository<Transaction>,
    repos.categoryRepository as unknown as EntityRepository<TransactionCategory>,
    repos.groupRepository as unknown as EntityRepository<TransactionGroup>,
    llm as unknown as LlmModel,
    new ActionQueueService(),
  );
}

const ROWS = [
  { date: '2026-01-01', description: 'Coffee shop', amount: '-4.50' },
  { date: '2026-01-02', description: 'Groceries', amount: '-62.10' },
];

describe('TransactionsIngestService', () => {
  beforeEach(() => {
    process.env.INGEST_BATCH_SIZE = '25';
  });

  it('creates a group first, persists one transaction per row referencing it, and names the group', async () => {
    const em = makeEm();
    const repos = makeRepos(em);
    repos.categoryRepository.findAll.mockResolvedValue([
      { id: 1, name: 'Dining' },
    ]);
    const llm = {
      chatJson: vi
        .fn()
        .mockResolvedValueOnce({
          rows: [
            {
              index: 0,
              amountCents: -450,
              date: '2026-01-01',
              categoryName: 'Dining',
              confidence: 0.95,
            },
            {
              index: 1,
              amountCents: -6210,
              date: '2026-01-02',
              categoryName: 'Groceries',
              confidence: 0.9,
            },
          ],
        })
        .mockResolvedValueOnce({ name: 'January groceries' }),
    };
    const service = makeService(repos, llm);

    const result = await service.ingest('bank.csv', ROWS);

    expect(result).toMatchObject({
      rowsTotal: 2,
      rowsPersisted: 2,
      decisionsCreated: 0,
      errors: [],
    });
    // The group was created before the transactions (it is the first persisted entity).
    expect(em.persisted[0]).toMatchObject({ originalFileName: 'bank.csv' });
    for (const call of repos.transactionRepository.create.mock.calls) {
      expect(call[0].group).toBe(em.persisted[0]);
      expect(call[0].group.id).toBe(1);
    }
    // Group name came from the final LLM call.
    expect(repos.groupRepository.assign).toHaveBeenCalledWith(em.persisted[0], {
      groupName: 'January groceries',
    });
    expect(llm.chatJson).toHaveBeenCalledTimes(2); // one batch + one group-name call
  });

  it('reuses an existing category case-insensitively instead of creating one', async () => {
    const em = makeEm();
    const repos = makeRepos(em);
    const existing = { id: 1, name: 'Dining' };
    repos.categoryRepository.findAll.mockResolvedValue([existing]);
    const llm = {
      chatJson: vi
        .fn()
        .mockResolvedValueOnce({
          rows: [
            {
              index: 0,
              amountCents: -450,
              date: '2026-01-01',
              categoryName: 'dining',
              confidence: 0.95,
            },
          ],
        })
        .mockResolvedValueOnce({ name: 'Dining out' }),
    };
    const service = makeService(repos, llm);

    const result = await service.ingest('bank.csv', [ROWS[0]!]);

    expect(result.rowsPersisted).toBe(1);
    expect(repos.categoryRepository.create).not.toHaveBeenCalled();
    expect(repos.transactionRepository.create.mock.calls[0]![0].category).toBe(
      existing,
    );
  });

  it('creates a new category when no existing one matches', async () => {
    const em = makeEm();
    const repos = makeRepos(em);
    repos.categoryRepository.findAll.mockResolvedValue([]);
    const llm = {
      chatJson: vi
        .fn()
        .mockResolvedValueOnce({
          rows: [
            {
              index: 0,
              amountCents: -450,
              date: '2026-01-01',
              categoryName: 'Coffee',
              confidence: 0.95,
            },
          ],
        })
        .mockResolvedValueOnce({ name: 'Coffee runs' }),
    };
    const service = makeService(repos, llm);

    await service.ingest('bank.csv', [ROWS[0]!]);

    expect(repos.categoryRepository.create).toHaveBeenCalledWith({
      name: 'Coffee',
    });
  });

  it('enqueues a TransactionDecision and persists nothing for a low-confidence row', async () => {
    const em = makeEm();
    const repos = makeRepos(em);
    const existing = { id: 1, name: 'Dining' };
    repos.categoryRepository.findAll.mockResolvedValue([existing]);
    const llm = {
      chatJson: vi
        .fn()
        .mockResolvedValueOnce({
          rows: [
            {
              index: 0,
              amountCents: -450,
              date: '2026-01-01',
              categoryName: 'Dining',
              confidence: 0.3,
            },
          ],
        })
        .mockResolvedValueOnce({ name: 'January' }),
    };
    const service = makeService(repos, llm);
    const queue = (service as unknown as { actionQueue: ActionQueueService })
      .actionQueue;

    const result = await service.ingest('bank.csv', [ROWS[0]!]);

    expect(result).toMatchObject({ rowsPersisted: 0, decisionsCreated: 1 });
    expect(queue.count()).toBe(1);
    const decision = queue.list()[0]!;
    expect(decision.type).toBe('transaction');
    expect(
      (decision.data as { suggestedCategoryName: string })
        .suggestedCategoryName,
    ).toBe('Dining');
    expect(repos.transactionRepository.create).not.toHaveBeenCalled();
  });

  it('records an error and skips the batch when the LLM call fails, still naming the group', async () => {
    const em = makeEm();
    const repos = makeRepos(em);
    repos.categoryRepository.findAll.mockResolvedValue([]);
    const llm = {
      chatJson: vi
        .fn()
        .mockRejectedValueOnce(new Error('openrouter down'))
        .mockResolvedValueOnce({ name: 'Bank import' }),
    };
    const service = makeService(repos, llm);

    const result = await service.ingest('bank.csv', ROWS);

    expect(result).toMatchObject({ rowsPersisted: 0, decisionsCreated: 0 });
    expect(result.errors[0]).toContain('LLM batch failed');
    expect(repos.groupRepository.assign).toHaveBeenCalledWith(em.persisted[0], {
      groupName: 'Bank import',
    });
  });
});
