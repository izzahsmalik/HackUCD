var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { AppSetting } from './app-setting.entity.js';
import { PaymentsController } from './payments.controller.js';
import { PaymentsService } from './payments.service.js';
import { PremiumGuard } from './premium.guard.js';
import { PremiumService } from './premium.service.js';
import { StripeClient } from './stripe.client.js';
let PaymentsModule = class PaymentsModule {
};
PaymentsModule = __decorate([
    Module({
        imports: [MikroOrmModule.forFeature([AppSetting])],
        controllers: [PaymentsController],
        providers: [
            {
                provide: StripeClient,
                useFactory: () => new StripeClient({
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
        exports: [StripeClient, PremiumService, PremiumGuard],
    })
], PaymentsModule);
export { PaymentsModule };
//# sourceMappingURL=payments.module.js.map