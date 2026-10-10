var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { TransactionCategoriesService } from './transaction-categories.service.js';
let TransactionCategoriesController = class TransactionCategoriesController {
    transactionCategoriesService;
    constructor(transactionCategoriesService) {
        this.transactionCategoriesService = transactionCategoriesService;
    }
    findAll() {
        return this.transactionCategoriesService.findAll();
    }
    findOne(id) {
        return this.transactionCategoriesService.findOne(id);
    }
    create(dto) {
        return this.transactionCategoriesService.create(dto);
    }
    update(id, dto) {
        return this.transactionCategoriesService.update(id, dto);
    }
    remove(id) {
        return this.transactionCategoriesService.remove(id);
    }
};
__decorate([
    Get(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], TransactionCategoriesController.prototype, "findAll", null);
__decorate([
    Get(':id'),
    __param(0, Param('id', ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], TransactionCategoriesController.prototype, "findOne", null);
__decorate([
    Post(),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TransactionCategoriesController.prototype, "create", null);
__decorate([
    Patch(':id'),
    __param(0, Param('id', ParseIntPipe)),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], TransactionCategoriesController.prototype, "update", null);
__decorate([
    Delete(':id'),
    __param(0, Param('id', ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], TransactionCategoriesController.prototype, "remove", null);
TransactionCategoriesController = __decorate([
    Controller('transaction-categories'),
    __metadata("design:paramtypes", [TransactionCategoriesService])
], TransactionCategoriesController);
export { TransactionCategoriesController };
//# sourceMappingURL=transaction-categories.controller.js.map