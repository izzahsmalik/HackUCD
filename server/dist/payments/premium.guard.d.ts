import { CanActivate, ExecutionContext } from '@nestjs/common';
import { PremiumService } from './premium.service.js';
export declare class PremiumGuard implements CanActivate {
    private readonly premiumService;
    constructor(premiumService: PremiumService);
    canActivate(_context: ExecutionContext): Promise<boolean>;
}
