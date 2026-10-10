import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { TransactionGroupsService } from './transaction-groups.service.js';

@Controller('transaction-groups')
export class TransactionGroupsController {
  constructor(
    private readonly transactionGroupsService: TransactionGroupsService,
  ) {}

  @Get()
  findAll() {
    return this.transactionGroupsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.transactionGroupsService.findOne(id);
  }
}
