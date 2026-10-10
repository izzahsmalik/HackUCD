import { EntityRepository } from '@mikro-orm/core';
import { Brand } from '../brands/brand.entity.js';
import { Product } from '../products/product.entity.js';
import { ProductPrice } from '../products/product-price.entity.js';
import { Transaction } from '../transactions/transaction.entity.js';
import { TransactionCategory } from '../transactions/transaction-category.entity.js';
import { TransactionGroup } from '../transactions/transaction-group.entity.js';
import { QueryExecutor } from './query-executor.js';
import { ProductPriceQueryPlan, TransactionQueryPlan } from './query-plan.js';

function makeRepos() {
  return {
    transactionRepository: { find: vi.fn() },
    categoryRepository: { findAll: vi.fn() },
    groupRepository: { findAll: vi.fn() },
    productRepository: { findAll: vi.fn() },
    productPriceRepository: { find: vi.fn() },
    brandRepository: { findAll: vi.fn() },
  };
}

type Repos = ReturnType<typeof makeRepos>;

function makeExecutor(repos: Repos): QueryExecutor {
  return new QueryExecutor(
    repos.transactionRepository as unknown as EntityRepository<Transaction>,
    repos.categoryRepository as unknown as EntityRepository<TransactionCategory>,
    repos.groupRepository as unknown as EntityRepository<TransactionGroup>,
    repos.productRepository as unknown as EntityRepository<Product>,
    repos.productPriceRepository as unknown as EntityRepository<ProductPrice>,
    repos.brandRepository as unknown as EntityRepository<Brand>,
  );
}

function transactionRow(
  id: number,
  amount: number,
  date: string,
  categoryName: string,
  groupName: string,
) {
  return {
    id,
    amount,
    date,
    category: { id: 1, name: categoryName },
    group: { id: 1, groupName },
  };
}

describe('QueryExecutor', () => {
  let repos: Repos;
  let executor: QueryExecutor;

  beforeEach(() => {
    repos = makeRepos();
    executor = makeExecutor(repos);
  });

  describe('transactions', () => {
    it('resolves category names case-insensitively into an $in filter', async () => {
      repos.categoryRepository.findAll.mockResolvedValue([
        { id: 1, name: 'Groceries' },
        { id: 2, name: 'Dining' },
      ]);
      repos.transactionRepository.find.mockResolvedValue([]);
      const plan: TransactionQueryPlan = {
        entity: 'transactions',
        categoryNames: ['GROCERIES'],
      };

      await executor.execute(plan);

      expect(repos.transactionRepository.find).toHaveBeenCalledWith(
        { category: { $in: [1] } },
        {
          populate: ['category', 'group'],
          orderBy: [{ date: 'desc' }, { amount: 'desc' }],
          limit: 20,
        },
      );
    });

    it('matches group names against groupName and originalFileName', async () => {
      repos.groupRepository.findAll.mockResolvedValue([
        { id: 5, groupName: 'January card', originalFileName: 'bank.csv' },
      ]);
      repos.transactionRepository.find.mockResolvedValue([]);
      const plan: TransactionQueryPlan = {
        entity: 'transactions',
        groupNames: ['BANK.CSV'],
      };

      await executor.execute(plan);

      expect(repos.transactionRepository.find).toHaveBeenCalledWith(
        { group: { $in: [5] } },
        expect.anything(),
      );
    });

    it('short-circuits to an empty result when a requested name matches nothing', async () => {
      repos.categoryRepository.findAll.mockResolvedValue([
        { id: 1, name: 'Dining' },
      ]);

      const result = await executor.execute({
        entity: 'transactions',
        categoryNames: ['Nonexistent'],
      });

      expect(result).toMatchObject({
        entity: 'transactions',
        rowCount: 0,
        totals: { count: 0 },
        rows: [],
      });
      expect(repos.transactionRepository.find).not.toHaveBeenCalled();
    });

    it('combines date range with the name filters', async () => {
      repos.categoryRepository.findAll.mockResolvedValue([
        { id: 2, name: 'Dining' },
      ]);
      repos.transactionRepository.find.mockResolvedValue([]);
      const plan: TransactionQueryPlan = {
        entity: 'transactions',
        dateFrom: '2026-01-01',
        dateTo: '2026-01-31',
        categoryNames: ['dining'],
      };

      await executor.execute(plan);

      expect(repos.transactionRepository.find).toHaveBeenCalledWith(
        {
          date: { $gte: '2026-01-01', $lte: '2026-01-31' },
          category: { $in: [2] },
        },
        expect.anything(),
      );
    });

    it('aggregates sums over all matching rows, preserving negative expenses', async () => {
      repos.transactionRepository.find.mockResolvedValue([
        transactionRow(1, 1000, '2026-01-01', 'Salary', 'Income'),
        transactionRow(2, -500, '2026-01-02', 'Groceries', 'January card'),
        transactionRow(3, 250, '2026-01-03', 'Refunds', 'Income'),
      ]);
      const plan: TransactionQueryPlan = {
        entity: 'transactions',
        aggregation: 'sum',
      };

      const result = await executor.execute(plan);

      expect(result.totals).toEqual({
        count: 3,
        sumCents: 750,
        avgCents: 250,
        minCents: -500,
        maxCents: 1000,
      });
      expect(result.groups).toBeUndefined();
    });

    it('buckets by category sorted by sum desc when groupBy is set', async () => {
      repos.transactionRepository.find.mockResolvedValue([
        transactionRow(1, 100, '2026-01-01', 'Dining', 'Card'),
        transactionRow(2, 900, '2026-01-02', 'Groceries', 'Card'),
        transactionRow(3, 300, '2026-01-03', 'Dining', 'Card'),
      ]);
      const plan: TransactionQueryPlan = {
        entity: 'transactions',
        aggregation: 'sum',
        groupBy: 'category',
      };

      const result = await executor.execute(plan);

      expect(result.groups).toEqual(
        [
          { key: 'Dining', count: 2, sumCents: 400, avgCents: 200 },
          { key: 'Groceries', count: 1, sumCents: 900, avgCents: 900 },
        ].sort((a, b) => b.sumCents - a.sumCents),
      );
      expect(result.groups![0]!.key).toBe('Groceries');
    });

    it('returns mapped rows with labels in list mode', async () => {
      repos.transactionRepository.find.mockResolvedValue([
        transactionRow(7, -450, '2026-01-01', 'Dining', 'Card'),
      ]);

      const result = await executor.execute({
        entity: 'transactions',
        limit: 5,
        orderByAmount: 'asc',
      });

      expect(result).toMatchObject({
        rowCount: 1,
        totals: { count: 1 },
        rows: [
          {
            id: 7,
            date: '2026-01-01',
            amountCents: -450,
            label: 'Dining / Card',
          },
        ],
      });
      expect(repos.transactionRepository.find).toHaveBeenCalledWith(
        {},
        {
          populate: ['category', 'group'],
          orderBy: [{ date: 'desc' }, { amount: 'asc' }],
          limit: 5,
        },
      );
    });
  });

  describe('productPrices', () => {
    it('resolves product and brand names into an $in filter', async () => {
      repos.productRepository.findAll.mockResolvedValue([
        { id: 10, name: 'Milk', brand: { id: 1, name: 'Acme' } },
        { id: 11, name: 'Bread', brand: { id: 2, name: 'Bakery' } },
      ]);
      repos.productPriceRepository.find.mockResolvedValue([]);
      const plan: ProductPriceQueryPlan = {
        entity: 'productPrices',
        brandNames: ['ACME'],
      };

      await executor.execute(plan);

      expect(repos.productPriceRepository.find).toHaveBeenCalledWith(
        { product: { $in: [10] } },
        expect.anything(),
      );
    });

    it('combines product and brand filters with AND', async () => {
      repos.productRepository.findAll.mockResolvedValue([
        { id: 10, name: 'Milk', brand: { id: 1, name: 'Acme' } },
        { id: 11, name: 'Milk', brand: { id: 2, name: 'Other' } },
      ]);
      repos.productPriceRepository.find.mockResolvedValue([]);
      const plan: ProductPriceQueryPlan = {
        entity: 'productPrices',
        productNames: ['milk'],
        brandNames: ['other'],
      };

      await executor.execute(plan);

      expect(repos.productPriceRepository.find).toHaveBeenCalledWith(
        { product: { $in: [11] } },
        expect.anything(),
      );
    });

    it('serializes setAt to ISO and labels rows with product (brand)', async () => {
      const setAt = new Date('2026-01-05T10:00:00.000Z');
      repos.productPriceRepository.find.mockResolvedValue([
        {
          id: 3,
          amount: 250,
          setAt,
          product: { name: 'Milk', brand: { name: 'Acme' } },
        },
      ]);

      const result = await executor.execute({ entity: 'productPrices' });

      expect(result.rows).toEqual([
        {
          id: 3,
          date: '2026-01-05T10:00:00.000Z',
          amountCents: 250,
          label: 'Milk (Acme)',
        },
      ]);
    });

    it('buckets by product name when groupBy is product', async () => {
      repos.productPriceRepository.find.mockResolvedValue([
        {
          id: 1,
          amount: 250,
          setAt: new Date(),
          product: { name: 'Milk', brand: { name: 'Acme' } },
        },
        {
          id: 2,
          amount: 260,
          setAt: new Date(),
          product: { name: 'Milk', brand: { name: 'Acme' } },
        },
      ]);
      const plan: ProductPriceQueryPlan = {
        entity: 'productPrices',
        aggregation: 'avg',
        groupBy: 'product',
      };

      const result = await executor.execute(plan);

      expect(result.groups).toEqual([
        { key: 'Milk', count: 2, sumCents: 510, avgCents: 255 },
      ]);
    });

    it('short-circuits when no product matches the name filter', async () => {
      repos.productRepository.findAll.mockResolvedValue([
        { id: 10, name: 'Milk', brand: { id: 1, name: 'Acme' } },
      ]);

      const result = await executor.execute({
        entity: 'productPrices',
        productNames: ['Bread'],
      });

      expect(result).toMatchObject({ rowCount: 0, rows: [] });
      expect(repos.productPriceRepository.find).not.toHaveBeenCalled();
    });
  });
});
