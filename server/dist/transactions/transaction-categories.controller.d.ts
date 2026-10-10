import { TransactionCategoriesService } from './transaction-categories.service.js';
import type { CreateTransactionCategoryDto, UpdateTransactionCategoryDto } from './dto/transaction-category.dto.js';
export declare class TransactionCategoriesController {
    private readonly transactionCategoriesService;
    constructor(transactionCategoriesService: TransactionCategoriesService);
    findAll(): Promise<import("./transaction-category.entity.js").TransactionCategory[]>;
    findOne(id: number): Promise<import("./transaction-category.entity.js").TransactionCategory>;
    create(dto: CreateTransactionCategoryDto): Promise<import("./transaction-category.entity.js").TransactionCategory>;
    update(id: number, dto: UpdateTransactionCategoryDto): Promise<import("./transaction-category.entity.js").TransactionCategory>;
    remove(id: number): Promise<void>;
}
