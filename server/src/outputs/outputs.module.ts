import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Product } from '../products/product.entity.js';
import { ProductPrice } from '../products/product-price.entity.js';
import { Output } from './output.entity.js';
import { OutputPrice } from './output-price.entity.js';
import { OutputsController } from './outputs.controller.js';
import { OutputsService } from './outputs.service.js';

@Module({
  imports: [
    MikroOrmModule.forFeature([Output, Product, ProductPrice, OutputPrice]),
  ],
  controllers: [OutputsController],
  providers: [OutputsService],
  exports: [OutputsService],
})
export class OutputsModule {}
