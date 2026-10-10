import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { OutputsService } from './outputs.service.js';
import type {
  CreateOutputDto,
  CreateOutputPriceDto,
  UpdateOutputDto,
} from './dto/output.dto.js';

@Controller('outputs')
export class OutputsController {
  constructor(private readonly outputsService: OutputsService) {}

  @Get()
  findAll() {
    return this.outputsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.outputsService.findOne(id);
  }

  @Get(':id/prices')
  findPrices(@Param('id', ParseIntPipe) id: number) {
    return this.outputsService.getPriceHistory(id);
  }

  @Get(':id/cost')
  findCost(@Param('id', ParseIntPipe) id: number) {
    return this.outputsService.getCost(id);
  }

  @Post()
  create(@Body() dto: CreateOutputDto) {
    return this.outputsService.create(dto);
  }

  @Post(':id/prices')
  createPrice(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateOutputPriceDto,
  ) {
    return this.outputsService.createPrice(id, dto);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateOutputDto) {
    return this.outputsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.outputsService.remove(id);
  }
}
