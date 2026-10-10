import { Injectable, NotFoundException } from '@nestjs/common';
import { EntityRepository } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { TransactionGroup } from './transaction-group.entity.js';

@Injectable()
export class TransactionGroupsService {
  constructor(
    @InjectRepository(TransactionGroup)
    private readonly groupRepository: EntityRepository<TransactionGroup>,
  ) {}

  findAll(): Promise<TransactionGroup[]> {
    return this.groupRepository.findAll();
  }

  async findOne(id: number): Promise<TransactionGroup> {
    const group = await this.groupRepository.findOne({ id });
    if (!group)
      throw new NotFoundException(`Transaction group #${id} not found`);
    return group;
  }
}
