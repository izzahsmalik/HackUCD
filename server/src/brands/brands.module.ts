import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Brand } from './brand.entity.js';
import { Product } from '../products/product.entity.js';
import { BrandsController } from './brands.controller.js';
import { BrandsService } from './brands.service.js';

@Module({
  imports: [MikroOrmModule.forFeature([Brand, Product])],
  controllers: [BrandsController],
  providers: [BrandsService],
})
export class BrandsModule {}
