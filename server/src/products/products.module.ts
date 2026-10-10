import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Brand } from '../brands/brand.entity.js';
import { Product } from './product.entity.js';
import { ProductPrice } from './product-price.entity.js';
import { ProductsController } from './products.controller.js';
import { ProductsService } from './products.service.js';

@Module({
  imports: [MikroOrmModule.forFeature([Product, Brand, ProductPrice])],
  controllers: [ProductsController],
  providers: [ProductsService],
})
export class ProductsModule {}
