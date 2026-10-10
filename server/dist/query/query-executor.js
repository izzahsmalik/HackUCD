var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { EntityRepository } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';
import { Brand } from '../brands/brand.entity.js';
import { Product } from '../products/product.entity.js';
import { ProductPrice } from '../products/product-price.entity.js';
import { Transaction } from '../transactions/transaction.entity.js';
import { TransactionCategory } from '../transactions/transaction-category.entity.js';
import { TransactionGroup } from '../transactions/transaction-group.entity.js';
const DEFAULT_ROW_LIMIT = 20;
let QueryExecutor = class QueryExecutor {
    transactionRepository;
    categoryRepository;
    groupRepository;
    productRepository;
    productPriceRepository;
    brandRepository;
    constructor(transactionRepository, categoryRepository, groupRepository, productRepository, productPriceRepository, brandRepository) {
        this.transactionRepository = transactionRepository;
        this.categoryRepository = categoryRepository;
        this.groupRepository = groupRepository;
        this.productRepository = productRepository;
        this.productPriceRepository = productPriceRepository;
        this.brandRepository = brandRepository;
    }
    async execute(plan) {
        return plan.entity === 'transactions'
            ? this.executeTransactions(plan)
            : this.executeProductPrices(plan);
    }
    async executeTransactions(plan) {
        const categoryIds = await this.resolveNameIds(this.categoryRepository, plan.categoryNames);
        const groupIds = await this.resolveGroupIds(plan.groupNames);
        if (categoryIds === null || groupIds === null) {
            return emptyResult('transactions');
        }
        const where = {};
        const date = {};
        if (plan.dateFrom)
            date.$gte = plan.dateFrom;
        if (plan.dateTo)
            date.$lte = plan.dateTo;
        if (Object.keys(date).length > 0)
            where.date = date;
        if (categoryIds)
            where.category = { $in: categoryIds };
        if (groupIds)
            where.group = { $in: groupIds };
        const populate = ['category', 'group'];
        if (plan.aggregation || plan.groupBy) {
            const all = await this.transactionRepository.find(where, { populate });
            const amounts = all.map((row) => row.amount);
            const result = {
                entity: 'transactions',
                rowCount: all.length,
                totals: computeTotals(amounts),
                rows: [],
            };
            if (plan.groupBy) {
                result.groups = computeGroups(all.map((row) => ({
                    key: plan.groupBy === 'category'
                        ? row.category.name
                        : row.group.groupName,
                    amountCents: row.amount,
                })));
            }
            return result;
        }
        const rows = await this.transactionRepository.find(where, {
            populate,
            orderBy: [{ date: 'desc' }, { amount: plan.orderByAmount ?? 'desc' }],
            limit: plan.limit ?? DEFAULT_ROW_LIMIT,
        });
        return {
            entity: 'transactions',
            rowCount: rows.length,
            totals: { count: rows.length },
            rows: rows.map((row) => ({
                id: row.id,
                date: row.date,
                amountCents: row.amount,
                label: `${row.category.name} / ${row.group.groupName}`,
            })),
        };
    }
    async executeProductPrices(plan) {
        const productIds = await this.resolveProductIds(plan);
        if (productIds === null)
            return emptyResult('productPrices');
        const where = {};
        const setAt = {};
        if (plan.setAtFrom)
            setAt.$gte = new Date(plan.setAtFrom);
        if (plan.setAtTo)
            setAt.$lte = new Date(plan.setAtTo);
        if (Object.keys(setAt).length > 0)
            where.setAt = setAt;
        if (productIds)
            where.product = { $in: productIds };
        const populate = ['product', 'product.brand'];
        const label = (row) => `${row.product.name} (${row.product.brand.name})`;
        const dateOf = (row) => row.setAt instanceof Date ? row.setAt.toISOString() : String(row.setAt);
        if (plan.aggregation || plan.groupBy) {
            const all = await this.productPriceRepository.find(where, { populate });
            const amounts = all.map((row) => row.amount);
            const result = {
                entity: 'productPrices',
                rowCount: all.length,
                totals: computeTotals(amounts),
                rows: [],
            };
            if (plan.groupBy) {
                result.groups = computeGroups(all.map((row) => ({
                    key: plan.groupBy === 'product' ? row.product.name : row.product.brand.name,
                    amountCents: row.amount,
                })));
            }
            return result;
        }
        const rows = await this.productPriceRepository.find(where, {
            populate,
            orderBy: [{ setAt: 'desc' }, { amount: plan.orderByAmount ?? 'desc' }],
            limit: plan.limit ?? DEFAULT_ROW_LIMIT,
        });
        return {
            entity: 'productPrices',
            rowCount: rows.length,
            totals: { count: rows.length },
            rows: rows.map((row) => ({
                id: row.id,
                date: dateOf(row),
                amountCents: row.amount,
                label: label(row),
            })),
        };
    }
    async resolveNameIds(repository, names) {
        if (!names || names.length === 0)
            return undefined;
        const wanted = new Set(names.map((name) => name.toLowerCase()));
        const all = await repository.findAll();
        const ids = all
            .filter((entity) => wanted.has(entity.name.toLowerCase()))
            .map((entity) => entity.id);
        return ids.length > 0 ? ids : null;
    }
    async resolveGroupIds(names) {
        if (!names || names.length === 0)
            return undefined;
        const wanted = new Set(names.map((name) => name.toLowerCase()));
        const all = await this.groupRepository.findAll();
        const ids = all
            .filter((group) => wanted.has(group.groupName.toLowerCase()) ||
            wanted.has(group.originalFileName.toLowerCase()))
            .map((group) => group.id);
        return ids.length > 0 ? ids : null;
    }
    async resolveProductIds(plan) {
        const hasProductNames = !!plan.productNames && plan.productNames.length > 0;
        const hasBrandNames = !!plan.brandNames && plan.brandNames.length > 0;
        if (!hasProductNames && !hasBrandNames)
            return undefined;
        const productWanted = hasProductNames
            ? new Set(plan.productNames.map((name) => name.toLowerCase()))
            : undefined;
        const brandWanted = hasBrandNames
            ? new Set(plan.brandNames.map((name) => name.toLowerCase()))
            : undefined;
        const products = await this.productRepository.findAll({
            populate: ['brand'],
        });
        const ids = products
            .filter((product) => (!productWanted || productWanted.has(product.name.toLowerCase())) &&
            (!brandWanted || brandWanted.has(product.brand.name.toLowerCase())))
            .map((product) => product.id);
        return ids.length > 0 ? ids : null;
    }
};
QueryExecutor = __decorate([
    Injectable(),
    __param(0, InjectRepository(Transaction)),
    __param(1, InjectRepository(TransactionCategory)),
    __param(2, InjectRepository(TransactionGroup)),
    __param(3, InjectRepository(Product)),
    __param(4, InjectRepository(ProductPrice)),
    __param(5, InjectRepository(Brand)),
    __metadata("design:paramtypes", [EntityRepository,
        EntityRepository,
        EntityRepository,
        EntityRepository,
        EntityRepository,
        EntityRepository])
], QueryExecutor);
export { QueryExecutor };
function emptyResult(entity) {
    return { entity, rowCount: 0, totals: { count: 0 }, rows: [] };
}
function computeTotals(amounts) {
    const count = amounts.length;
    if (count === 0)
        return { count: 0 };
    const sumCents = amounts.reduce((total, amount) => total + amount, 0);
    return {
        count,
        sumCents,
        avgCents: Math.round(sumCents / count),
        minCents: Math.min(...amounts),
        maxCents: Math.max(...amounts),
    };
}
function computeGroups(entries) {
    const buckets = new Map();
    for (const entry of entries) {
        const bucket = buckets.get(entry.key) ?? { count: 0, sumCents: 0 };
        bucket.count++;
        bucket.sumCents += entry.amountCents;
        buckets.set(entry.key, bucket);
    }
    return [...buckets.entries()]
        .map(([key, { count, sumCents }]) => ({
        key,
        count,
        sumCents,
        avgCents: Math.round(sumCents / count),
    }))
        .sort((a, b) => b.sumCents - a.sumCents);
}
//# sourceMappingURL=query-executor.js.map