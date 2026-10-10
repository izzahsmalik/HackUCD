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
        const seen = new Set();
        const latestProductPrices = [];
        let productTotalCents = 0;
        for (const price of productPrices) {
            if (seen.has(price.product.id))
                continue;
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
//# sourceMappingURL=outputs.service.js.map