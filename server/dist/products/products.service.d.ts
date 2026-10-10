import { EntityRepository } from '@mikro-orm/core';
import { Brand } from '../brands/brand.entity.js';
import { Product } from './product.entity.js';
import { ProductPrice } from './product-price.entity.js';
import type { CreateProductDto, UpdateProductDto } from './dto/product.dto.js';
export declare class ProductsService {
    private readonly productRepository;
    private readonly brandRepository;
    private readonly productPriceRepository;
    constructor(productRepository: EntityRepository<Product>, brandRepository: EntityRepository<Brand>, productPriceRepository: EntityRepository<ProductPrice>);
    findAll(): Promise<Product[]>;
    findOne(id: number): Promise<Product>;
    create(dto: CreateProductDto): Promise<Product>;
    update(id: number, dto: UpdateProductDto): Promise<Product>;
    remove(id: number): Promise<void>;
    getPriceHistory(id: number): Promise<ProductPrice[]>;
    private brandOrThrow;
    private validate;
}
