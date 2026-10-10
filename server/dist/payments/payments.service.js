var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { BadRequestException, Injectable, ServiceUnavailableException, } from '@nestjs/common';
import { PremiumService } from './premium.service.js';
import { DEFAULT_CANCEL_URL, DEFAULT_SUCCESS_URL, } from './payments.constants.js';
import { StripeClient, StripeConfigurationError, StripeSignatureError } from './stripe.client.js';
const PREMIUM_ENABLED_EVENT_TYPES = new Set(['invoice.paid']);
const PREMIUM_DISABLED_EVENT_TYPES = new Set(['customer.subscription.deleted']);
let PaymentsService = class PaymentsService {
    stripeClient;
    premiumService;
    constructor(stripeClient, premiumService) {
        this.stripeClient = stripeClient;
        this.premiumService = premiumService;
    }
    getIsPremium() {
        return this.premiumService.getIsPremium();
    }
    async createCheckoutSession(dto) {
        const priceId = process.env.STRIPE_PRICE_ID;
        if (!priceId) {
            throw new ServiceUnavailableException('Stripe is not configured (STRIPE_SECRET_KEY / STRIPE_PRICE_ID)');
        }
        const session = await this.stripeClient.createCheckoutSession({
            priceId,
            successUrl: dto?.successUrl ??
                process.env.STRIPE_SUCCESS_URL ??
                DEFAULT_SUCCESS_URL,
            cancelUrl: dto?.cancelUrl ?? process.env.STRIPE_CANCEL_URL ?? DEFAULT_CANCEL_URL,
        });
        return { url: session.url };
    }
    async handleWebhook(payload, signatureHeader) {
        if (!signatureHeader) {
            throw new BadRequestException('stripe-signature header is required');
        }
        let event;
        try {
            event = this.stripeClient.constructWebhookEvent(payload, signatureHeader);
        }
        catch (error) {
            if (error instanceof StripeConfigurationError) {
                throw new ServiceUnavailableException('Stripe webhook signing is not configured (STRIPE_WEBHOOK_SECRET)');
            }
            if (error instanceof StripeSignatureError) {
                throw new BadRequestException('invalid webhook signature');
            }
            throw error;
        }
        if (PREMIUM_ENABLED_EVENT_TYPES.has(event.type)) {
            await this.premiumService.setIsPremium(true);
        }
        else if (PREMIUM_DISABLED_EVENT_TYPES.has(event.type)) {
            await this.premiumService.setIsPremium(false);
        }
        return { received: true };
    }
    async devComplete(isPremium = true) {
        await this.premiumService.setIsPremium(isPremium);
        return { isPremium };
    }
};
PaymentsService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [StripeClient,
        PremiumService])
], PaymentsService);
export { PaymentsService };
//# sourceMappingURL=payments.service.js.map