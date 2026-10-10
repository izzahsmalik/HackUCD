import { EntityRepository, FilterQuery } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';
import { Brand } from '../brands/brand.entity.js';
import { Product } from '../products/product.entity.js';
import { ProductPrice } from '../products/product-price.entity.js';
import { Transaction } from '../transactions/transaction.entity.js';
import { TransactionCategory } from '../transactions/transaction-category.entity.js';
import { TransactionGroup } from '../transactions/transaction-group.entity.js';
import {
  ProductPriceQueryPlan,
  QueryPlan,
  TransactionQueryPlan,
} from './query-plan.js';

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

const DEFAULT_ROW_LIMIT = 20;

/**
 * Executes a validated query plan against the database. Name filters resolve
 * case-insensitively in JS (no SQL LIKE); aggregation happens in JS too —
 * fine for CSV-import-sized datasets and easy to test with mocked repos.
 */
@Injectable()
export class QueryExecutor {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: EntityRepository<Transaction>,
    @InjectRepository(TransactionCategory)
    private readonly categoryRepository: EntityRepository<TransactionCategory>,
    @InjectRepository(TransactionGroup)
    private readonly groupRepository: EntityRepository<TransactionGroup>,
    @InjectRepository(Product)
    private readonly productRepository: EntityRepository<Product>,
    @InjectRepository(ProductPrice)
    private readonly productPriceRepository: EntityRepository<ProductPrice>,
    @InjectRepository(Brand)
    private readonly brandRepository: EntityRepository<Brand>,
  ) {}

  async execute(plan: QueryPlan): Promise<QueryResult> {
    return plan.entity === 'transactions'
      ? this.executeTransactions(plan)
      : this.executeProductPrices(plan);
  }

  private async executeTransactions(
    plan: TransactionQueryPlan,
  ): Promise<QueryResult> {
    const categoryIds = await this.resolveNameIds(
      this.categoryRepository,
      plan.categoryNames,
    );
    const groupIds = await this.resolveGroupIds(plan.groupNames);
    if (categoryIds === null || groupIds === null) {
      return emptyResult('transactions'); // a requested name matched nothing
    }

    const where: FilterQuery<Transaction> = {};
    const date: Record<string, string> = {};
    if (plan.dateFrom) date.$gte = plan.dateFrom;
    if (plan.dateTo) date.$lte = plan.dateTo;
    if (Object.keys(date).length > 0) where.date = date;
    if (categoryIds) where.category = { $in: categoryIds };
    if (groupIds) where.group = { $in: groupIds };

    const populate = ['category', 'group'] as const;
    if (plan.aggregation || plan.groupBy) {
      const all = await this.transactionRepository.find(where, { populate });
      const amounts = all.map((row) => row.amount);
      const result: QueryResult = {
        entity: 'transactions',
        rowCount: all.length,
        totals: computeTotals(amounts),
        rows: [],
      };
      if (plan.groupBy) {
        result.groups = computeGroups(
          all.map((row) => ({
            key:
              plan.groupBy === 'category'
                ? row.category.name
                : row.group.groupName,
            amountCents: row.amount,
          })),
        );
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

  private async executeProductPrices(
    plan: ProductPriceQueryPlan,
  ): Promise<QueryResult> {
    const productIds = await this.resolveProductIds(plan);
    if (productIds === null) return emptyResult('productPrices');

    const where: FilterQuery<ProductPrice> = {};
    const setAt: Record<string, Date> = {};
    if (plan.setAtFrom) setAt.$gte = new Date(plan.setAtFrom);
    if (plan.setAtTo) setAt.$lte = new Date(plan.setAtTo);
    if (Object.keys(setAt).length > 0) where.setAt = setAt;
    if (productIds) where.product = { $in: productIds };

    const populate = ['product', 'product.brand'] as const;
    const label = (row: ProductPrice) =>
      `${row.product.name} (${row.product.brand.name})`;
    const dateOf = (row: ProductPrice) =>
      row.setAt instanceof Date ? row.setAt.toISOString() : String(row.setAt);

    if (plan.aggregation || plan.groupBy) {
      const all = await this.productPriceRepository.find(where, { populate });
      const amounts = all.map((row) => row.amount);
      const result: QueryResult = {
        entity: 'productPrices',
        rowCount: all.length,
        totals: computeTotals(amounts),
        rows: [],
      };
      if (plan.groupBy) {
        result.groups = computeGroups(
          all.map((row) => ({
            key:
              plan.groupBy === 'product'
                ? row.product.name
                : row.product.brand.name,
            amountCents: row.amount,
          })),
        );
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

  /**
   * Resolves name filters to entity ids. undefined = no filter requested,
   * null = filter requested but nothing matched (caller short-circuits),
   * otherwise the matching ids.
   */
  private async resolveNameIds<T extends { id: number; name: string }>(
    repository: EntityRepository<T>,
    names?: string[],
  ): Promise<number[] | null | undefined> {
    if (!names || names.length === 0) return undefined;
    const wanted = new Set(names.map((name) => name.toLowerCase()));
    const all = await repository.findAll();
    const ids = all
      .filter((entity) => wanted.has(entity.name.toLowerCase()))
      .map((entity) => entity.id);
    return ids.length > 0 ? ids : null;
  }

  /** Groups match either groupName or originalFileName. */
  private async resolveGroupIds(
    names?: string[],
  ): Promise<number[] | null | undefined> {
    if (!names || names.length === 0) return undefined;
    const wanted = new Set(names.map((name) => name.toLowerCase()));
    const all = await this.groupRepository.findAll();
    const ids = all
      .filter(
        (group) =>
          wanted.has(group.groupName.toLowerCase()) ||
          wanted.has(group.originalFileName.toLowerCase()),
      )
      .map((group) => group.id);
    return ids.length > 0 ? ids : null;
  }

  /** Products match the product-name and/or brand-name filter (AND). */
  private async resolveProductIds(
    plan: ProductPriceQueryPlan,
  ): Promise<number[] | null | undefined> {
    const hasProductNames = !!plan.productNames && plan.productNames.length > 0;
    const hasBrandNames = !!plan.brandNames && plan.brandNames.length > 0;
    if (!hasProductNames && !hasBrandNames) return undefined;

    const productWanted = hasProductNames
      ? new Set(plan.productNames!.map((name) => name.toLowerCase()))
      : undefined;
    const brandWanted = hasBrandNames
      ? new Set(plan.brandNames!.map((name) => name.toLowerCase()))
      : undefined;

    const products = await this.productRepository.findAll({
      populate: ['brand'],
    });
    const ids = products
      .filter(
        (product) =>
          (!productWanted || productWanted.has(product.name.toLowerCase())) &&
          (!brandWanted || brandWanted.has(product.brand.name.toLowerCase())),
      )
      .map((product) => product.id);
    return ids.length > 0 ? ids : null;
  }
}

function emptyResult(entity: QueryResult['entity']): QueryResult {
  return { entity, rowCount: 0, totals: { count: 0 }, rows: [] };
}

function computeTotals(amounts: number[]): QueryResultTotals {
  const count = amounts.length;
  if (count === 0) return { count: 0 };
  const sumCents = amounts.reduce((total, amount) => total + amount, 0);
  return {
    count,
    sumCents,
    avgCents: Math.round(sumCents / count),
    minCents: Math.min(...amounts),
    maxCents: Math.max(...amounts),
  };
}

function computeGroups(
  entries: { key: string; amountCents: number }[],
): QueryResultGroup[] {
  const buckets = new Map<string, { count: number; sumCents: number }>();
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
