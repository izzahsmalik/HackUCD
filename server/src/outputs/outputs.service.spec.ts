import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@mikro-orm/nestjs';
import { Product } from '../products/product.entity.js';
import { ProductPrice } from '../products/product-price.entity.js';
import { Output } from './output.entity.js';
import { OutputPrice } from './output-price.entity.js';
import { OutputsService } from './outputs.service.js';

const entityManager = {
  persist: vi.fn(),
  remove: vi.fn(),
  flush: vi.fn(),
};
entityManager.persist.mockReturnValue(entityManager);
entityManager.remove.mockReturnValue(entityManager);

const outputRepository = {
  findAll: vi.fn(),
  findOne: vi.fn(),
  create: vi.fn(),
  assign: vi.fn(),
  getEntityManager: vi.fn(() => entityManager),
};

const productRepository = {
  find: vi.fn(),
};

const productPriceRepository = {
  find: vi.fn(),
};

const outputPriceRepository = {
  find: vi.fn(),
  create: vi.fn(),
  getEntityManager: vi.fn(() => entityManager),
};

// Collection stand-in: getCost reads products via getItems().
const collectionOf = (products: Array<{ id: number; name: string }>) => ({
  getItems: () => products,
  isInitialized: () => true,
});

describe('OutputsService', () => {
  let service: OutputsService;

  beforeEach(async () => {
    vi.clearAllMocks();
    entityManager.persist.mockReturnValue(entityManager);
    entityManager.remove.mockReturnValue(entityManager);
    // clearAllMocks keeps prior implementations; give the price repos a clean baseline.
    productPriceRepository.find.mockResolvedValue([]);
    outputPriceRepository.find.mockResolvedValue([]);
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        OutputsService,
        { provide: getRepositoryToken(Output), useValue: outputRepository },
        { provide: getRepositoryToken(Product), useValue: productRepository },
        {
          provide: getRepositoryToken(ProductPrice),
          useValue: productPriceRepository,
        },
        {
          provide: getRepositoryToken(OutputPrice),
          useValue: outputPriceRepository,
        },
      ],
    }).compile();

    service = moduleRef.get<OutputsService>(OutputsService);
  });

  describe('findAll', () => {
    it('returns all outputs with products populated', async () => {
      const outputs = [
        { id: 1, name: 'Espresso', products: collectionOf([]) },
      ];
      outputRepository.findAll.mockResolvedValue(outputs);
      await expect(service.findAll()).resolves.toEqual(outputs);
      expect(outputRepository.findAll).toHaveBeenCalledWith({
        populate: ['products'],
      });
    });
  });

  describe('findOne', () => {
    it('returns the output when it exists', async () => {
      const output = {
        id: 1,
        name: 'Espresso',
        products: collectionOf([{ id: 1, name: 'Coffee' }]),
      };
      outputRepository.findOne.mockResolvedValue(output);
      await expect(service.findOne(1)).resolves.toEqual(output);
      expect(outputRepository.findOne).toHaveBeenCalledWith(
        { id: 1 },
        { populate: ['products'] },
      );
    });

    it('throws NotFoundException for an unknown id', async () => {
      outputRepository.findOne.mockResolvedValue(null);
      await expect(service.findOne(99)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('persists the new output with its resolved products', async () => {
      const products = [{ id: 1, name: 'Coffee' }, { id: 2, name: 'Milk' }];
      productRepository.find.mockResolvedValue(products);
      const created = { id: 1, name: 'Latte', products };
      outputRepository.create.mockReturnValue(created);
      await expect(
        service.create({ name: 'Latte', productIds: [2, 1] }),
      ).resolves.toEqual(created);
      expect(productRepository.find).toHaveBeenCalledWith({
        id: { $in: [2, 1] },
      });
      expect(outputRepository.create).toHaveBeenCalledWith({
        name: 'Latte',
        products,
      });
      expect(entityManager.persist).toHaveBeenCalledWith(created);
      expect(entityManager.flush).toHaveBeenCalled();
    });

    it('creates an output with no products when productIds is omitted', async () => {
      const created = { id: 1, name: 'Latte', products: [] };
      outputRepository.create.mockReturnValue(created);
      await expect(service.create({ name: 'Latte' })).resolves.toEqual(created);
      expect(productRepository.find).not.toHaveBeenCalled();
      expect(outputRepository.create).toHaveBeenCalledWith({
        name: 'Latte',
        products: [],
      });
    });

    it('rejects an empty name', async () => {
      await expect(service.create({ name: '  ' })).rejects.toThrow(
        BadRequestException,
      );
      expect(productRepository.find).not.toHaveBeenCalled();
    });

    it('rejects duplicate product ids', async () => {
      await expect(
        service.create({ name: 'Latte', productIds: [1, 1] }),
      ).rejects.toThrow('productIds must be distinct positive integers');
      expect(productRepository.find).not.toHaveBeenCalled();
    });

    it('rejects non-positive or non-integer product ids', async () => {
      await expect(
        service.create({ name: 'Latte', productIds: [0] }),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.create({ name: 'Latte', productIds: [1.5] }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects a non-array productIds', async () => {
      await expect(
        service.create({ name: 'Latte', productIds: 'nope' as never }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects unknown product ids and persists nothing', async () => {
      productRepository.find.mockResolvedValue([{ id: 1, name: 'Coffee' }]);
      entityManager.persist.mockClear();
      await expect(
        service.create({ name: 'Latte', productIds: [1, 99] }),
      ).rejects.toThrow('Products not found: 99');
      expect(entityManager.persist).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('assigns the name patch and flushes', async () => {
      const output = { id: 1, name: 'Latte', products: collectionOf([]) };
      outputRepository.findOne.mockResolvedValue(output);
      await service.update(1, { name: 'Mocha' });
      expect(outputRepository.assign).toHaveBeenCalledWith(output, {
        name: 'Mocha',
      });
      expect(entityManager.flush).toHaveBeenCalled();
    });

    it('replaces the products list when productIds is provided', async () => {
      const output = { id: 1, name: 'Latte', products: collectionOf([]) };
      const products = [{ id: 3, name: 'Syrup' }];
      outputRepository.findOne.mockResolvedValue(output);
      productRepository.find.mockResolvedValue(products);
      await service.update(1, { productIds: [3] });
      expect(outputRepository.assign).toHaveBeenCalledWith(output, {
        products,
      });
    });

    it('throws NotFoundException for an unknown id', async () => {
      outputRepository.findOne.mockResolvedValue(null);
      await expect(service.update(99, { name: 'Mocha' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('rejects unknown product ids', async () => {
      outputRepository.findOne.mockResolvedValue({
        id: 1,
        name: 'Latte',
        products: collectionOf([]),
      });
      productRepository.find.mockResolvedValue([]);
      await expect(
        service.update(1, { productIds: [7] }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('remove', () => {
    it('removes the output', async () => {
      const output = { id: 1, name: 'Latte', products: collectionOf([]) };
      outputRepository.findOne.mockResolvedValue(output);
      await expect(service.remove(1)).resolves.toBeUndefined();
      expect(entityManager.remove).toHaveBeenCalledWith(output);
      expect(entityManager.flush).toHaveBeenCalled();
    });
  });

  describe('getPriceHistory', () => {
    it('returns prices most recent first', async () => {
      const output = { id: 1, name: 'Latte', products: collectionOf([]) };
      outputRepository.findOne.mockResolvedValue(output);
      const prices = [{ id: 1, amount: 199, setAt: new Date() }];
      outputPriceRepository.find.mockResolvedValue(prices);
      await expect(service.getPriceHistory(1)).resolves.toEqual(prices);
      expect(outputPriceRepository.find).toHaveBeenCalledWith(
        { output },
        { orderBy: { setAt: 'desc' } },
      );
    });

    it('throws NotFoundException for an unknown id', async () => {
      outputRepository.findOne.mockResolvedValue(null);
      await expect(service.getPriceHistory(99)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('createPrice', () => {
    it('persists a price with the given amount and defaults setAt to now', async () => {
      const output = { id: 1, name: 'Latte', products: collectionOf([]) };
      outputRepository.findOne.mockResolvedValue(output);
      const before = Date.now();
      const created = { id: 1, amount: 199, setAt: new Date(), output };
      outputPriceRepository.create.mockReturnValue(created);
      await expect(service.createPrice(1, { amount: 199 })).resolves.toEqual(
        created,
      );
      const [dtoArg] = outputPriceRepository.create.mock.calls[0] as [
        { amount: number; setAt: Date; output: unknown },
      ];
      expect(dtoArg.amount).toBe(199);
      expect(dtoArg.setAt.getTime()).toBeGreaterThanOrEqual(before);
      expect(dtoArg.output).toBe(output);
      expect(entityManager.flush).toHaveBeenCalled();
    });

    it('persists the provided setAt when given', async () => {
      const output = { id: 1, name: 'Latte', products: collectionOf([]) };
      outputRepository.findOne.mockResolvedValue(output);
      outputPriceRepository.create.mockReturnValue({ id: 1 });
      const setAt = new Date('2026-01-01T00:00:00Z');
      await service.createPrice(1, { amount: 199, setAt: setAt.toISOString() });
      const [dtoArg] = outputPriceRepository.create.mock.calls[0] as [
        { setAt: Date },
      ];
      expect(dtoArg.setAt.toISOString()).toBe(setAt.toISOString());
    });

    it('rejects a float amount', async () => {
      await expect(
        service.createPrice(1, { amount: 1.5 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects a negative amount', async () => {
      await expect(
        service.createPrice(1, { amount: -1 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects an invalid setAt', async () => {
      await expect(
        service.createPrice(1, { amount: 199, setAt: 'not-a-date' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getCost', () => {
    it('sums the latest price per product and reports the sale price and margin', async () => {
      const output = {
        id: 1,
        name: 'Latte',
        products: collectionOf([
          { id: 1, name: 'Coffee' },
          { id: 2, name: 'Milk' },
        ]),
      };
      outputRepository.findOne.mockResolvedValue(output);
      // Ordered setAt desc: Coffee has two prices, Milk one.
      const productPrices = [
        { amount: 450, setAt: new Date('2026-02-01'), product: { id: 1, name: 'Coffee' } },
        { amount: 300, setAt: new Date('2026-01-15'), product: { id: 2, name: 'Milk' } },
        { amount: 500, setAt: new Date('2026-01-01'), product: { id: 1, name: 'Coffee' } },
      ];
      productPriceRepository.find.mockResolvedValue(productPrices);
      outputPriceRepository.find.mockResolvedValue([
        { amount: 199, setAt: new Date('2026-02-01') },
        { amount: 149, setAt: new Date('2026-01-01') },
      ]);

      const cost = await service.getCost(1);
      expect(productPriceRepository.find).toHaveBeenCalledWith(
        { product: { id: { $in: [1, 2] } } },
        { orderBy: { setAt: 'desc' } },
      );
      expect(cost.productTotalCents).toBe(750); // 450 + 300, older 500 ignored
      expect(cost.salePriceCents).toBe(199); // latest output price = sale price
      expect(cost.margin).toBeCloseTo((199 - 750) / 199);
      expect(cost.latestProductPrices).toEqual([
        {
          productId: 1,
          productName: 'Coffee',
          amountCents: 450,
          setAt: new Date('2026-02-01'),
        },
        {
          productId: 2,
          productName: 'Milk',
          amountCents: 300,
          setAt: new Date('2026-01-15'),
        },
      ]);
    });

    it('returns null sale price and margin for an output with no products and no prices', async () => {
      outputRepository.findOne.mockResolvedValue({
        id: 2,
        name: 'Plain',
        products: collectionOf([]),
      });
      const cost = await service.getCost(2);
      expect(productPriceRepository.find).not.toHaveBeenCalled();
      expect(cost).toEqual({
        outputId: 2,
        productTotalCents: 0,
        salePriceCents: null,
        margin: null,
        latestProductPrices: [],
      });
    });

    it('treats a missing output price as null margin, not a zero sale price', async () => {
      outputRepository.findOne.mockResolvedValue({
        id: 1,
        name: 'Latte',
        products: collectionOf([{ id: 1, name: 'Coffee' }]),
      });
      productPriceRepository.find.mockResolvedValue([
        { amount: 450, setAt: new Date(), product: { id: 1, name: 'Coffee' } },
      ]);
      outputPriceRepository.find.mockResolvedValue([]);
      const cost = await service.getCost(1);
      expect(cost.productTotalCents).toBe(450);
      expect(cost.salePriceCents).toBeNull();
      expect(cost.margin).toBeNull();
    });

    it('throws NotFoundException for an unknown id', async () => {
      outputRepository.findOne.mockResolvedValue(null);
      await expect(service.getCost(99)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getMargins', () => {
    it('returns one row per output with batched price queries', async () => {
      const outputs = [
        {
          id: 1,
          name: 'Latte',
          products: collectionOf([
            { id: 1, name: 'Coffee' },
            { id: 2, name: 'Milk' },
          ]),
        },
        {
          id: 2,
          name: 'Espresso',
          products: collectionOf([{ id: 1, name: 'Coffee' }]),
        },
      ];
      outputRepository.findAll.mockResolvedValue(outputs);
      productPriceRepository.find.mockResolvedValue([
        { amount: 450, setAt: new Date('2026-02-01'), product: { id: 1, name: 'Coffee' } },
        { amount: 300, setAt: new Date('2026-01-15'), product: { id: 2, name: 'Milk' } },
      ]);
      outputPriceRepository.find.mockResolvedValue([
        { amount: 900, setAt: new Date('2026-02-01'), output: { id: 1 } },
        { amount: 1200, setAt: new Date('2026-01-01'), output: { id: 2 } },
      ]);

      const rows = await service.getMargins();
      expect(productPriceRepository.find).toHaveBeenCalledWith(
        { product: { id: { $in: [1, 2] } } },
        { orderBy: { setAt: 'desc' } },
      );
      expect(outputPriceRepository.find).toHaveBeenCalledWith(
        { output: { id: { $in: [1, 2] } } },
        { orderBy: { setAt: 'desc' } },
      );
      expect(rows).toHaveLength(2);
      expect(rows[0]).toEqual({
        outputId: 1,
        name: 'Latte',
        productCostCents: 750,
        salePriceCents: 900,
        margin: (900 - 750) / 900,
        latestProductPrices: [
          {
            productId: 1,
            productName: 'Coffee',
            amountCents: 450,
            setAt: new Date('2026-02-01'),
          },
          {
            productId: 2,
            productName: 'Milk',
            amountCents: 300,
            setAt: new Date('2026-01-15'),
          },
        ],
      });
      // Espresso shares Coffee only: cost 450, sale 1200.
      expect(rows[1]).toMatchObject({
        outputId: 2,
        productCostCents: 450,
        salePriceCents: 1200,
      });
    });

    it('yields null sale price and margin for an unpriced output', async () => {
      outputRepository.findAll.mockResolvedValue([
        {
          id: 1,
          name: 'Latte',
          products: collectionOf([{ id: 1, name: 'Coffee' }]),
        },
      ]);
      productPriceRepository.find.mockResolvedValue([
        { amount: 450, setAt: new Date(), product: { id: 1, name: 'Coffee' } },
      ]);
      outputPriceRepository.find.mockResolvedValue([]);
      const rows = await service.getMargins();
      expect(rows[0]).toMatchObject({
        productCostCents: 450,
        salePriceCents: null,
        margin: null,
      });
    });

    it('returns an empty array when there are no outputs', async () => {
      outputRepository.findAll.mockResolvedValue([]);
      await expect(service.getMargins()).resolves.toEqual([]);
      expect(productPriceRepository.find).not.toHaveBeenCalled();
      expect(outputPriceRepository.find).not.toHaveBeenCalled();
    });
  });
});
