import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EntityRepository } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { TransactionCategory } from './transaction-category.entity.js';
import { TransactionGroup } from './transaction-group.entity.js';
import { Transaction } from './transaction.entity.js';
import type {
  CreateTransactionDto,
  UpdateTransactionDto,
} from './dto/transaction.dto.js';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: EntityRepository<Transaction>,
    @InjectRepository(TransactionCategory)
    private readonly categoryRepository: EntityRepository<TransactionCategory>,
    @InjectRepository(TransactionGroup)
    private readonly groupRepository: EntityRepository<TransactionGroup>,
  ) {}

  findAll(): Promise<Transaction[]> {
    return this.transactionRepository.findAll({
      populate: ['category', 'group'],
    });
  }

  async findOne(id: number): Promise<Transaction> {
    const transaction = await this.transactionRepository.findOne(
      { id },
      { populate: ['category', 'group'] },
    );
    if (!transaction)
      throw new NotFoundException(`Transaction #${id} not found`);
    return transaction;
  }

  async create(dto: CreateTransactionDto): Promise<Transaction> {
    this.validate(dto, true);
    const category = await this.categoryOrThrow(dto.categoryId);
    const group = await this.groupOrThrow(dto.groupId);
    const transaction = this.transactionRepository.create({
      amount: dto.amount,
      date: dto.date,
      category,
      group,
    });
    await this.transactionRepository
      .getEntityManager()
      .persist(transaction)
      .flush();
    return transaction;
  }

  async update(id: number, dto: UpdateTransactionDto): Promise<Transaction> {
    const transaction = await this.findOne(id);
    this.validate({
      amount: dto.amount ?? transaction.amount,
      date: dto.date ?? transaction.date,
      categoryId: dto.categoryId,
      groupId: dto.groupId,
    });
    const data: {
      amount?: number;
      date?: string;
      category?: TransactionCategory;
      group?: TransactionGroup;
    } = {};
    if (dto.amount !== undefined) data.amount = dto.amount;
    if (dto.date !== undefined) data.date = dto.date;
    if (dto.categoryId !== undefined)
      data.category = await this.categoryOrThrow(dto.categoryId);
    if (dto.groupId !== undefined)
      data.group = await this.groupOrThrow(dto.groupId);
    this.transactionRepository.assign(transaction, data);
    await this.transactionRepository.getEntityManager().flush();
    return transaction;
  }

  async remove(id: number): Promise<void> {
    const transaction = await this.findOne(id);
    await this.transactionRepository
      .getEntityManager()
      .remove(transaction)
      .flush();
  }

  private async categoryOrThrow(
    categoryId: number,
  ): Promise<TransactionCategory> {
    const category = await this.categoryRepository.findOne({ id: categoryId });
    if (!category)
      throw new BadRequestException(
        `Transaction category #${categoryId} does not exist`,
      );
    return category;
  }

  private async groupOrThrow(groupId: number): Promise<TransactionGroup> {
    const group = await this.groupRepository.findOne({ id: groupId });
    if (!group)
      throw new BadRequestException(
        `Transaction group #${groupId} does not exist`,
      );
    return group;
  }

  private validate(
    dto: {
      amount: number;
      date: string;
      categoryId?: number;
      groupId?: number;
    },
    requireIds = false,
  ): void {
    if (!Number.isInteger(dto.amount)) {
      throw new BadRequestException('amount must be an integer (cents)');
    }
    if (
      typeof dto.date !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}$/.test(dto.date) ||
      Number.isNaN(new Date(dto.date).getTime())
    ) {
      throw new BadRequestException(
        'date must be a valid date string (YYYY-MM-DD)',
      );
    }
    if (
      (requireIds || dto.categoryId !== undefined) &&
      (!Number.isInteger(dto.categoryId) || dto.categoryId! <= 0)
    ) {
      throw new BadRequestException('categoryId must be a positive integer');
    }
    if (
      (requireIds || dto.groupId !== undefined) &&
      (!Number.isInteger(dto.groupId) || dto.groupId! <= 0)
    ) {
      throw new BadRequestException('groupId must be a positive integer');
    }
  }
}
