var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { BadRequestException, Injectable, NotFoundException, } from '@nestjs/common';
import { EntityRepository } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Product } from '../products/product.entity.js';
import { ProductPrice } from '../products/product-price.entity.js';
import { Output } from './output.entity.js';
import { OutputPrice } from './output-price.entity.js';
let OutputsService = class OutputsService {
    outputRepository;
    productRepository;
    productPriceRepository;
    outputPriceRepository;
    constructor(outputRepository, productRepository, productPriceRepository, outputPriceRepository) {
        this.outputRepository = outputRepository;
        this.productRepository = productRepository;
        this.productPriceRepository = productPriceRepository;
        this.outputPriceRepository = outputPriceRepository;
    }
    findAll() {
        return this.outputRepository.findAll({ populate: ['products'] });
    }
    async findOne(id) {
        const output = await this.outputRepository.findOne({ id }, { populate: ['products'] });
        if (!output)
            throw new NotFoundException(`Output #${id} not found`);
        return output;
    }
    async create(dto) {
        this.validateName(dto.name);
        const products = await this.productsOrThrow(dto.productIds ?? []);
        const output = this.outputRepository.create({ name: dto.name, products });
        await this.outputRepository.getEntityManager().persist(output).flush();
        return output;
    }
    async update(id, dto) {
        const output = await this.findOne(id);
        if (dto.name !== undefined)
            this.validateName(dto.name);
        const data = {};
        if (dto.name !== undefined)
            data.name = dto.name;
        if (dto.productIds !== undefined) {
            data.products = await this.productsOrThrow(dto.productIds);
        }
        this.outputRepository.assign(output, data);
        await this.outputRepository.getEntityManager().flush();
        return output;
    }
    async remove(id) {
        const output = await this.findOne(id);
        await this.outputRepository.getEntityManager().remove(output).flush();
    }
    async getPriceHistory(id) {
        const output = await this.findOne(id);
        return this.outputPriceRepository.find({ output }, { orderBy: { setAt: 'desc' } });
    }
    async createPrice(id, dto) {
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
    async getCost(id) {
        const output = await this.findOne(id);
        const productIds = output.products
            .getItems()
            .map((product) => product.id);
        const productPrices = productIds.length
            ? await this.productPriceRepository.find({ product: { id: { $in: productIds } } }, { orderBy: { setAt: 'desc' } })
            : [];
        const outputPrices = await this.outputPriceRepository.find({ output: { id } }, { orderBy: { setAt: 'desc' } });
        const { latestProductPrices, productTotalCents } = latestPerProduct(productPrices);
        const salePriceCents = outputPrices[0]?.amount ?? null;
        return {
            outputId: id,
            productTotalCents,
            salePriceCents,
            margin: marginOf(productTotalCents, salePriceCents),
            latestProductPrices,
        };
    }
    async getMargins() {
        const outputs = await this.findAll();
        if (outputs.length === 0)
            return [];
        const productIds = [
            ...new Set(outputs.flatMap((output) => output.products.getItems().map((product) => product.id))),
        ];
        const productPrices = productIds.length
            ? await this.productPriceRepository.find({ product: { id: { $in: productIds } } }, { orderBy: { setAt: 'desc' } })
            : [];
        const outputPrices = await this.outputPriceRepository.find({ output: { id: { $in: outputs.map((output) => output.id) } } }, { orderBy: { setAt: 'desc' } });
        const { latestProductPrices, productTotalByProduct } = latestPerProduct(productPrices);
        const productTotals = new Map();
        for (const [productId, total] of productTotalByProduct) {
            productTotals.set(productId, total);
        }
        const salePriceByOutput = new Map();
        for (const price of outputPrices) {
            if (salePriceByOutput.has(price.output.id))
                continue;
            salePriceByOutput.set(price.output.id, price.amount);
        }
        return outputs.map((output) => {
            const productCostCents = output.products
                .getItems()
                .reduce((sum, product) => sum + (productTotals.get(product.id) ?? 0), 0);
            const salePriceCents = salePriceByOutput.get(output.id) ?? null;
            return {
                outputId: output.id,
                name: output.name,
                productCostCents,
                salePriceCents,
                margin: marginOf(productCostCents, salePriceCents),
                latestProductPrices: latestProductPrices.filter((price) => output.products.getItems().some((product) => product.id === price.productId)),
            };
        });
    }
    validateName(name) {
        if (typeof name !== 'string' || name.trim().length === 0) {
            throw new BadRequestException('name must be a non-empty string');
        }
    }
    async productsOrThrow(productIds) {
        if (!Array.isArray(productIds) ||
            !productIds.every((id) => Number.isInteger(id) && id > 0) ||
            new Set(productIds).size !== productIds.length) {
            throw new BadRequestException('productIds must be distinct positive integers');
        }
        if (productIds.length === 0)
            return [];
        const products = await this.productRepository.find({
            id: { $in: productIds },
        });
        if (products.length !== productIds.length) {
            const missing = productIds.filter((id) => !products.some((product) => product.id === id));
            throw new BadRequestException(`Products not found: ${missing.join(', ')}`);
        }
        return products;
    }
};
OutputsService = __decorate([
    Injectable(),
    __param(0, InjectRepository(Output)),
    __param(1, InjectRepository(Product)),
    __param(2, InjectRepository(ProductPrice)),
    __param(3, InjectRepository(OutputPrice)),
    __metadata("design:paramtypes", [EntityRepository,
        EntityRepository,
        EntityRepository,
        EntityRepository])
], OutputsService);
export { OutputsService };
function latestPerProduct(productPrices) {
    const seen = new Set();
    const latestProductPrices = [];
    const productTotalByProduct = new Map();
    for (const price of productPrices) {
        if (seen.has(price.product.id))
            continue;
        seen.add(price.product.id);
        productTotalByProduct.set(price.product.id, price.amount);
        latestProductPrices.push({
            productId: price.product.id,
            productName: price.product.name,
            amountCents: price.amount,
            setAt: price.setAt,
        });
    }
    const productTotalCents = [...productTotalByProduct.values()].reduce((sum, amount) => sum + amount, 0);
    return { latestProductPrices, productTotalCents, productTotalByProduct };
}
function marginOf(productTotalCents, salePriceCents) {
    if (salePriceCents === null || salePriceCents <= 0)
        return null;
    return (salePriceCents - productTotalCents) / salePriceCents;
}
//# sourceMappingURL=outputs.service.js.map