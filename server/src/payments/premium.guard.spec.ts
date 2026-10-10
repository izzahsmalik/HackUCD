import { ForbiddenException } from '@nestjs/common';
import { ExecutionContext } from '@nestjs/common';
import { PremiumGuard } from './premium.guard.js';

function makeGuard(isPremium: boolean) {
  const premiumService = { getIsPremium: vi.fn().mockResolvedValue(isPremium) };
  return {
    guard: new PremiumGuard(premiumService as never),
    premiumService,
  };
}

const CONTEXT = {} as ExecutionContext;

describe('PremiumGuard', () => {
  it('allows the request when premium is enabled', async () => {
    const { guard, premiumService } = makeGuard(true);
    await expect(guard.canActivate(CONTEXT)).resolves.toBe(true);
    expect(premiumService.getIsPremium).toHaveBeenCalledTimes(1);
  });

  it('rejects with ForbiddenException when premium is not enabled', async () => {
    const { guard } = makeGuard(false);
    await expect(guard.canActivate(CONTEXT)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });
});
