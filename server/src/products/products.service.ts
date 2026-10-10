import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EntityRepository } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Brand } from '../brands/brand.entity.js';
import { Product } from './product.entity.js';
import { ProductPrice } from './product-price.entity.js';
import type {
  CreateProductDto,
  CreateProductPriceDto,
  UpdateProductDto,
} from './dto/product.dto.js';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: EntityRepository<Product>,
    @InjectRepository(Brand)
    private readonly brandRepository: EntityRepository<Brand>,
    @InjectRepository(ProductPrice)
    private readonly productPriceRepository: EntityRepository<ProductPrice>,
  ) {}

  findAll(): Promise<Product[]> {
    return this.productRepository.findAll({ populate: ['brand'] });
  }

  async findOne(id: number): Promise<Product> {
    const product = await this.productRepository.findOne(
      { id },
      { populate: ['brand'] },
    );
    if (!product) throw new NotFoundException(`Product #${id} not found`);
    return product;
  }

  async create(dto: CreateProductDto): Promise<Product> {
    this.validate(dto, true);
    const brand = await this.brandOrThrow(dto.brandId);
    const product = this.productRepository.create({ name: dto.name, brand });
    await this.productRepository.getEntityManager().persist(product).flush();
    return product;
  }

  async update(id: number, dto: UpdateProductDto): Promise<Product> {
    const product = await this.findOne(id);
    this.validate({
      name: dto.name ?? product.name,
      brandId: dto.brandId,
    });
    const data: { name?: string; brand?: Brand } = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.brandId !== undefined)
      data.brand = await this.brandOrThrow(dto.brandId);
    this.productRepository.assign(product, data);
    await this.productRepository.getEntityManager().flush();
    return product;
  }

  async remove(id: number): Promise<void> {
    const product = await this.findOne(id);
    await this.productRepository.getEntityManager().remove(product).flush();
  }

  /** Price history for a product, most recent first. */
  async getPriceHistory(id: number): Promise<ProductPrice[]> {
    const product = await this.findOne(id);
    return this.productPriceRepository.find(
      { product },
      { orderBy: { setAt: 'desc' } },
    );
  }

  /** Records a new product price, defaulting setAt to now. */
  async createPrice(
    id: number,
    dto: CreateProductPriceDto,
  ): Promise<ProductPrice> {
    if (!Number.isInteger(dto.amount) || dto.amount < 0) {
      throw new BadRequestException('amount must be an integer >= 0 (cents)');
    }
    const setAt = dto.setAt === undefined ? new Date() : new Date(dto.setAt);
    if (Number.isNaN(setAt.getTime())) {
      throw new BadRequestException('setAt must be a valid datetime');
    }
    const product = await this.findOne(id);
    const price = this.productPriceRepository.create({
      amount: dto.amount,
      setAt,
      product,
    });
    await this.productPriceRepository.getEntityManager().persist(price).flush();
    return price;
  }

  private async brandOrThrow(brandId: number): Promise<Brand> {
    const brand = await this.brandRepository.findOne({ id: brandId });
    if (!brand)
      throw new BadRequestException(`Brand #${brandId} does not exist`);
    return brand;
  }

  private validate(
    dto: { name: string; brandId?: number },
    requireBrandId = false,
  ): void {
    if (typeof dto.name !== 'string' || dto.name.trim().length === 0) {
      throw new BadRequestException('name must be a non-empty string');
    }
    if (
      (requireBrandId || dto.brandId !== undefined) &&
      (!Number.isInteger(dto.brandId) || dto.brandId! <= 0)
    ) {
      throw new BadRequestException('brandId must be a positive integer');
    }
  }
}
