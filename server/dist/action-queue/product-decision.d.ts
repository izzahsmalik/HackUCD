import { EntityRepository } from '@mikro-orm/core';
import { Brand } from '../brands/brand.entity.js';
import { Product } from '../products/product.entity.js';
import { ProductPrice } from '../products/product-price.entity.js';
import { Decision, DecisionAction } from './decision.js';
export interface ProductCandidate {
    id: number;
    name: string;
    brandName: string;
}
export interface ProductDecisionData {
    rowIndex: number;
    fileName: string;
    rawRow: Record<string, string>;
    productName: string;
    amountCents: number;
    setAt: Date;
    candidateProducts: ProductCandidate[];
    confidence: number;
}
export declare class ProductDecision extends Decision {
    readonly data: ProductDecisionData;
    private readonly productRepository;
    private readonly productPriceRepository;
    private readonly brandRepository;
    readonly type = "product";
    readonly summary: string;
    readonly actions: DecisionAction[];
    constructor(data: ProductDecisionData, productRepository: EntityRepository<Product>, productPriceRepository: EntityRepository<ProductPrice>, brandRepository: EntityRepository<Brand>);
    apply(actionId: string, payload?: Record<string, unknown>): Promise<unknown>;
    private matchProduct;
    private createProduct;
    private persistPrice;
}
