import { EntityRepository } from '@mikro-orm/core';
import { LlmModel } from '../llm/llm.model.js';
import { ActionQueueService } from '../action-queue/action-queue.service.js';
import { TransactionCategory } from '../transactions/transaction-category.entity.js';
import { TransactionGroup } from '../transactions/transaction-group.entity.js';
import { Transaction } from '../transactions/transaction.entity.js';
import { CsvRow } from './csv-file.js';
import { IngestFileResult } from './ingest-result.js';
export declare class TransactionsIngestService {
    private readonly transactionRepository;
    private readonly categoryRepository;
    private readonly groupRepository;
    private readonly llm;
    private readonly actionQueue;
    constructor(transactionRepository: EntityRepository<Transaction>, categoryRepository: EntityRepository<TransactionCategory>, groupRepository: EntityRepository<TransactionGroup>, llm: LlmModel, actionQueue: ActionQueueService);
    ingest(fileName: string, rows: CsvRow[]): Promise<IngestFileResult>;
    private batchPrompt;
    private loadCategories;
    private resolveCategory;
    private setGroupName;
}
