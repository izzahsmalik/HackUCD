import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { TransactionCategoriesService } from './transaction-categories.service.js';
import type { CreateTransactionCategoryDto, UpdateTransactionCategoryDto } from './dto/transaction-category.dto.js';

@Controller('transaction-categories')
export class TransactionCategoriesController {
  constructor(private readonly transactionCategoriesService: TransactionCategoriesService) {}

  @Get()
  findAll() {
    return this.transactionCategoriesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.transactionCategoriesService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateTransactionCategoryDto) {
    return this.transactionCategoriesService.create(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateTransactionCategoryDto) {
    return this.transactionCategoriesService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.transactionCategoriesService.remove(id);
  }
}