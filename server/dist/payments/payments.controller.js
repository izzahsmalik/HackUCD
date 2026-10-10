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
import { BadRequestException, Body, Controller, ForbiddenException, Get, HttpCode, Post, Req, } from '@nestjs/common';
import { isProduction } from './payments.constants.js';
import { PaymentsService } from './payments.service.js';
let PaymentsController = class PaymentsController {
    paymentsService;
    constructor(paymentsService) {
        this.paymentsService = paymentsService;
    }
    async getStatus() {
        return { isPremium: await this.paymentsService.getIsPremium() };
    }
    createCheckoutSession(dto) {
        validateUrl(dto?.successUrl, 'successUrl');
        validateUrl(dto?.cancelUrl, 'cancelUrl');
        return this.paymentsService.createCheckoutSession(dto);
    }
    handleWebhook(req) {
        if (!req.rawBody || req.rawBody.length === 0) {
            throw new BadRequestException('raw body unavailable');
        }
        const signature = req.headers['stripe-signature'];
        if (typeof signature !== 'string') {
            throw new BadRequestException('stripe-signature header is required');
        }
        return this.paymentsService.handleWebhook(req.rawBody, signature);
    }
    devComplete(dto) {
        if (isProduction()) {
            throw new ForbiddenException('dev payments are disabled in production');
        }
        if (dto?.isPremium !== undefined && typeof dto.isPremium !== 'boolean') {
            throw new BadRequestException('isPremium must be a boolean when provided');
        }
        return this.paymentsService.devComplete(dto?.isPremium ?? true);
    }
};
__decorate([
    Get('status'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "getStatus", null);
__decorate([
    Post('checkout-session'),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PaymentsController.prototype, "createCheckoutSession", null);
__decorate([
    Post('webhook'),
    HttpCode(200),
    __param(0, Req()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PaymentsController.prototype, "handleWebhook", null);
__decorate([
    Post('dev-complete'),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PaymentsController.prototype, "devComplete", null);
PaymentsController = __decorate([
    Controller('payments'),
    __metadata("design:paramtypes", [PaymentsService])
], PaymentsController);
export { PaymentsController };
function validateUrl(value, name) {
    if (value === undefined)
        return;
    if (typeof value !== 'string' || !/^https?:\/\//.test(value)) {
        throw new BadRequestException(`${name} must be an http(s) URL when provided`);
    }
}
//# sourceMappingURL=payments.controller.js.map