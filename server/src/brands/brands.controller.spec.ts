import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@mikro-orm/nestjs';
import { Product } from '../products/product.entity.js';
import { Brand } from './brand.entity.js';
import { BrandsController } from './brands.controller.js';
import { BrandsService } from './brands.service.js';

const entityManager = {
  persist: vi.fn(),
  remove: vi.fn(),
  flush: vi.fn(),
};
entityManager.persist.mockReturnValue(entityManager);
entityManager.remove.mockReturnValue(entityManager);

const brandRepository = {
  findAll: vi.fn(),
  findOne: vi.fn(),
  create: vi.fn(),
  assign: vi.fn(),
  getEntityManager: vi.fn(() => entityManager),
};

const productRepository = {
  count: vi.fn(),
};

describe('BrandsController', () => {
  let controller: BrandsController;

  beforeEach(async () => {
    vi.clearAllMocks();
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [BrandsController],
      providers: [
        BrandsService,
        { provide: getRepositoryToken(Brand), useValue: brandRepository },
        { provide: getRepositoryToken(Product), useValue: productRepository },
      ],
    }).compile();

    controller = moduleRef.get<BrandsController>(BrandsController);
  });

  describe('findAll', () => {
    it('returns all brands', async () => {
      brandRepository.findAll.mockResolvedValue([{ id: 1, name: 'Acme' }]);
      await expect(controller.findAll()).resolves.toHaveLength(1);
    });
  });

  describe('findOne', () => {
    it('returns the brand when it exists', async () => {
      brandRepository.findOne.mockResolvedValue({ id: 1, name: 'Acme' });
      await expect(controller.findOne(1)).resolves.toEqual({ id: 1, name: 'Acme' });
    });

    it('throws NotFoundException for an unknown id', async () => {
      brandRepository.findOne.mockResolvedValue(null);
      await expect(controller.findOne(99)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('persists and returns the new brand', async () => {
      const created = { id: 1, name: 'Acme' };
      brandRepository.create.mockReturnValue(created);
      await expect(controller.create({ name: 'Acme' })).resolves.toEqual(created);
    });

    it('rejects an empty name', async () => {
      await expect(controller.create({ name: '  ' })).rejects.toThrow(BadRequestException);
    });
  });

  describe('update', () => {
    it('assigns the patch and flushes', async () => {
      const brand = { id: 1, name: 'Acme' };
      brandRepository.findOne.mockResolvedValue(brand);
      await controller.update(1, { name: 'Acme Corp' });
      expect(brandRepository.assign).toHaveBeenCalledWith(brand, { name: 'Acme Corp' });
    });

    it('throws NotFoundException for an unknown id', async () => {
      brandRepository.findOne.mockResolvedValue(null);
      await expect(controller.update(99, { name: 'Acme Corp' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('rejects an empty name', async () => {
      brandRepository.findOne.mockResolvedValue({ id: 1, name: 'Acme' });
      await expect(controller.update(1, { name: ' ' })).rejects.toThrow(BadRequestException);
    });
  });

  describe('remove', () => {
    it('removes the brand when no products reference it', async () => {
      brandRepository.findOne.mockResolvedValue({ id: 1, name: 'Acme' });
      productRepository.count.mockResolvedValue(0);
      await expect(controller.remove(1)).resolves.toBeUndefined();
    });

    it('rejects deleting a brand that still has products', async () => {
      brandRepository.findOne.mockResolvedValue({ id: 1, name: 'Acme' });
      productRepository.count.mockResolvedValue(3);
      await expect(controller.remove(1)).rejects.toThrow('3 product(s) still reference it');
      expect(entityManager.remove).not.toHaveBeenCalled();
    });
  });
});