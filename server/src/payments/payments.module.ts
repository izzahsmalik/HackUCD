import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { AppSetting } from './app-setting.entity.js';
import { PaymentsController } from './payments.controller.js';
import { PaymentsService } from './payments.service.js';
import { PremiumGuard } from './premium.guard.js';
import { PremiumService } from './premium.service.js';
import { StripeClient } from './stripe.client.js';

/**
 * Free/premium tiers: the global isPremium flag (PremiumService/PremiumGuard)
 * and the Stripe integration that flips it (PaymentsService + webhook).
 * PremiumGuard is exported for future use but not attached to any route yet.
 */
@Module({
  imports: [MikroOrmModule.forFeature([AppSetting])],
  controllers: [PaymentsController],
  providers: [
    {
      provide: StripeClient,
      useFactory: () =>
        new StripeClient({
          // Missing keys are tolerated: the client throws StripeConfigurationError
          // lazily so the app (and e2e tests) can boot without Stripe config.
          apiKey: process.env.STRIPE_SECRET_KEY ?? null,
          webhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? null,
          ...(process.env.STRIPE_API_BASE_URL && {
            apiBaseUrl: process.env.STRIPE_API_BASE_URL,
          }),
          fetchImpl: globalThis.fetch.bind(globalThis),
        }),
    },
    PremiumService,
    PaymentsService,
    PremiumGuard,
  ],
  // StripeClient is exported so e2e tests can override it.
  exports: [StripeClient, PremiumService, PremiumGuard],
})
export class PaymentsModule {}
