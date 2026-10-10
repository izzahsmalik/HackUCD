import { EntityRepository } from '@mikro-orm/core';
import { Product } from '../products/product.entity.js';
import { ProductPrice } from '../products/product-price.entity.js';
import { Output } from './output.entity.js';
import { OutputPrice } from './output-price.entity.js';
import type { CreateOutputDto, CreateOutputPriceDto, UpdateOutputDto } from './dto/output.dto.js';
export interface LatestProductPrice {
    productId: number;
    productName: string;
    amountCents: number;
    setAt: Date;
}
export interface OutputCost {
    outputId: number;
    productTotalCents: number;
    latestOutputPriceCents: number;
    totalCents: number;
    latestProductPrices: LatestProductPrice[];
}
export declare class OutputsService {
    private readonly outputRepository;
    private readonly productRepository;
    private readonly productPriceRepository;
    private readonly outputPriceRepository;
    constructor(outputRepository: EntityRepository<Output>, productRepository: EntityRepository<Product>, productPriceRepository: EntityRepository<ProductPrice>, outputPriceRepository: EntityRepository<OutputPrice>);
    findAll(): Promise<Output[]>;
    findOne(id: number): Promise<Output>;
    create(dto: CreateOutputDto): Promise<Output>;
    update(id: number, dto: UpdateOutputDto): Promise<Output>;
    remove(id: number): Promise<void>;
    getPriceHistory(id: number): Promise<OutputPrice[]>;
    createPrice(id: number, dto: CreateOutputPriceDto): Promise<OutputPrice>;
    getCost(id: number): Promise<OutputCost>;
    private validateName;
    private productsOrThrow;
}
