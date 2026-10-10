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
import { BadRequestException, Body, Controller, Get, Param, ParseIntPipe, Post, } from '@nestjs/common';
import { ActionQueueService } from './action-queue.service.js';
let ActionQueueController = class ActionQueueController {
    actionQueueService;
    constructor(actionQueueService) {
        this.actionQueueService = actionQueueService;
    }
    list() {
        return this.actionQueueService.list();
    }
    get(id) {
        return this.actionQueueService.get(id);
    }
    async resolve(id, dto) {
        if (typeof dto?.actionId !== 'string' || dto.actionId.trim().length === 0) {
            throw new BadRequestException('actionId must be a non-empty string');
        }
        return this.actionQueueService.resolve(id, dto.actionId, dto.payload);
    }
};
__decorate([
    Get(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ActionQueueController.prototype, "list", null);
__decorate([
    Get(':id'),
    __param(0, Param('id', ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], ActionQueueController.prototype, "get", null);
__decorate([
    Post(':id/resolve'),
    __param(0, Param('id', ParseIntPipe)),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], ActionQueueController.prototype, "resolve", null);
ActionQueueController = __decorate([
    Controller('action-queue'),
    __metadata("design:paramtypes", [ActionQueueService])
], ActionQueueController);
export { ActionQueueController };
//# sourceMappingURL=action-queue.controller.js.map