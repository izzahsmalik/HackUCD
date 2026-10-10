import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EntityRepository } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Product } from '../products/product.entity.js';
import { ProductPrice } from '../products/product-price.entity.js';import { Output } from './output.entity.js';
import { OutputPrice } from './output-price.entity.js';
import type {
  CreateOutputDto,
  CreateOutputPriceDto,
  UpdateOutputDto,
} from './dto/output.dto.js';

/** The most recent ProductPrice for one dependent product. */
export interface LatestProductPrice {
  productId: number;
  productName: string;
  amountCents: number;
  setAt: Date;
}

/**
 * Cost breakdown for an output: the latest product prices (the cost side)
 * plus the latest output price, which is what the output sells for.
 */
export interface OutputCost {
  outputId: number;
  productTotalCents: number;
  salePriceCents: number | null;
  /** (salePrice − productTotal) / salePrice; null when unpriced or free. */
  margin: number | null;
  latestProductPrices: LatestProductPrice[];
}

/** One row of the batched margins view for all outputs. */
export interface OutputMarginRow {
  outputId: number;
  name: string;
  productCostCents: number;
  salePriceCents: number | null;
  margin: number | null;
  latestProductPrices: LatestProductPrice[];
}

@Injectable()
export class OutputsService {
  constructor(
    @InjectRepository(Output)
    private readonly outputRepository: EntityRepository<Output>,
    @InjectRepository(Product)
    private readonly productRepository: EntityRepository<Product>,
    @InjectRepository(ProductPrice)
    private readonly productPriceRepository: EntityRepository<ProductPrice>,
    @InjectRepository(OutputPrice)
    private readonly outputPriceRepository: EntityRepository<OutputPrice>,
  ) {}

  findAll(): Promise<Output[]> {
    return this.outputRepository.findAll({ populate: ['products'] });
  }

  async findOne(id: number): Promise<Output> {
    const output = await this.outputRepository.findOne(
      { id },
      { populate: ['products'] },
    );
    if (!output) throw new NotFoundException(`Output #${id} not found`);
    return output;
  }

  async create(dto: CreateOutputDto): Promise<Output> {
    this.validateName(dto.name);
    const products = await this.productsOrThrow(dto.productIds ?? []);
    const output = this.outputRepository.create({ name: dto.name, products });
    await this.outputRepository.getEntityManager().persist(output).flush();
    return output;
  }

  async update(id: number, dto: UpdateOutputDto): Promise<Output> {
    const output = await this.findOne(id);
    if (dto.name !== undefined) this.validateName(dto.name);
    const data: { name?: string; products?: Product[] } = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.productIds !== undefined) {
      data.products = await this.productsOrThrow(dto.productIds);
    }
    this.outputRepository.assign(output, data);
    await this.outputRepository.getEntityManager().flush();
    return output;
  }

  async remove(id: number): Promise<void> {
    const output = await this.findOne(id);
    await this.outputRepository.getEntityManager().remove(output).flush();
  }

  /** Price history for an output, most recent first. */
  async getPriceHistory(id: number): Promise<OutputPrice[]> {
    const output = await this.findOne(id);
    return this.outputPriceRepository.find(
      { output },
      { orderBy: { setAt: 'desc' } },
    );
  }

  async createPrice(id: number, dto: CreateOutputPriceDto): Promise<OutputPrice> {
    if (!Number.isInteger(dto.amount) || dto.amount < 0) {
      throw new BadRequestException('amount must be an integer >= 0 (cents)');
    }
    const setAt = dto.setAt === undefined ? new Date() : new Date(dto.setAt);
    if (Number.isNaN(setAt.getTime())) {
      throw new BadRequestException('setAt must be a valid datetime');
    }
    const output = await this.findOne(id);
    const price = this.outputPriceRepository.create({ amount: dto.amount, setAt, output });
    await this.outputPriceRepository.getEntityManager().persist(price).flush();
    return price;
  }

  /**
   * Cost of the output: the latest ProductPrice for each dependent product,
   * with the latest OutputPrice as the sale price and the resulting margin.
   */
  async getCost(id: number): Promise<OutputCost> {
    const output = await this.findOne(id);
    const productIds = output.products
      .getItems()
      .map((product) => product.id);

    const productPrices: ProductPrice[] = productIds.length
      ? await this.productPriceRepository.find(
          { product: { id: { $in: productIds } } },
          { orderBy: { setAt: 'desc' } },
        )
      : [];
    const outputPrices: OutputPrice[] = await this.outputPriceRepository.find(
      { output: { id } },
      { orderBy: { setAt: 'desc' } },
    );

    const { latestProductPrices, productTotalCents } =
      latestPerProduct(productPrices);

    const salePriceCents = outputPrices[0]?.amount ?? null;
    return {
      outputId: id,
      productTotalCents,
      salePriceCents,
      margin: marginOf(productTotalCents, salePriceCents),
      latestProductPrices,
    };
  }

  /**
   * Margins for every output in a fixed number of queries: one findAll plus
   * one batched price query per side. Backs GET /outputs/margins.
   */
  async getMargins(): Promise<OutputMarginRow[]> {
    const outputs = await this.findAll();
    if (outputs.length === 0) return [];

    const productIds = [
      ...new Set(
        outputs.flatMap((output) =>
          output.products.getItems().map((product) => product.id),
        ),
      ),
    ];
    const productPrices: ProductPrice[] = productIds.length
      ? await this.productPriceRepository.find(
          { product: { id: { $in: productIds } } },
          { orderBy: { setAt: 'desc' } },
        )
      : [];
    const outputPrices: OutputPrice[] = await this.outputPriceRepository.find(
      { output: { id: { $in: outputs.map((output) => output.id) } } },
      { orderBy: { setAt: 'desc' } },
    );

    const { latestProductPrices, productTotalByProduct } =
      latestPerProduct(productPrices);
    const productTotals = new Map<number, number>();
    for (const [productId, total] of productTotalByProduct) {
      productTotals.set(productId, total);
    }

    // OutputPrice rows are also ordered setAt desc: first row per output wins.
    const salePriceByOutput = new Map<number, number>();
    for (const price of outputPrices) {
      if (salePriceByOutput.has(price.output.id)) continue;
      salePriceByOutput.set(price.output.id, price.amount);
    }

    return outputs.map((output) => {
      const productCostCents = output.products
        .getItems()
        .reduce(
          (sum, product) => sum + (productTotals.get(product.id) ?? 0),
          0,
        );
      const salePriceCents = salePriceByOutput.get(output.id) ?? null;
      return {
        outputId: output.id,
        name: output.name,
        productCostCents,
        salePriceCents,
        margin: marginOf(productCostCents, salePriceCents),
        latestProductPrices: latestProductPrices.filter((price) =>
          output.products.getItems().some((product) => product.id === price.productId),
        ),
      };
    });
  }

  private validateName(name: string): void {
    if (typeof name !== 'string' || name.trim().length === 0) {
      throw new BadRequestException('name must be a non-empty string');
    }
  }

  private async productsOrThrow(productIds: number[]): Promise<Product[]> {
    if (
      !Array.isArray(productIds) ||
      !productIds.every((id) => Number.isInteger(id) && id > 0) ||
      new Set(productIds).size !== productIds.length
    ) {
      throw new BadRequestException(
        'productIds must be distinct positive integers',
      );
    }
    if (productIds.length === 0) return [];
    const products = await this.productRepository.find({
      id: { $in: productIds },
    });
    if (products.length !== productIds.length) {
      const missing = productIds.filter(
        (id) => !products.some((product) => product.id === id),
      );
      throw new BadRequestException(`Products not found: ${missing.join(', ')}`);
    }
    return products;
  }
}

/**
 * Prices are ordered setAt desc, so the first row seen per product is the
 * latest. Returns the deduped breakdown plus totals by product and overall.
 */
function latestPerProduct(productPrices: ProductPrice[]): {
  latestProductPrices: LatestProductPrice[];
  productTotalCents: number;
  productTotalByProduct: Map<number, number>;
} {
  const seen = new Set<number>();
  const latestProductPrices: LatestProductPrice[] = [];
  const productTotalByProduct = new Map<number, number>();
  for (const price of productPrices) {
    if (seen.has(price.product.id)) continue;
    seen.add(price.product.id);
    productTotalByProduct.set(price.product.id, price.amount);
    latestProductPrices.push({
      productId: price.product.id,
      productName: price.product.name,
      amountCents: price.amount,
      setAt: price.setAt,
    });
  }
  const productTotalCents = [...productTotalByProduct.values()].reduce(
    (sum, amount) => sum + amount,
    0,
  );
  return { latestProductPrices, productTotalCents, productTotalByProduct };
}

/** Margin as a share of the sale price; null when unpriced or free. */
function marginOf(
  productTotalCents: number,
  salePriceCents: number | null,
): number | null {
  if (salePriceCents === null || salePriceCents <= 0) return null;
  return (salePriceCents - productTotalCents) / salePriceCents;
}
