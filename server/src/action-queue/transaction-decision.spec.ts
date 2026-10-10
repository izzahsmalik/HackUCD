import { BadRequestException } from '@nestjs/common';
import { EntityRepository } from '@mikro-orm/core';
import { Transaction } from '../transactions/transaction.entity.js';
import { TransactionCategory } from '../transactions/transaction-category.entity.js';
import { TransactionGroup } from '../transactions/transaction-group.entity.js';
import {
  TransactionDecision,
  TransactionDecisionData,
} from './transaction-decision.js';

const entityManager = {
  persist: vi.fn(),
  flush: vi.fn(),
};
entityManager.persist.mockReturnValue(entityManager);

interface TransactionDecisionRepos {
  transactionRepository: {
    create: ReturnType<typeof vi.fn>;
    getEntityManager: ReturnType<typeof vi.fn>;
  };
  categoryRepository: {
    findOne: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    getEntityManager: ReturnType<typeof vi.fn>;
  };
  groupRepository: { findOne: ReturnType<typeof vi.fn> };
}

function makeRepos(): TransactionDecisionRepos {
  return {
    transactionRepository: {
      create: vi.fn((data) => data),
      getEntityManager: vi.fn(() => entityManager),
    },
    categoryRepository: {
      findOne: vi.fn(),
      create: vi.fn((data) => data),
      getEntityManager: vi.fn(() => entityManager),
    },
    groupRepository: {
      findOne: vi.fn(),
    },
  };
}

function makeDecision(
  repos: TransactionDecisionRepos,
  overrides: Partial<TransactionDecisionData> = {},
): TransactionDecision {
  const data: TransactionDecisionData = {
    rowIndex: 7,
    fileName: 'bank.csv',
    rawRow: { date: '2026-01-15', description: 'Coffee shop', amount: '-4.50' },
    amountCents: -450,
    date: '2026-01-15',
    suggestedCategoryName: 'Dining',
    confidence: 0.5,
    existingCategories: [
      { id: 1, name: 'Groceries' },
      { id: 2, name: 'Dining' },
    ],
    groupId: 10,
    ...overrides,
  };
  return new TransactionDecision(
    data,
    repos.transactionRepository as unknown as EntityRepository<Transaction>,
    repos.categoryRepository as unknown as EntityRepository<TransactionCategory>,
    repos.groupRepository as unknown as EntityRepository<TransactionGroup>,
  );
}

describe('TransactionDecision', () => {
  it('exposes categorize/categorize-new/discard actions and a summary', () => {
    const decision = makeDecision(makeRepos());
    expect(decision.actions.map((a) => a.id)).toEqual([
      'categorize',
      'categorize-new',
      'discard',
    ]);
    expect(decision.summary).toContain('row #7');
  });

  it('categorize persists the transaction under the chosen category and group', async () => {
    const repos = makeRepos();
    repos.categoryRepository.findOne.mockResolvedValue({
      id: 2,
      name: 'Dining',
    });
    repos.groupRepository.findOne.mockResolvedValue({
      id: 10,
      groupName: 'Bank import',
    });
    const decision = makeDecision(repos);
    const transaction = (await decision.apply('categorize', {
      categoryId: 2,
    })) as Transaction;
    expect(transaction).toMatchObject({
      amount: -450,
      date: '2026-01-15',
      category: { id: 2, name: 'Dining' },
      group: { id: 10 },
    });
  });

  it('categorize rejects an unknown category', async () => {
    const repos = makeRepos();
    repos.categoryRepository.findOne.mockResolvedValue(null);
    const decision = makeDecision(repos);
    await expect(
      decision.apply('categorize', { categoryId: 99 }),
    ).rejects.toThrow('Transaction category #99 does not exist');
  });

  it('categorize-new creates the category then the transaction', async () => {
    const repos = makeRepos();
    repos.groupRepository.findOne.mockResolvedValue({
      id: 10,
      groupName: 'Bank import',
    });
    const decision = makeDecision(repos);
    await decision.apply('categorize-new', { name: 'Coffee' });
    expect(repos.categoryRepository.create).toHaveBeenCalledWith({
      name: 'Coffee',
    });
    expect(repos.transactionRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ amount: -450 }),
    );
  });

  it('rejects a missing payload for categorize', async () => {
    const decision = makeDecision(makeRepos());
    await expect(decision.apply('categorize')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('discard resolves without writes', async () => {
    const repos = makeRepos();
    const decision = makeDecision(repos);
    await expect(decision.apply('discard')).resolves.toEqual({
      discarded: true,
    });
    expect(repos.transactionRepository.create).not.toHaveBeenCalled();
  });

  it('rejects an unknown action', async () => {
    const decision = makeDecision(makeRepos());
    await expect(decision.apply('explode')).rejects.toThrow(
      "Unknown action 'explode'",
    );
  });
});
