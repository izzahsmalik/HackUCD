import { BadRequestException } from '@nestjs/common';
import { EntityRepository } from '@mikro-orm/core';
import { TransactionCategory } from '../transactions/transaction-category.entity.js';
import { TransactionGroup } from '../transactions/transaction-group.entity.js';
import { Transaction } from '../transactions/transaction.entity.js';
import { Decision, DecisionAction } from './decision.js';

export interface TransactionDecisionData {
  rowIndex: number;
  fileName: string;
  rawRow: Record<string, string>;
  amountCents: number;
  /** Parsed date, YYYY-MM-DD */
  date: string;
  suggestedCategoryName: string;
  confidence: number;
  existingCategories: { id: number; name: string }[];
  groupId: number;
}

/** Decision for a transactions CSV row whose category assignment was not confident. */
export class TransactionDecision extends Decision {
  readonly type = 'transaction';
  readonly summary: string;
  readonly actions: DecisionAction[] = [
    {
      id: 'categorize',
      label: 'File under an existing category',
      payload: { categoryId: 'number' },
    },
    {
      id: 'categorize-new',
      label: 'Create a new category and file it',
      payload: { name: 'string' },
    },
    { id: 'discard', label: 'Discard this row' },
  ];

  constructor(
    readonly data: TransactionDecisionData,
    private readonly transactionRepository: EntityRepository<Transaction>,
    private readonly categoryRepository: EntityRepository<TransactionCategory>,
    private readonly groupRepository: EntityRepository<TransactionGroup>,
  ) {
    super();
    this.summary =
      `Transaction row #${data.rowIndex} (${(data.amountCents / 100).toFixed(2)} on ${data.date}) ` +
      `could not be confidently categorized`;
  }

  async apply(
    actionId: string,
    payload?: Record<string, unknown>,
  ): Promise<unknown> {
    switch (actionId) {
      case 'categorize':
        return this.categorize(this.payloadNumber(payload, 'categoryId'));
      case 'categorize-new':
        return this.categorizeNew(this.payloadString(payload, 'name'));
      case 'discard':
        return { discarded: true };
      default:
        throw new BadRequestException(
          `Unknown action '${actionId}' for a transaction decision`,
        );
    }
  }

  private async categorize(categoryId: number): Promise<Transaction> {
    const category = await this.categoryRepository.findOne({ id: categoryId });
    if (!category)
      throw new BadRequestException(
        `Transaction category #${categoryId} does not exist`,
      );
    return this.persistTransaction(category);
  }

  private async categorizeNew(name: string): Promise<Transaction> {
    const category = this.categoryRepository.create({ name });
    await this.categoryRepository.getEntityManager().persist(category).flush();
    return this.persistTransaction(category);
  }

  private async persistTransaction(
    category: TransactionCategory,
  ): Promise<Transaction> {
    const group = await this.groupRepository.findOne({ id: this.data.groupId });
    if (!group) {
      throw new BadRequestException(
        `Transaction group #${this.data.groupId} does not exist`,
      );
    }
    const transaction = this.transactionRepository.create({
      amount: this.data.amountCents,
      date: this.data.date,
      category,
      group,
    });
    await this.transactionRepository
      .getEntityManager()
      .persist(transaction)
      .flush();
    return transaction;
  }
}
