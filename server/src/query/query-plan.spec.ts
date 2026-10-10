import { validateQueryPlan } from './query-plan.js';

describe('validateQueryPlan', () => {
  it('accepts a minimal transactions plan', () => {
    const result = validateQueryPlan({ entity: 'transactions' });
    expect(result).toEqual({
      ok: true,
      plan: { entity: 'transactions' },
    });
  });

  it('accepts and normalizes a full transactions plan', () => {
    const result = validateQueryPlan({
      entity: 'transactions',
      dateFrom: '2026-01-01',
      dateTo: '2026-01-31',
      categoryNames: [' Groceries ', 'dining'],
      groupNames: ['bank.csv'],
      aggregation: 'sum',
      groupBy: 'category',
      limit: 50,
      orderByAmount: 'asc',
    });
    expect(result).toEqual({
      ok: true,
      plan: {
        entity: 'transactions',
        dateFrom: '2026-01-01',
        dateTo: '2026-01-31',
        categoryNames: ['Groceries', 'dining'],
        groupNames: ['bank.csv'],
        aggregation: 'sum',
        groupBy: 'category',
        limit: 50,
        orderByAmount: 'asc',
      },
    });
  });

  it('accepts a full productPrices plan', () => {
    const result = validateQueryPlan({
      entity: 'productPrices',
      setAtFrom: '2026-01-01T00:00:00.000Z',
      setAtTo: '2026-01-31T23:59:59.999Z',
      productNames: ['Milk'],
      brandNames: ['Acme'],
      aggregation: 'avg',
      groupBy: 'product',
    });
    expect(result.ok).toBe(true);
  });

  it('rejects a non-object value', () => {
    expect(validateQueryPlan(null).ok).toBe(false);
    expect(validateQueryPlan('transactions').ok).toBe(false);
    expect(validateQueryPlan([]).ok).toBe(false);
  });

  it('rejects an unknown entity', () => {
    const result = validateQueryPlan({ entity: 'brands' });
    expect(result).toMatchObject({
      ok: false,
      errors: ["entity must be 'transactions' or 'productPrices'"],
    });
  });

  it('rejects a malformed date', () => {
    const result = validateQueryPlan({
      entity: 'transactions',
      dateFrom: '01/2026',
    });
    expect(result.ok).toBe(false);
    expect((result as { errors: string[] }).errors[0]).toContain('dateFrom');
  });

  it('rejects dateFrom after dateTo', () => {
    const result = validateQueryPlan({
      entity: 'transactions',
      dateFrom: '2026-02-01',
      dateTo: '2026-01-01',
    });
    expect(result.ok).toBe(false);
    expect(
      (result as { errors: string[] }).errors.some((error) =>
        error.includes('dateFrom must not be after dateTo'),
      ),
    ).toBe(true);
  });

  it('rejects product-only fields on a transactions plan', () => {
    const result = validateQueryPlan({
      entity: 'transactions',
      productNames: ['Milk'],
    });
    expect(result.ok).toBe(false);
    expect(
      (result as { errors: string[] }).errors.some((error) =>
        error.includes('productNames'),
      ),
    ).toBe(true);
  });

  it('rejects transaction-only fields on a productPrices plan', () => {
    const result = validateQueryPlan({
      entity: 'productPrices',
      dateFrom: '2026-01-01',
    });
    expect(result.ok).toBe(false);
    expect(
      (result as { errors: string[] }).errors.some((error) =>
        error.includes('dateFrom'),
      ),
    ).toBe(true);
  });

  it('rejects an invalid groupBy for the entity', () => {
    const transactions = validateQueryPlan({
      entity: 'transactions',
      groupBy: 'product',
    });
    expect(transactions.ok).toBe(false);

    const productPrices = validateQueryPlan({
      entity: 'productPrices',
      groupBy: 'category',
    });
    expect(productPrices.ok).toBe(false);
  });

  it('rejects an unknown aggregation', () => {
    const result = validateQueryPlan({
      entity: 'transactions',
      aggregation: 'median',
    });
    expect(result.ok).toBe(false);
  });

  it('rejects an out-of-range or non-integer limit', () => {
    expect(validateQueryPlan({ entity: 'transactions', limit: 0 }).ok).toBe(
      false,
    );
    expect(validateQueryPlan({ entity: 'transactions', limit: 201 }).ok).toBe(
      false,
    );
    expect(validateQueryPlan({ entity: 'transactions', limit: 2.5 }).ok).toBe(
      false,
    );
  });

  it('rejects name arrays containing non-strings', () => {
    const result = validateQueryPlan({
      entity: 'transactions',
      categoryNames: [42],
    });
    expect(result.ok).toBe(false);
  });

  it('rejects setAtFrom after setAtTo', () => {
    const result = validateQueryPlan({
      entity: 'productPrices',
      setAtFrom: '2026-02-01T00:00:00.000Z',
      setAtTo: '2026-01-01T00:00:00.000Z',
    });
    expect(result.ok).toBe(false);
    expect(
      (result as { errors: string[] }).errors.some((error) =>
        error.includes('setAtFrom must not be after setAtTo'),
      ),
    ).toBe(true);
  });

  it('normalizes a valid setAt timestamp to ISO', () => {
    const result = validateQueryPlan({
      entity: 'productPrices',
      setAtFrom: '2026-01-05T12:00:00+02:00',
    });
    expect(result.ok).toBe(true);
    expect((result as { plan: { setAtFrom?: string } }).plan.setAtFrom).toBe(
      '2026-01-05T10:00:00.000Z',
    );
  });
});
