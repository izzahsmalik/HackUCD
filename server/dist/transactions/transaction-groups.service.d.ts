import { EntityRepository } from '@mikro-orm/core';
import { TransactionGroup } from './transaction-group.entity.js';
export declare class TransactionGroupsService {
    private readonly groupRepository;
    constructor(groupRepository: EntityRepository<TransactionGroup>);
    findAll(): Promise<TransactionGroup[]>;
    findOne(id: number): Promise<TransactionGroup>;
}
