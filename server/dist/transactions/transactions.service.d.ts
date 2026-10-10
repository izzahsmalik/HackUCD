import { EntityRepository } from '@mikro-orm/core';
import { TransactionCategory } from './transaction-category.entity.js';
import { TransactionGroup } from './transaction-group.entity.js';
import { Transaction } from './transaction.entity.js';
import type { CreateTransactionDto, UpdateTransactionDto } from './dto/transaction.dto.js';
export declare class TransactionsService {
    private readonly transactionRepository;
    private readonly categoryRepository;
    private readonly groupRepository;
    constructor(transactionRepository: EntityRepository<Transaction>, categoryRepository: EntityRepository<TransactionCategory>, groupRepository: EntityRepository<TransactionGroup>);
    findAll(): Promise<Transaction[]>;
    findOne(id: number): Promise<Transaction>;
    create(dto: CreateTransactionDto): Promise<Transaction>;
    update(id: number, dto: UpdateTransactionDto): Promise<Transaction>;
    remove(id: number): Promise<void>;
    private categoryOrThrow;
    private groupOrThrow;
    private validate;
}
