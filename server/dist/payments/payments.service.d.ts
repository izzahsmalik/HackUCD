import { PremiumService } from './premium.service.js';
import { StripeClient } from './stripe.client.js';
import type { CheckoutSessionDto } from './dto/payments.dto.js';
export declare class PaymentsService {
    private readonly stripeClient;
    private readonly premiumService;
    constructor(stripeClient: StripeClient, premiumService: PremiumService);
    getIsPremium(): Promise<boolean>;
    createCheckoutSession(dto?: CheckoutSessionDto): Promise<{
        url: string | null;
    }>;
    handleWebhook(payload: string | Buffer, signatureHeader: string | undefined): Promise<{
        received: boolean;
    }>;
    devComplete(isPremium?: boolean): Promise<{
        isPremium: boolean;
    }>;
}
