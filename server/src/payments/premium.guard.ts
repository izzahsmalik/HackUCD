import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { PremiumService } from './premium.service.js';

/**
 * Gate for premium-only features. Registered and exported by PaymentsModule
 * for future adoption but intentionally not attached to any route yet.
 */
@Injectable()
export class PremiumGuard implements CanActivate {
  constructor(private readonly premiumService: PremiumService) {}

  async canActivate(_context: ExecutionContext): Promise<boolean> {
    if (await this.premiumService.getIsPremium()) {
      return true;
    }
    throw new ForbiddenException('This feature requires premium');
  }
}
