import { BadRequestException } from '@nestjs/common';
import { PaymentsService } from './payments.service.js';
import { StripeSignatureError } from './stripe.client.js';

const EVENT = (type: string) => ({
  id: 'evt_1',
  type,
  data: { object: {} },
});

function makeService() {
  const stripeClient = {
    createCheckoutSession: vi.fn().mockResolvedValue({
      id: 'cs_1',
      url: 'https://checkout.stripe.com/pay/cs_1',
    }),
    constructWebhookEvent: vi.fn(),
  };
  const premiumService = {
    getIsPremium: vi.fn(),
    setIsPremium: vi.fn().mockResolvedValue(undefined),
  };
  return {
    service: new PaymentsService(
      stripeClient as never,
      premiumService as never,
    ),
    stripeClient,
    premiumService,
  };
}

describe('PaymentsService', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  describe('createCheckoutSession', () => {
    it('returns the checkout url from the Stripe client', async () => {
      const { service, stripeClient } = makeService();
      vi.stubEnv('STRIPE_PRICE_ID', 'price_123');
      await expect(service.createCheckoutSession()).resolves.toEqual({
        url: 'https://checkout.stripe.com/pay/cs_1',
      });
      expect(stripeClient.createCheckoutSession).toHaveBeenCalledWith(
        expect.objectContaining({
          priceId: 'price_123',
          successUrl: 'http://localhost:5173/?payment=success',
          cancelUrl: 'http://localhost:5173/?payment=cancelled',
        }),
      );
    });

    it('uses request URLs over env and defaults', async () => {
      const { service, stripeClient } = makeService();
      vi.stubEnv('STRIPE_PRICE_ID', 'price_123');
      vi.stubEnv('STRIPE_SUCCESS_URL', 'https://env.test/success');
      await service.createCheckoutSession({
        successUrl: 'https://req.test/success',
      });
      expect(stripeClient.createCheckoutSession).toHaveBeenCalledWith(
        expect.objectContaining({
          successUrl: 'https://req.test/success',
          cancelUrl: 'http://localhost:5173/?payment=cancelled',
        }),
      );
    });

    it('throws ServiceUnavailableException when STRIPE_PRICE_ID is missing', async () => {
      const { service, stripeClient } = makeService();
      vi.stubEnv('STRIPE_PRICE_ID', undefined);
      await expect(service.createCheckoutSession()).rejects.toMatchObject({
        status: 503,
      });
      expect(stripeClient.createCheckoutSession).not.toHaveBeenCalled();
    });
  });

  describe('handleWebhook', () => {
    it('throws BadRequestException without a signature header', async () => {
      const { service } = makeService();
      await expect(service.handleWebhook('{}', undefined)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('enables premium on invoice.paid', async () => {
      const { service, stripeClient, premiumService } = makeService();
      stripeClient.constructWebhookEvent.mockReturnValue(EVENT('invoice.paid'));
      await expect(
        service.handleWebhook('payload', 't=1,v1=abc'),
      ).resolves.toEqual({ received: true });
      expect(premiumService.setIsPremium).toHaveBeenCalledWith(true);
    });

    it('re-locks premium on customer.subscription.deleted', async () => {
      const { service, stripeClient, premiumService } = makeService();
      stripeClient.constructWebhookEvent.mockReturnValue(
        EVENT('customer.subscription.deleted'),
      );
      await service.handleWebhook('payload', 't=1,v1=abc');
      expect(premiumService.setIsPremium).toHaveBeenCalledWith(false);
    });

    it('ignores unrelated event types', async () => {
      const { service, stripeClient, premiumService } = makeService();
      stripeClient.constructWebhookEvent.mockReturnValue(
        EVENT('checkout.session.completed'),
      );
      await service.handleWebhook('payload', 't=1,v1=abc');
      expect(premiumService.setIsPremium).not.toHaveBeenCalled();
    });

    it('maps a bad signature to BadRequestException', async () => {
      const { service, stripeClient } = makeService();
      stripeClient.constructWebhookEvent.mockImplementation(() => {
        throw new StripeSignatureError('webhook signature mismatch');
      });
      await expect(
        service.handleWebhook('payload', 't=1,v1=bad'),
      ).rejects.toMatchObject({ status: 400 });
    });
  });

  describe('devComplete', () => {
    it('defaults to enabling premium', async () => {
      const { service, premiumService } = makeService();
      await expect(service.devComplete()).resolves.toEqual({
        isPremium: true,
      });
      expect(premiumService.setIsPremium).toHaveBeenCalledWith(true);
    });

    it('passes an explicit false through', async () => {
      const { service, premiumService } = makeService();
      await service.devComplete(false);
      expect(premiumService.setIsPremium).toHaveBeenCalledWith(false);
    });
  });
});
