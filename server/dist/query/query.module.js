var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { Brand } from '../brands/brand.entity.js';
import { Product } from '../products/product.entity.js';
import { ProductPrice } from '../products/product-price.entity.js';
import { Transaction } from '../transactions/transaction.entity.js';
import { TransactionCategory } from '../transactions/transaction-category.entity.js';
import { TransactionGroup } from '../transactions/transaction-group.entity.js';
import { LlmModule } from '../llm/llm.module.js';
import { QueryController } from './query.controller.js';
import { QueryExecutor } from './query-executor.js';
import { QueryService } from './query.service.js';
let QueryModule = class QueryModule {
};
QueryModule = __decorate([
    Module({
        imports: [
            MikroOrmModule.forFeature([
                Transaction,
                TransactionCategory,
                TransactionGroup,
                Product,
                ProductPrice,
                Brand,
            ]),
            LlmModule,
        ],
        controllers: [QueryController],
        providers: [QueryExecutor, QueryService],
        exports: [QueryService, QueryExecutor],
    })
], QueryModule);
export { QueryModule };
//# sourceMappingURL=query.module.js.map