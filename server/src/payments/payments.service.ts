import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PremiumService } from './premium.service.js';
import {
  DEFAULT_CANCEL_URL,
  DEFAULT_SUCCESS_URL,
} from './payments.constants.js';
import { StripeClient, StripeConfigurationError, StripeSignatureError } from './stripe.client.js';
import type { CheckoutSessionDto } from './dto/payments.dto.js';

/**
 * Subscription lifecycle events that drive the premium flag: the first paid
 * invoice (and every renewal) unlocks Pro; subscription deletion re-locks it.
 */
const PREMIUM_ENABLED_EVENT_TYPES = new Set(['invoice.paid']);
const PREMIUM_DISABLED_EVENT_TYPES = new Set(['customer.subscription.deleted']);

@Injectable()
export class PaymentsService {
  constructor(
    private readonly stripeClient: StripeClient,
    private readonly premiumService: PremiumService,
  ) {}

  getIsPremium(): Promise<boolean> {
    return this.premiumService.getIsPremium();
  }

  /** Creates a Stripe Checkout session; 503 when Stripe env config is missing. */
  async createCheckoutSession(
    dto?: CheckoutSessionDto,
  ): Promise<{ url: string | null }> {
    const priceId = process.env.STRIPE_PRICE_ID;
    if (!priceId) {
      throw new ServiceUnavailableException(
        'Stripe is not configured (STRIPE_SECRET_KEY / STRIPE_PRICE_ID)',
      );
    }
    const session = await this.stripeClient.createCheckoutSession({
      priceId,
      successUrl:
        dto?.successUrl ??
        process.env.STRIPE_SUCCESS_URL ??
        DEFAULT_SUCCESS_URL,
      cancelUrl:
        dto?.cancelUrl ?? process.env.STRIPE_CANCEL_URL ?? DEFAULT_CANCEL_URL,
    });
    return { url: session.url };
  }

  /**
   * Verifies the webhook signature and applies the subscription lifecycle to
   * the premium flag (invoice.paid unlocks, subscription.deleted re-locks).
   * Always resolves with { received: true } so Stripe does not retry valid
   * events; unknown event types are ignored.
   */
  async handleWebhook(
    payload: string | Buffer,
    signatureHeader: string | undefined,
  ): Promise<{ received: boolean }> {
    if (!signatureHeader) {
      throw new BadRequestException('stripe-signature header is required');
    }
    let event;
    try {
      event = this.stripeClient.constructWebhookEvent(payload, signatureHeader);
    } catch (error) {
      if (error instanceof StripeConfigurationError) {
        throw new ServiceUnavailableException(
          'Stripe webhook signing is not configured (STRIPE_WEBHOOK_SECRET)',
        );
      }
      if (error instanceof StripeSignatureError) {
        throw new BadRequestException('invalid webhook signature');
      }
      throw error;
    }
    if (PREMIUM_ENABLED_EVENT_TYPES.has(event.type)) {
      await this.premiumService.setIsPremium(true);
    } else if (PREMIUM_DISABLED_EVENT_TYPES.has(event.type)) {
      await this.premiumService.setIsPremium(false);
    }
    return { received: true };
  }

  /** Dev/demo shortcut: sets the flag without a Stripe round-trip. */
  async devComplete(isPremium = true): Promise<{ isPremium: boolean }> {
    await this.premiumService.setIsPremium(isPremium);
    return { isPremium };
  }
}
