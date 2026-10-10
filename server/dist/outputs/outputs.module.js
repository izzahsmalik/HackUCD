var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Product } from '../products/product.entity.js';
import { ProductPrice } from '../products/product-price.entity.js';
import { Output } from './output.entity.js';
import { OutputPrice } from './output-price.entity.js';
import { OutputsController } from './outputs.controller.js';
import { OutputsService } from './outputs.service.js';
let OutputsModule = class OutputsModule {
};
OutputsModule = __decorate([
    Module({
        imports: [
            MikroOrmModule.forFeature([Output, Product, ProductPrice, OutputPrice]),
        ],
        controllers: [OutputsController],
        providers: [OutputsService],
        exports: [OutputsService],
    })
], OutputsModule);
export { OutputsModule };
//# sourceMappingURL=outputs.module.js.map