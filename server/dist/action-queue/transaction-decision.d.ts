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
    date: string;
    suggestedCategoryName: string;
    confidence: number;
    existingCategories: {
        id: number;
        name: string;
    }[];
    groupId: number;
}
export declare class TransactionDecision extends Decision {
    readonly data: TransactionDecisionData;
    private readonly transactionRepository;
    private readonly categoryRepository;
    private readonly groupRepository;
    readonly type = "transaction";
    readonly summary: string;
    readonly actions: DecisionAction[];
    constructor(data: TransactionDecisionData, transactionRepository: EntityRepository<Transaction>, categoryRepository: EntityRepository<TransactionCategory>, groupRepository: EntityRepository<TransactionGroup>);
    apply(actionId: string, payload?: Record<string, unknown>): Promise<unknown>;
    private categorize;
    private categorizeNew;
    private persistTransaction;
}
