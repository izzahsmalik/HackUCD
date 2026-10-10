import { EntityRepository } from '@mikro-orm/core';
import { Brand } from '../brands/brand.entity.js';
import { Product } from '../products/product.entity.js';
import { ProductPrice } from '../products/product-price.entity.js';
import { Transaction } from '../transactions/transaction.entity.js';
import { TransactionCategory } from '../transactions/transaction-category.entity.js';
import { TransactionGroup } from '../transactions/transaction-group.entity.js';
import { QueryPlan } from './query-plan.js';
export interface QueryResultRow {
    id: number;
    date: string;
    amountCents: number;
    label: string;
}
export interface QueryResultGroup {
    key: string;
    count: number;
    sumCents: number;
    avgCents: number;
}
export interface QueryResultTotals {
    count: number;
    sumCents?: number;
    avgCents?: number;
    minCents?: number;
    maxCents?: number;
}
export interface QueryResult {
    entity: 'transactions' | 'productPrices';
    rowCount: number;
    totals: QueryResultTotals;
    groups?: QueryResultGroup[];
    rows: QueryResultRow[];
}
export declare class QueryExecutor {
    private readonly transactionRepository;
    private readonly categoryRepository;
    private readonly groupRepository;
    private readonly productRepository;
    private readonly productPriceRepository;
    private readonly brandRepository;
    constructor(transactionRepository: EntityRepository<Transaction>, categoryRepository: EntityRepository<TransactionCategory>, groupRepository: EntityRepository<TransactionGroup>, productRepository: EntityRepository<Product>, productPriceRepository: EntityRepository<ProductPrice>, brandRepository: EntityRepository<Brand>);
    execute(plan: QueryPlan): Promise<QueryResult>;
    private executeTransactions;
    private executeProductPrices;
    private resolveNameIds;
    private resolveGroupIds;
    private resolveProductIds;
}
