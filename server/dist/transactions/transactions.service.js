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
import { TransactionCategory } from './transaction-category.entity.js';
import { Transaction } from './transaction.entity.js';
let TransactionsService = class TransactionsService {
    transactionRepository;
    categoryRepository;
    constructor(transactionRepository, categoryRepository) {
        this.transactionRepository = transactionRepository;
        this.categoryRepository = categoryRepository;
    }
    findAll() {
        return this.transactionRepository.findAll({ populate: ['category'] });
    }
    async findOne(id) {
        const transaction = await this.transactionRepository.findOne({ id }, { populate: ['category'] });
        if (!transaction)
            throw new NotFoundException(`Transaction #${id} not found`);
        return transaction;
    }
    async create(dto) {
        this.validate(dto, true);
        const category = await this.categoryOrThrow(dto.categoryId);
        const transaction = this.transactionRepository.create({
            amount: dto.amount,
            date: dto.date,
            category,
        });
        await this.transactionRepository.getEntityManager().persist(transaction).flush();
        return transaction;
    }
    async update(id, dto) {
        const transaction = await this.findOne(id);
        this.validate({
            amount: dto.amount ?? transaction.amount,
            date: dto.date ?? transaction.date,
            categoryId: dto.categoryId,
        });
        const data = {};
        if (dto.amount !== undefined)
            data.amount = dto.amount;
        if (dto.date !== undefined)
            data.date = dto.date;
        if (dto.categoryId !== undefined)
            data.category = await this.categoryOrThrow(dto.categoryId);
        this.transactionRepository.assign(transaction, data);
        await this.transactionRepository.getEntityManager().flush();
        return transaction;
    }
    async remove(id) {
        const transaction = await this.findOne(id);
        await this.transactionRepository.getEntityManager().remove(transaction).flush();
    }
    async categoryOrThrow(categoryId) {
        const category = await this.categoryRepository.findOne({ id: categoryId });
        if (!category)
            throw new BadRequestException(`Transaction category #${categoryId} does not exist`);
        return category;
    }
    validate(dto, requireCategoryId = false) {
        if (!Number.isInteger(dto.amount)) {
            throw new BadRequestException('amount must be an integer (cents)');
        }
        if (typeof dto.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dto.date) || Number.isNaN(new Date(dto.date).getTime())) {
            throw new BadRequestException('date must be a valid date string (YYYY-MM-DD)');
        }
        if ((requireCategoryId || dto.categoryId !== undefined) && (!Number.isInteger(dto.categoryId) || dto.categoryId <= 0)) {
            throw new BadRequestException('categoryId must be a positive integer');
        }
    }
};
TransactionsService = __decorate([
    Injectable(),
    __param(0, InjectRepository(Transaction)),
    __param(1, InjectRepository(TransactionCategory)),
    __metadata("design:paramtypes", [EntityRepository,
        EntityRepository])
], TransactionsService);
export { TransactionsService };
//# sourceMappingURL=transactions.service.js.map