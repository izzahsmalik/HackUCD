import { EntityRepository } from '@mikro-orm/core';
import { Transaction } from './transaction.entity.js';
import { TransactionCategory } from './transaction-category.entity.js';
import type { CreateTransactionCategoryDto, UpdateTransactionCategoryDto } from './dto/transaction-category.dto.js';
export declare class TransactionCategoriesService {
    private readonly categoryRepository;
    private readonly transactionRepository;
    constructor(categoryRepository: EntityRepository<TransactionCategory>, transactionRepository: EntityRepository<Transaction>);
    findAll(): Promise<TransactionCategory[]>;
    findOne(id: number): Promise<TransactionCategory>;
    create(dto: CreateTransactionCategoryDto): Promise<TransactionCategory>;
    update(id: number, dto: UpdateTransactionCategoryDto): Promise<TransactionCategory>;
    remove(id: number): Promise<void>;
    private validate;
}
