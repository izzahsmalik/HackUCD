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

/** Cost breakdown for an output: its products' latest prices plus its own. */
export interface OutputCost {
  outputId: number;
  productTotalCents: number;
  latestOutputPriceCents: number;
  totalCents: number;
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
   * Cost of the output: the latest ProductPrice for each dependent product
   * plus the latest OutputPrice for the output itself.
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

    // Prices are ordered setAt desc, so the first row seen per product is the latest.
    const seen = new Set<number>();
    const latestProductPrices: LatestProductPrice[] = [];
    let productTotalCents = 0;
    for (const price of productPrices) {
      if (seen.has(price.product.id)) continue;
      seen.add(price.product.id);
      productTotalCents += price.amount;
      latestProductPrices.push({
        productId: price.product.id,
        productName: price.product.name,
        amountCents: price.amount,
        setAt: price.setAt,
      });
    }

    const latestOutputPrice = outputPrices[0];
    const latestOutputPriceCents = latestOutputPrice?.amount ?? 0;
    return {
      outputId: id,
      productTotalCents,
      latestOutputPriceCents,
      totalCents: productTotalCents + latestOutputPriceCents,
      latestProductPrices,
    };
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
