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
import { Transaction } from './transaction.entity.js';
import { TransactionCategory } from './transaction-category.entity.js';
let TransactionCategoriesService = class TransactionCategoriesService {
    categoryRepository;
    transactionRepository;
    constructor(categoryRepository, transactionRepository) {
        this.categoryRepository = categoryRepository;
        this.transactionRepository = transactionRepository;
    }
    findAll() {
        return this.categoryRepository.findAll();
    }
    async findOne(id) {
        const category = await this.categoryRepository.findOne({ id });
        if (!category)
            throw new NotFoundException(`Transaction category #${id} not found`);
        return category;
    }
    async create(dto) {
        this.validate(dto);
        const category = this.categoryRepository.create({ name: dto.name });
        await this.categoryRepository.getEntityManager().persist(category).flush();
        return category;
    }
    async update(id, dto) {
        const category = await this.findOne(id);
        this.validate({ name: dto.name ?? category.name });
        this.categoryRepository.assign(category, dto);
        await this.categoryRepository.getEntityManager().flush();
        return category;
    }
    async remove(id) {
        const category = await this.findOne(id);
        const transactionCount = await this.transactionRepository.count({ category: id });
        if (transactionCount > 0) {
            throw new BadRequestException(`Cannot delete transaction category #${id}: ${transactionCount} transaction(s) still reference it`);
        }
        await this.categoryRepository.getEntityManager().remove(category).flush();
    }
    validate(dto) {
        if (typeof dto.name !== 'string' || dto.name.trim().length === 0) {
            throw new BadRequestException('name must be a non-empty string');
        }
    }
};
TransactionCategoriesService = __decorate([
    Injectable(),
    __param(0, InjectRepository(TransactionCategory)),
    __param(1, InjectRepository(Transaction)),
    __metadata("design:paramtypes", [EntityRepository,
        EntityRepository])
], TransactionCategoriesService);
export { TransactionCategoriesService };
//# sourceMappingURL=transaction-categories.service.js.map