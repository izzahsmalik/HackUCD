import { EntityRepository } from '@mikro-orm/core';
import { LlmModel } from '../llm/llm.model.js';
import { ActionQueueService } from '../action-queue/action-queue.service.js';
import { Brand } from '../brands/brand.entity.js';
import { Product } from '../products/product.entity.js';
import { ProductPrice } from '../products/product-price.entity.js';
import { ProductsIngestService } from './products-ingest.service.js';

function makeEm() {
  const em = {
    persisted: [] as Record<string, unknown>[],
    nextId: 1,
    persist: vi.fn((entity: Record<string, unknown>) => {
      em.persisted.push(entity);
      return em;
    }),
    flush: vi.fn(async () => {
      for (const entity of em.persisted) {
        if (entity.id === undefined) entity.id = em.nextId++;
      }
    }),
  };
  return em;
}

function makeRepos(em: ReturnType<typeof makeEm>) {
  return {
    productRepository: {
      findAll: vi.fn(),
      create: vi.fn((data) => ({ ...data })),
      getEntityManager: vi.fn(() => em),
    },
    productPriceRepository: {
      create: vi.fn((data) => ({ ...data })),
      getEntityManager: vi.fn(() => em),
    },
    brandRepository: {
      findAll: vi.fn(),
      create: vi.fn((data) => ({ ...data })),
      getEntityManager: vi.fn(() => em),
    },
  };
}

type Repos = ReturnType<typeof makeRepos>;

function makeService(
  repos: Repos,
  llm: { chatJson: ReturnType<typeof vi.fn> },
) {
  return new ProductsIngestService(
    repos.productRepository as unknown as EntityRepository<Product>,
    repos.productPriceRepository as unknown as EntityRepository<ProductPrice>,
    repos.brandRepository as unknown as EntityRepository<Brand>,
    llm as unknown as LlmModel,
    new ActionQueueService(),
  );
}

const coffee = { id: 1, name: 'Coffee', brand: { id: 1, name: 'Acme' } };

describe('ProductsIngestService', () => {
  beforeEach(() => {
    process.env.INGEST_BATCH_SIZE = '25';
  });

  it('records a ProductPrice on the matched product for a confident match', async () => {
    const em = makeEm();
    const repos = makeRepos(em);
    repos.productRepository.findAll.mockResolvedValue([coffee]);
    repos.brandRepository.findAll.mockResolvedValue([{ id: 1, name: 'Acme' }]);
    const llm = {
      chatJson: vi.fn().mockResolvedValue({
        rows: [
          {
            index: 0,
            productName: 'Coffee',
            amountCents: 450,
            setAt: '2026-03-01T00:00:00Z',
            matchProductId: 1,
            confidence: 0.95,
          },
        ],
      }),
    };
    const service = makeService(repos, llm);

    const result = await service.ingest('prices.csv', [
      { item: 'Coffee', price: '4.50' },
    ]);

    expect(result).toMatchObject({
      rowsTotal: 1,
      rowsPersisted: 1,
      decisionsCreated: 0,
      errors: [],
    });
    expect(repos.productPriceRepository.create).toHaveBeenCalledWith({
      amount: 450,
      setAt: new Date('2026-03-01T00:00:00Z'),
      product: coffee,
    });
  });

  it('treats a hallucinated matchProductId as no match and creates the product', async () => {
    const em = makeEm();
    const repos = makeRepos(em);
    repos.productRepository.findAll.mockResolvedValue([coffee]);
    repos.brandRepository.findAll.mockResolvedValue([{ id: 1, name: 'Acme' }]);
    const llm = {
      chatJson: vi.fn().mockResolvedValue({
        rows: [
          {
            index: 0,
            productName: 'Tea',
            amountCents: 300,
            setAt: null,
            matchProductId: 42,
            confidence: 0.95,
          },
        ],
      }),
    };
    const service = makeService(repos, llm);

    const result = await service.ingest('prices.csv', [
      { item: 'Tea', price: '3.00' },
    ]);

    expect(result.rowsPersisted).toBe(1);
    // Product + price were both persisted; the product got the 'Uncategorized' default brand.
    expect(repos.productRepository.create).toHaveBeenCalledWith({
      name: 'Tea',
      brand: { name: 'Uncategorized' },
    });
    expect(em.persisted[0]).toMatchObject({ name: 'Tea' });
  });

  it('uses the CSV brand column for new products, creating the brand once', async () => {
    const em = makeEm();
    const repos = makeRepos(em);
    repos.productRepository.findAll.mockResolvedValue([]);
    repos.brandRepository.findAll.mockResolvedValue([]);
    const llm = {
      chatJson: vi.fn().mockResolvedValue({
        rows: [
          {
            index: 0,
            productName: 'Tea',
            amountCents: 300,
            setAt: null,
            matchProductId: null,
            confidence: 0.95,
          },
          {
            index: 1,
            productName: 'Tea deluxe',
            amountCents: 400,
            setAt: null,
            matchProductId: null,
            confidence: 0.95,
          },
        ],
      }),
    };
    const service = makeService(repos, llm);

    const result = await service.ingest('prices.csv', [
      { item: 'Tea', price: '3.00', brand: 'Shine' },
      { item: 'Tea deluxe', price: '4.00', brand: 'SHINE' },
    ]);

    expect(result.rowsPersisted).toBe(2);
    // Same brand reused across rows (case-insensitive), created exactly once.
    expect(repos.brandRepository.create).toHaveBeenCalledTimes(1);
    expect(repos.brandRepository.create).toHaveBeenCalledWith({
      name: 'Shine',
    });
  });

  it('enqueues a ProductDecision and persists nothing for a low-confidence row', async () => {
    const em = makeEm();
    const repos = makeRepos(em);
    repos.productRepository.findAll.mockResolvedValue([coffee]);
    repos.brandRepository.findAll.mockResolvedValue([{ id: 1, name: 'Acme' }]);
    const llm = {
      chatJson: vi.fn().mockResolvedValue({
        rows: [
          {
            index: 0,
            productName: 'Coffee-ish thing',
            amountCents: 450,
            setAt: null,
            matchProductId: null,
            confidence: 0.4,
          },
        ],
      }),
    };
    const service = makeService(repos, llm);
    const queue = (service as unknown as { actionQueue: ActionQueueService })
      .actionQueue;

    const result = await service.ingest('prices.csv', [
      { item: 'Coffee-ish thing', price: '4.50' },
    ]);

    expect(result).toMatchObject({ rowsPersisted: 0, decisionsCreated: 1 });
    expect(queue.count()).toBe(1);
    const decision = queue.list()[0]!;
    expect(decision.type).toBe('product');
    expect(
      (decision.data as { candidateProducts: unknown[] }).candidateProducts,
    ).toHaveLength(1);
    expect(repos.productPriceRepository.create).not.toHaveBeenCalled();
  });

  it('falls back to insertion time when the CSV has no timestamp', async () => {
    const em = makeEm();
    const repos = makeRepos(em);
    repos.productRepository.findAll.mockResolvedValue([coffee]);
    repos.brandRepository.findAll.mockResolvedValue([{ id: 1, name: 'Acme' }]);
    const llm = {
      chatJson: vi.fn().mockResolvedValue({
        rows: [
          {
            index: 0,
            productName: 'Coffee',
            amountCents: 450,
            setAt: null,
            matchProductId: 1,
            confidence: 0.95,
          },
        ],
      }),
    };
    const service = makeService(repos, llm);
    const before = Date.now();

    await service.ingest('prices.csv', [{ item: 'Coffee', price: '4.50' }]);

    const { setAt } = repos.productPriceRepository.create.mock.calls[0]![0] as {
      setAt: Date;
    };
    expect(setAt.getTime()).toBeGreaterThanOrEqual(before - 1000);
    expect(setAt.getTime()).toBeLessThanOrEqual(Date.now() + 1000);
  });
});
