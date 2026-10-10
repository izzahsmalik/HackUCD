import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@mikro-orm/nestjs';
import { Brand } from '../brands/brand.entity.js';
import { Product } from './product.entity.js';
import { ProductPrice } from './product-price.entity.js';
import { ProductsController } from './products.controller.js';
import { ProductsService } from './products.service.js';

const entityManager = {
  persist: vi.fn(),
  remove: vi.fn(),
  flush: vi.fn(),
};
entityManager.persist.mockReturnValue(entityManager);
entityManager.remove.mockReturnValue(entityManager);

const productRepository = {
  findAll: vi.fn(),
  findOne: vi.fn(),
  create: vi.fn(),
  assign: vi.fn(),
  find: vi.fn(),
  getEntityManager: vi.fn(() => entityManager),
};

const brandRepository = {
  findOne: vi.fn(),
};

const productPriceRepository = {
  find: vi.fn(),
};

describe('ProductsController', () => {
  let controller: ProductsController;

  beforeEach(async () => {
    vi.clearAllMocks();
    entityManager.persist.mockReturnValue(entityManager);
    entityManager.remove.mockReturnValue(entityManager);
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [
        ProductsService,
        { provide: getRepositoryToken(Product), useValue: productRepository },
        { provide: getRepositoryToken(Brand), useValue: brandRepository },
        {
          provide: getRepositoryToken(ProductPrice),
          useValue: productPriceRepository,
        },
      ],
    }).compile();

    controller = moduleRef.get<ProductsController>(ProductsController);
  });

  describe('findAll', () => {
    it('returns all products with brand populated', async () => {
      productRepository.findAll.mockResolvedValue([
        { id: 1, name: 'Coffee', brand: { id: 1, name: 'Acme' } },
      ]);
      await expect(controller.findAll()).resolves.toHaveLength(1);
      expect(productRepository.findAll).toHaveBeenCalledWith({
        populate: ['brand'],
      });
    });
  });

  describe('findOne', () => {
    it('returns the product when it exists', async () => {
      productRepository.findOne.mockResolvedValue({
        id: 1,
        name: 'Coffee',
        brand: { id: 1, name: 'Acme' },
      });
      await expect(controller.findOne(1)).resolves.toMatchObject({ id: 1 });
      expect(productRepository.findOne).toHaveBeenCalledWith(
        { id: 1 },
        { populate: ['brand'] },
      );
    });

    it('throws NotFoundException for an unknown id', async () => {
      productRepository.findOne.mockResolvedValue(null);
      await expect(controller.findOne(99)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findPrices', () => {
    it('returns price history most recent first', async () => {
      productRepository.findOne.mockResolvedValue({ id: 1, name: 'Coffee' });
      const prices = [{ id: 1, amount: 450, setAt: new Date() }];
      productPriceRepository.find.mockResolvedValue(prices);
      await expect(controller.findPrices(1)).resolves.toEqual(prices);
      expect(productPriceRepository.find).toHaveBeenCalledWith(
        { product: { id: 1, name: 'Coffee' } },
        { orderBy: { setAt: 'desc' } },
      );
    });

    it('throws NotFoundException for an unknown id', async () => {
      productRepository.findOne.mockResolvedValue(null);
      await expect(controller.findPrices(99)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('persists and returns the new product', async () => {
      const created = { id: 1, name: 'Coffee', brand: { id: 1, name: 'Acme' } };
      productRepository.create.mockReturnValue(created);
      brandRepository.findOne.mockResolvedValue({ id: 1, name: 'Acme' });
      await expect(
        controller.create({ name: 'Coffee', brandId: 1 }),
      ).resolves.toEqual(created);
    });

    it('rejects an empty name', async () => {
      await expect(
        controller.create({ name: '  ', brandId: 1 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects a missing brandId', async () => {
      await expect(
        controller.create({ name: 'Coffee' } as never),
      ).rejects.toThrow(BadRequestException);
      expect(brandRepository.findOne).not.toHaveBeenCalled();
    });

    it('rejects a non-integer brandId', async () => {
      await expect(
        controller.create({ name: 'Coffee', brandId: 1.5 }),
      ).rejects.toThrow(BadRequestException);
      expect(brandRepository.findOne).not.toHaveBeenCalled();
    });

    it('rejects an unknown brand', async () => {
      brandRepository.findOne.mockResolvedValue(null);
      await expect(
        controller.create({ name: 'Coffee', brandId: 99 }),
      ).rejects.toThrow('Brand #99 does not exist');
    });
  });

  describe('update', () => {
    it('assigns the patch and flushes', async () => {
      const product = { id: 1, name: 'Coffee', brand: { id: 1, name: 'Acme' } };
      productRepository.findOne.mockResolvedValue(product);
      await controller.update(1, { name: 'Espresso' });
      expect(productRepository.assign).toHaveBeenCalledWith(product, {
        name: 'Espresso',
      });
    });

    it('patches the brand when brandId is provided', async () => {
      const product = { id: 1, name: 'Coffee', brand: { id: 1, name: 'Acme' } };
      productRepository.findOne.mockResolvedValue(product);
      brandRepository.findOne.mockResolvedValue({ id: 2, name: 'Other' });
      await controller.update(1, { brandId: 2 });
      expect(productRepository.assign).toHaveBeenCalledWith(product, {
        brand: { id: 2, name: 'Other' },
      });
    });

    it('throws NotFoundException for an unknown id', async () => {
      productRepository.findOne.mockResolvedValue(null);
      await expect(controller.update(99, { name: 'Espresso' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('rejects an unknown brand', async () => {
      productRepository.findOne.mockResolvedValue({
        id: 1,
        name: 'Coffee',
        brand: { id: 1, name: 'Acme' },
      });
      brandRepository.findOne.mockResolvedValue(null);
      await expect(controller.update(1, { brandId: 99 })).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('remove', () => {
    it('removes the product', async () => {
      productRepository.findOne.mockResolvedValue({
        id: 1,
        name: 'Coffee',
        brand: { id: 1, name: 'Acme' },
      });
      await expect(controller.remove(1)).resolves.toBeUndefined();
    });
  });
});
