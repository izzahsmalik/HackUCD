import { createHmac } from 'node:crypto';
import {
  CheckoutSession,
  StripeClient,
  StripeConfigurationError,
  StripeError,
  StripeSignatureError,
} from './stripe.client.js';

const SESSION_RESPONSE: CheckoutSession = {
  id: 'cs_test_123',
  url: 'https://checkout.stripe.com/c/pay/cs_test_123',
};

/** Builds a fresh Response per call: a Response body can only be consumed once. */
function sessionResponse(session = SESSION_RESPONSE, status = 200): Response {
  return new Response(JSON.stringify(session), { status });
}

function sign(payload: string, timestamp: number, secret: string): string {
  return createHmac('sha256', secret)
    .update(`${timestamp}.${payload}`)
    .digest('hex');
}

describe('StripeClient', () => {
  describe('createCheckoutSession', () => {
    it('posts a form-encoded one-time-payment session and returns id/url', async () => {
      const fetchImpl = vi.fn().mockResolvedValue(sessionResponse());
      const client = new StripeClient({ apiKey: 'sk_test', fetchImpl });
      const session = await client.createCheckoutSession({
        priceId: 'price_123',
        successUrl: 'https://app.test/success',
        cancelUrl: 'https://app.test/cancel',
      });
      expect(session).toEqual(SESSION_RESPONSE);
      expect(fetchImpl).toHaveBeenCalledWith(
        'https://api.stripe.com/v1/checkout/sessions',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer sk_test',
            'Content-Type': 'application/x-www-form-urlencoded',
          }),
        }),
      );
      const body = new URLSearchParams(
        vi.mocked(fetchImpl).mock.calls[0]![1]!.body as string,
      );
      expect(Object.fromEntries(body)).toMatchObject({
        mode: 'payment',
        'line_items[0][price]': 'price_123',
        'line_items[0][quantity]': '1',
        success_url: 'https://app.test/success',
        cancel_url: 'https://app.test/cancel',
      });
    });

    it('throws StripeConfigurationError when the api key is missing', async () => {
      const client = new StripeClient({ apiKey: null });
      await expect(
        client.createCheckoutSession({
          priceId: 'price_123',
          successUrl: 'https://app.test/success',
          cancelUrl: 'https://app.test/cancel',
        }),
      ).rejects.toBeInstanceOf(StripeConfigurationError);
    });

    it('throws StripeError with the API error message on non-2xx', async () => {
      const fetchImpl = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ error: { message: 'No such price' } }), {
          status: 400,
        }),
      );
      const client = new StripeClient({ apiKey: 'sk_test', fetchImpl });
      await expect(
        client.createCheckoutSession({
          priceId: 'price_bad',
          successUrl: 'https://app.test/success',
          cancelUrl: 'https://app.test/cancel',
        }),
      ).rejects.toMatchObject({
        name: 'StripeError',
        status: 400,
        message: 'No such price',
      });
    });

    it('throws StripeError when the response is not valid JSON', async () => {
      const fetchImpl = vi
        .fn()
        .mockResolvedValue(new Response('<html>boom</html>', { status: 200 }));
      const client = new StripeClient({ apiKey: 'sk_test', fetchImpl });
      await expect(
        client.createCheckoutSession({
          priceId: 'price_123',
          successUrl: 'https://app.test/success',
          cancelUrl: 'https://app.test/cancel',
        }),
      ).rejects.toMatchObject({ name: 'StripeError' });
    });

    it('posts to a custom api base url when configured', async () => {
      const fetchImpl = vi.fn().mockResolvedValue(sessionResponse());
      const client = new StripeClient({
        apiKey: 'sk_test',
        apiBaseUrl: 'https://stripe.test',
        fetchImpl,
      });
      await client.createCheckoutSession({
        priceId: 'price_123',
        successUrl: 'https://app.test/success',
        cancelUrl: 'https://app.test/cancel',
      });
      expect(fetchImpl).toHaveBeenCalledWith(
        'https://stripe.test/v1/checkout/sessions',
        expect.anything(),
      );
    });
  });

  describe('constructWebhookEvent', () => {
    const SECRET = 'whsec_test';
    const PAYLOAD =
      '{"id":"evt_1","type":"checkout.session.completed","data":{"object":{}}}';

    function makeClient(now: () => number = Date.now): StripeClient {
      return new StripeClient({ apiKey: null, webhookSecret: SECRET, now });
    }

    it('accepts a valid signature and returns the parsed event', () => {
      const t = 1_700_000_000;
      const client = makeClient(() => t + 60);
      const event = client.constructWebhookEvent(
        PAYLOAD,
        `t=${t},v1=${sign(PAYLOAD, t, SECRET)}`,
      );
      expect(event).toMatchObject({
        id: 'evt_1',
        type: 'checkout.session.completed',
      });
    });

    it('accepts when one of several v1 signatures matches', () => {
      const t = 1_700_000_000;
      const client = makeClient(() => t + 60);
      const event = client.constructWebhookEvent(PAYLOAD, [
        `v1=${sign(PAYLOAD, t, 'whsec_wrong')}`,
        `v1=${sign(PAYLOAD, t, SECRET)}`,
      ].map((part) => `t=${t},${part}`).join(' '));
      expect(event.id).toBe('evt_1');
    });

    it('rejects a tampered signature', () => {
      const t = 1_700_000_000;
      const client = makeClient(() => t + 60);
      expect(() =>
        client.constructWebhookEvent(
          PAYLOAD,
          `t=${t},v1=${sign(PAYLOAD, t, 'whsec_wrong')}`,
        ),
      ).toThrow(StripeSignatureError);
    });

    it('rejects a signature computed over different bytes', () => {
      const t = 1_700_000_000;
      const client = makeClient(() => t + 60);
      const other = '{"id":"evt_1","type":"invoice.paid","data":{"object":{}}}';
      expect(() =>
        client.constructWebhookEvent(
          PAYLOAD,
          `t=${t},v1=${sign(other, t, SECRET)}`,
        ),
      ).toThrow(StripeSignatureError);
    });

    it('rejects timestamps outside the tolerance window', () => {
      const t = 1_700_000_000;
      const client = makeClient(() => t + 301);
      expect(() =>
        client.constructWebhookEvent(
          PAYLOAD,
          `t=${t},v1=${sign(PAYLOAD, t, SECRET)}`,
        ),
      ).toThrow(StripeSignatureError);
    });

    it('honours a custom tolerance', () => {
      const t = 1_700_000_000;
      const client = new StripeClient({
        apiKey: null,
        webhookSecret: SECRET,
        now: () => t + 301,
        toleranceSeconds: 600,
      });
      expect(
        client.constructWebhookEvent(
          PAYLOAD,
          `t=${t},v1=${sign(PAYLOAD, t, SECRET)}`,
        ).id,
      ).toBe('evt_1');
    });

    it('throws StripeSignatureError when the header has no v1 signature', () => {
      const client = makeClient();
      expect(() =>
        client.constructWebhookEvent(PAYLOAD, 't=1700000000'),
      ).toThrow(StripeSignatureError);
    });

    it('throws StripeSignatureError when the header has no timestamp', () => {
      const client = makeClient();
      expect(() =>
        client.constructWebhookEvent(PAYLOAD, `v1=${sign(PAYLOAD, 1, SECRET)}`),
      ).toThrow(StripeSignatureError);
    });

    it('throws StripeConfigurationError when the webhook secret is missing', () => {
      const client = new StripeClient({ apiKey: null, webhookSecret: null });
      expect(() =>
        client.constructWebhookEvent(PAYLOAD, 't=1700000000,v1=abcd'),
      ).toThrow(StripeConfigurationError);
    });

    it('throws StripeError on non-JSON payload with a valid signature', () => {
      const payload = 'not json';
      const t = 1_700_000_000;
      const client = makeClient(() => t + 60);
      expect(() =>
        client.constructWebhookEvent(
          payload,
          `t=${t},v1=${sign(payload, t, SECRET)}`,
        ),
      ).toThrow(StripeError);
    });

    it('verifies against a Buffer payload byte-for-byte', () => {
      const t = 1_700_000_000;
      const client = makeClient(() => t + 60);
      const event = client.constructWebhookEvent(
        Buffer.from(PAYLOAD, 'utf8'),
        `t=${t},v1=${sign(PAYLOAD, t, SECRET)}`,
      );
      expect(event.type).toBe('checkout.session.completed');
    });
  });
});
