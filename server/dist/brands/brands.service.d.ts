import { EntityRepository } from '@mikro-orm/core';
import { Product } from '../products/product.entity.js';
import { Brand } from './brand.entity.js';
import type { CreateBrandDto, UpdateBrandDto } from './dto/brand.dto.js';
export declare class BrandsService {
    private readonly brandRepository;
    private readonly productRepository;
    constructor(brandRepository: EntityRepository<Brand>, productRepository: EntityRepository<Product>);
    findAll(): Promise<Brand[]>;
    findOne(id: number): Promise<Brand>;
    create(dto: CreateBrandDto): Promise<Brand>;
    update(id: number, dto: UpdateBrandDto): Promise<Brand>;
    remove(id: number): Promise<void>;
    private validate;
}
