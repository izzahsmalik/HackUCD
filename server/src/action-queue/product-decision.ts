import { BadRequestException } from '@nestjs/common';
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
  /** LLM-suggested product name for a new product */
  productName: string;
  amountCents: number;
  /** Parsed from the CSV, or insertion time if it was missing */
  setAt: Date;
  candidateProducts: ProductCandidate[];
  confidence: number;
}

/** Decision for a pricing CSV row whose product match was not confident. */
export class ProductDecision extends Decision {
  readonly type = 'product';
  readonly summary: string;
  readonly actions: DecisionAction[] = [
    {
      id: 'match-product',
      label: 'Match to an existing product',
      payload: { productId: 'number' },
    },
    {
      id: 'create-product',
      label: 'Create a new product',
      payload: { name: 'string', brandId: 'number' },
    },
    { id: 'discard', label: 'Discard this row' },
  ];

  constructor(
    readonly data: ProductDecisionData,
    private readonly productRepository: EntityRepository<Product>,
    private readonly productPriceRepository: EntityRepository<ProductPrice>,
    private readonly brandRepository: EntityRepository<Brand>,
  ) {
    super();
    this.summary =
      `Pricing row #${data.rowIndex} (${data.productName}, ${(data.amountCents / 100).toFixed(2)}) ` +
      `could not be confidently matched to a product`;
  }

  async apply(
    actionId: string,
    payload?: Record<string, unknown>,
  ): Promise<unknown> {
    switch (actionId) {
      case 'match-product':
        return this.matchProduct(this.payloadNumber(payload, 'productId'));
      case 'create-product':
        return this.createProduct(payload);
      case 'discard':
        return { discarded: true };
      default:
        throw new BadRequestException(
          `Unknown action '${actionId}' for a product decision`,
        );
    }
  }

  private async matchProduct(productId: number): Promise<ProductPrice> {
    const product = await this.productRepository.findOne({ id: productId });
    if (!product)
      throw new BadRequestException(`Product #${productId} does not exist`);
    return this.persistPrice(product);
  }

  private async createProduct(
    payload?: Record<string, unknown>,
  ): Promise<ProductPrice> {
    const name =
      payload?.name !== undefined
        ? this.payloadString(payload, 'name')
        : this.data.productName;
    const brandId = this.payloadNumber(payload, 'brandId');
    const brand = await this.brandRepository.findOne({ id: brandId });
    if (!brand)
      throw new BadRequestException(`Brand #${brandId} does not exist`);
    const product = this.productRepository.create({ name, brand });
    await this.productRepository.getEntityManager().persist(product).flush();
    return this.persistPrice(product);
  }

  private async persistPrice(product: Product): Promise<ProductPrice> {
    const price = this.productPriceRepository.create({
      amount: this.data.amountCents,
      setAt: this.data.setAt,
      product,
    });
    await this.productPriceRepository.getEntityManager().persist(price).flush();
    return price;
  }
}
