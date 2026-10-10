import { TransactionsService } from './transactions.service.js';
import type { CreateTransactionDto, UpdateTransactionDto } from './dto/transaction.dto.js';
export declare class TransactionsController {
    private readonly transactionsService;
    constructor(transactionsService: TransactionsService);
    findAll(): Promise<import("./transaction.entity.js").Transaction[]>;
    findOne(id: number): Promise<import("./transaction.entity.js").Transaction>;
    create(dto: CreateTransactionDto): Promise<import("./transaction.entity.js").Transaction>;
    update(id: number, dto: UpdateTransactionDto): Promise<import("./transaction.entity.js").Transaction>;
    remove(id: number): Promise<void>;
}
