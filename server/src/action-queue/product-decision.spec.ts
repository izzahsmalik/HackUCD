import { BadRequestException } from '@nestjs/common';
import { EntityRepository } from '@mikro-orm/core';
import { Product } from '../products/product.entity.js';
import { ProductPrice } from '../products/product-price.entity.js';
import { Brand } from '../brands/brand.entity.js';
import { ProductDecision, ProductDecisionData } from './product-decision.js';

const entityManager = {
  persist: vi.fn(),
  flush: vi.fn(),
};
entityManager.persist.mockReturnValue(entityManager);

interface ProductDecisionRepos {
  productRepository: {
    findOne: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    getEntityManager: ReturnType<typeof vi.fn>;
  };
  productPriceRepository: {
    create: ReturnType<typeof vi.fn>;
    getEntityManager: ReturnType<typeof vi.fn>;
  };
  brandRepository: {
    findOne: ReturnType<typeof vi.fn>;
    getEntityManager: ReturnType<typeof vi.fn>;
  };
}

function makeRepos(): ProductDecisionRepos {
  return {
    productRepository: {
      findOne: vi.fn(),
      create: vi.fn((data) => data),
      getEntityManager: vi.fn(() => entityManager),
    },
    productPriceRepository: {
      create: vi.fn((data) => data),
      getEntityManager: vi.fn(() => entityManager),
    },
    brandRepository: {
      findOne: vi.fn(),
      getEntityManager: vi.fn(() => entityManager),
    },
  };
}

function makeDecision(
  repos: ProductDecisionRepos,
  overrides: Partial<ProductDecisionData> = {},
): ProductDecision {
  const data: ProductDecisionData = {
    rowIndex: 3,
    fileName: 'prices.csv',
    rawRow: { item: 'Coffee', price: '4.50' },
    productName: 'Coffee',
    amountCents: 450,
    setAt: new Date('2026-01-01T00:00:00Z'),
    candidateProducts: [{ id: 1, name: 'Coffee Beans', brandName: 'Acme' }],
    confidence: 0.4,
    ...overrides,
  };
  return new ProductDecision(
    data,
    repos.productRepository as unknown as EntityRepository<Product>,
    repos.productPriceRepository as unknown as EntityRepository<ProductPrice>,
    repos.brandRepository as unknown as EntityRepository<Brand>,
  );
}

describe('ProductDecision', () => {
  it('exposes match/create/discard actions and a summary', () => {
    const decision = makeDecision(makeRepos());
    expect(decision.actions.map((a) => a.id)).toEqual([
      'match-product',
      'create-product',
      'discard',
    ]);
    expect(decision.summary).toContain('row #3');
  });

  it('match-product persists a price on the matched product', async () => {
    const repos = makeRepos();
    repos.productRepository.findOne.mockResolvedValue({
      id: 1,
      name: 'Coffee Beans',
    });
    const decision = makeDecision(repos);
    const price = (await decision.apply('match-product', {
      productId: 1,
    })) as ProductPrice;
    expect(price).toMatchObject({
      amount: 450,
      setAt: new Date('2026-01-01T00:00:00Z'),
      product: { id: 1 },
    });
    expect(repos.productPriceRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 450 }),
    );
  });

  it('match-product rejects an unknown product', async () => {
    const repos = makeRepos();
    repos.productRepository.findOne.mockResolvedValue(null);
    const decision = makeDecision(repos);
    await expect(
      decision.apply('match-product', { productId: 99 }),
    ).rejects.toThrow('Product #99 does not exist');
  });

  it('create-product creates the product (with payload name) then the price', async () => {
    const repos = makeRepos();
    repos.brandRepository.findOne.mockResolvedValue({ id: 2, name: 'Acme' });
    const decision = makeDecision(repos);
    const price = (await decision.apply('create-product', {
      name: 'Coffee Beans',
      brandId: 2,
    })) as ProductPrice;
    expect(repos.productRepository.create).toHaveBeenCalledWith({
      name: 'Coffee Beans',
      brand: { id: 2, name: 'Acme' },
    });
    expect(price.amount).toBe(450);
  });

  it('create-product rejects an unknown brand', async () => {
    const repos = makeRepos();
    repos.brandRepository.findOne.mockResolvedValue(null);
    const decision = makeDecision(repos);
    await expect(
      decision.apply('create-product', { name: 'Coffee', brandId: 99 }),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects a missing payload productId for match-product', async () => {
    const decision = makeDecision(makeRepos());
    await expect(decision.apply('match-product')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('discard resolves without writes', async () => {
    const repos = makeRepos();
    const decision = makeDecision(repos);
    await expect(decision.apply('discard')).resolves.toEqual({
      discarded: true,
    });
    expect(repos.productPriceRepository.create).not.toHaveBeenCalled();
  });

  it('rejects an unknown action', async () => {
    const decision = makeDecision(makeRepos());
    await expect(decision.apply('explode')).rejects.toThrow(
      "Unknown action 'explode'",
    );
  });
});
