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
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { EntityRepository } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Product } from '../products/product.entity.js';
import { Brand } from './brand.entity.js';
let BrandsService = class BrandsService {
    brandRepository;
    productRepository;
    constructor(brandRepository, productRepository) {
        this.brandRepository = brandRepository;
        this.productRepository = productRepository;
    }
    findAll() {
        return this.brandRepository.findAll();
    }
    async findOne(id) {
        const brand = await this.brandRepository.findOne({ id });
        if (!brand)
            throw new NotFoundException(`Brand #${id} not found`);
        return brand;
    }
    async create(dto) {
        this.validate(dto);
        const brand = this.brandRepository.create({ name: dto.name });
        await this.brandRepository.getEntityManager().persist(brand).flush();
        return brand;
    }
    async update(id, dto) {
        const brand = await this.findOne(id);
        this.validate({ name: dto.name ?? brand.name });
        this.brandRepository.assign(brand, dto);
        await this.brandRepository.getEntityManager().flush();
        return brand;
    }
    async remove(id) {
        const brand = await this.findOne(id);
        const productCount = await this.productRepository.count({ brand: id });
        if (productCount > 0) {
            throw new BadRequestException(`Cannot delete brand #${id}: ${productCount} product(s) still reference it`);
        }
        await this.brandRepository.getEntityManager().remove(brand).flush();
    }
    validate(dto) {
        if (typeof dto.name !== 'string' || dto.name.trim().length === 0) {
            throw new BadRequestException('name must be a non-empty string');
        }
    }
};
BrandsService = __decorate([
    Injectable(),
    __param(0, InjectRepository(Brand)),
    __param(1, InjectRepository(Product)),
    __metadata("design:paramtypes", [EntityRepository,
        EntityRepository])
], BrandsService);
export { BrandsService };
//# sourceMappingURL=brands.service.js.map