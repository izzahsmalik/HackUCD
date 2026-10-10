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
import { Brand } from '../brands/brand.entity.js';
import { Product } from './product.entity.js';
import { ProductPrice } from './product-price.entity.js';
let ProductsService = class ProductsService {
    productRepository;
    brandRepository;
    productPriceRepository;
    constructor(productRepository, brandRepository, productPriceRepository) {
        this.productRepository = productRepository;
        this.brandRepository = brandRepository;
        this.productPriceRepository = productPriceRepository;
    }
    findAll() {
        return this.productRepository.findAll({ populate: ['brand'] });
    }
    async findOne(id) {
        const product = await this.productRepository.findOne({ id }, { populate: ['brand'] });
        if (!product)
            throw new NotFoundException(`Product #${id} not found`);
        return product;
    }
    async create(dto) {
        this.validate(dto, true);
        const brand = await this.brandOrThrow(dto.brandId);
        const product = this.productRepository.create({ name: dto.name, brand });
        await this.productRepository.getEntityManager().persist(product).flush();
        return product;
    }
    async update(id, dto) {
        const product = await this.findOne(id);
        this.validate({
            name: dto.name ?? product.name,
            brandId: dto.brandId,
        });
        const data = {};
        if (dto.name !== undefined)
            data.name = dto.name;
        if (dto.brandId !== undefined)
            data.brand = await this.brandOrThrow(dto.brandId);
        this.productRepository.assign(product, data);
        await this.productRepository.getEntityManager().flush();
        return product;
    }
    async remove(id) {
        const product = await this.findOne(id);
        await this.productRepository.getEntityManager().remove(product).flush();
    }
    async getPriceHistory(id) {
        const product = await this.findOne(id);
        return this.productPriceRepository.find({ product }, { orderBy: { setAt: 'desc' } });
    }
    async brandOrThrow(brandId) {
        const brand = await this.brandRepository.findOne({ id: brandId });
        if (!brand)
            throw new BadRequestException(`Brand #${brandId} does not exist`);
        return brand;
    }
    validate(dto, requireBrandId = false) {
        if (typeof dto.name !== 'string' || dto.name.trim().length === 0) {
            throw new BadRequestException('name must be a non-empty string');
        }
        if ((requireBrandId || dto.brandId !== undefined) &&
            (!Number.isInteger(dto.brandId) || dto.brandId <= 0)) {
            throw new BadRequestException('brandId must be a positive integer');
        }
    }
};
ProductsService = __decorate([
    Injectable(),
    __param(0, InjectRepository(Product)),
    __param(1, InjectRepository(Brand)),
    __param(2, InjectRepository(ProductPrice)),
    __metadata("design:paramtypes", [EntityRepository,
        EntityRepository,
        EntityRepository])
], ProductsService);
export { ProductsService };
//# sourceMappingURL=products.service.js.map