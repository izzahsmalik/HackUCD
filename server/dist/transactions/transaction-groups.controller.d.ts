import { TransactionGroupsService } from './transaction-groups.service.js';
export declare class TransactionGroupsController {
    private readonly transactionGroupsService;
    constructor(transactionGroupsService: TransactionGroupsService);
    findAll(): Promise<import("./transaction-group.entity.js").TransactionGroup[]>;
    findOne(id: number): Promise<import("./transaction-group.entity.js").TransactionGroup>;
}
