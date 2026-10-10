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
import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, } from '@nestjs/common';
import { OutputsService } from './outputs.service.js';
let OutputsController = class OutputsController {
    outputsService;
    constructor(outputsService) {
        this.outputsService = outputsService;
    }
    findAll() {
        return this.outputsService.findAll();
    }
    findMargins() {
        return this.outputsService.getMargins();
    }
    findOne(id) {
        return this.outputsService.findOne(id);
    }
    findPrices(id) {
        return this.outputsService.getPriceHistory(id);
    }
    findCost(id) {
        return this.outputsService.getCost(id);
    }
    create(dto) {
        return this.outputsService.create(dto);
    }
    createPrice(id, dto) {
        return this.outputsService.createPrice(id, dto);
    }
    update(id, dto) {
        return this.outputsService.update(id, dto);
    }
    remove(id) {
        return this.outputsService.remove(id);
    }
};
__decorate([
    Get(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], OutputsController.prototype, "findAll", null);
__decorate([
    Get('margins'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], OutputsController.prototype, "findMargins", null);
__decorate([
    Get(':id'),
    __param(0, Param('id', ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], OutputsController.prototype, "findOne", null);
__decorate([
    Get(':id/prices'),
    __param(0, Param('id', ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], OutputsController.prototype, "findPrices", null);
__decorate([
    Get(':id/cost'),
    __param(0, Param('id', ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], OutputsController.prototype, "findCost", null);
__decorate([
    Post(),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], OutputsController.prototype, "create", null);
__decorate([
    Post(':id/prices'),
    __param(0, Param('id', ParseIntPipe)),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], OutputsController.prototype, "createPrice", null);
__decorate([
    Patch(':id'),
    __param(0, Param('id', ParseIntPipe)),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], OutputsController.prototype, "update", null);
__decorate([
    Delete(':id'),
    __param(0, Param('id', ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], OutputsController.prototype, "remove", null);
OutputsController = __decorate([
    Controller('outputs'),
    __metadata("design:paramtypes", [OutputsService])
], OutputsController);
export { OutputsController };
//# sourceMappingURL=outputs.controller.js.map