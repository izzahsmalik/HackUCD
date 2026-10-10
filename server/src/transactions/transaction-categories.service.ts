import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { EntityRepository } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Transaction } from './transaction.entity.js';
import { TransactionCategory } from './transaction-category.entity.js';
import type { CreateTransactionCategoryDto, UpdateTransactionCategoryDto } from './dto/transaction-category.dto.js';

@Injectable()
export class TransactionCategoriesService {
  constructor(
    @InjectRepository(TransactionCategory)
    private readonly categoryRepository: EntityRepository<TransactionCategory>,
    @InjectRepository(Transaction)
    private readonly transactionRepository: EntityRepository<Transaction>,
  ) {}

  findAll(): Promise<TransactionCategory[]> {
    return this.categoryRepository.findAll();
  }

  async findOne(id: number): Promise<TransactionCategory> {
    const category = await this.categoryRepository.findOne({ id });
    if (!category) throw new NotFoundException(`Transaction category #${id} not found`);
    return category;
  }

  async create(dto: CreateTransactionCategoryDto): Promise<TransactionCategory> {
    this.validate(dto);
    const category = this.categoryRepository.create({ name: dto.name });
    await this.categoryRepository.getEntityManager().persist(category).flush();
    return category;
  }

  async update(id: number, dto: UpdateTransactionCategoryDto): Promise<TransactionCategory> {
    const category = await this.findOne(id);
    this.validate({ name: dto.name ?? category.name });
    this.categoryRepository.assign(category, dto);
    await this.categoryRepository.getEntityManager().flush();
    return category;
  }

  async remove(id: number): Promise<void> {
    const category = await this.findOne(id);
    const transactionCount = await this.transactionRepository.count({ category: id });
    if (transactionCount > 0) {
      throw new BadRequestException(
        `Cannot delete transaction category #${id}: ${transactionCount} transaction(s) still reference it`,
      );
    }
    await this.categoryRepository.getEntityManager().remove(category).flush();
  }

  private validate(dto: { name: string }): void {
    if (typeof dto.name !== 'string' || dto.name.trim().length === 0) {
      throw new BadRequestException('name must be a non-empty string');
    }
  }
}