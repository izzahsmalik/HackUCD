import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { EntityRepository } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Product } from '../products/product.entity.js';
import { Brand } from './brand.entity.js';
import type { CreateBrandDto, UpdateBrandDto } from './dto/brand.dto.js';

@Injectable()
export class BrandsService {
  constructor(
    @InjectRepository(Brand)
    private readonly brandRepository: EntityRepository<Brand>,
    @InjectRepository(Product)
    private readonly productRepository: EntityRepository<Product>,
  ) {}

  findAll(): Promise<Brand[]> {
    return this.brandRepository.findAll();
  }

  async findOne(id: number): Promise<Brand> {
    const brand = await this.brandRepository.findOne({ id });
    if (!brand) throw new NotFoundException(`Brand #${id} not found`);
    return brand;
  }

  async create(dto: CreateBrandDto): Promise<Brand> {
    this.validate(dto);
    const brand = this.brandRepository.create({ name: dto.name });
    await this.brandRepository.getEntityManager().persist(brand).flush();
    return brand;
  }

  async update(id: number, dto: UpdateBrandDto): Promise<Brand> {
    const brand = await this.findOne(id);
    this.validate({ name: dto.name ?? brand.name });
    this.brandRepository.assign(brand, dto);
    await this.brandRepository.getEntityManager().flush();
    return brand;
  }

  async remove(id: number): Promise<void> {
    const brand = await this.findOne(id);
    const productCount = await this.productRepository.count({ brand: id });
    if (productCount > 0) {
      throw new BadRequestException(
        `Cannot delete brand #${id}: ${productCount} product(s) still reference it`,
      );
    }
    await this.brandRepository.getEntityManager().remove(brand).flush();
  }

  private validate(dto: { name: string }): void {
    if (typeof dto.name !== 'string' || dto.name.trim().length === 0) {
      throw new BadRequestException('name must be a non-empty string');
    }
  }
}