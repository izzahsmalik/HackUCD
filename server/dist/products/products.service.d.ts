import { EntityRepository } from '@mikro-orm/core';
import { Brand } from '../brands/brand.entity.js';
import { Product } from './product.entity.js';
import type { CreateProductDto, UpdateProductDto } from './dto/product.dto.js';
export declare class ProductsService {
    private readonly productRepository;
    private readonly brandRepository;
    constructor(productRepository: EntityRepository<Product>, brandRepository: EntityRepository<Brand>);
    findAll(): Promise<Product[]>;
    findOne(id: number): Promise<Product>;
    create(dto: CreateProductDto): Promise<Product>;
    update(id: number, dto: UpdateProductDto): Promise<Product>;
    remove(id: number): Promise<void>;
    private brandOrThrow;
    private validate;
}
