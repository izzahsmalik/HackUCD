var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { ForbiddenException, Injectable, } from '@nestjs/common';
import { PremiumService } from './premium.service.js';
let PremiumGuard = class PremiumGuard {
    premiumService;
    constructor(premiumService) {
        this.premiumService = premiumService;
    }
    async canActivate(_context) {
        if (await this.premiumService.getIsPremium()) {
            return true;
        }
        throw new ForbiddenException('This feature requires premium');
    }
};
PremiumGuard = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [PremiumService])
], PremiumGuard);
export { PremiumGuard };
//# sourceMappingURL=premium.guard.js.map