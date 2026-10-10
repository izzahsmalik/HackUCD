import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { createHmac } from 'node:crypto';
import { AppModule } from './../src/app.module.js';
import { LlmModel } from './../src/llm/llm.model.js';
import { StripeClient } from './../src/payments/stripe.client.js';

// Known test signing secret; signatures below are computed over the exact
// bytes supertest sends, so no Stripe network access is involved.
const WEBHOOK_SECRET = 'whsec_e2e_test';
const WEBHOOK_PAYLOAD =
  '{"id":"evt_1","type":"checkout.session.completed","data":{"object":{}}}';

function webhookSignature(timestamp: number, payload: string): string {
  return createHmac('sha256', WEBHOOK_SECRET)
    .update(`${timestamp}.${payload}`)
    .digest('hex');
}

describe('Payments (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      // The LLM provider needs an API key at boot; these tests never call it.
      .overrideProvider(LlmModel)
      .useValue({ chat: vi.fn(), chatJson: vi.fn(), complete: vi.fn() })
      // A real client with no API key: signature verification runs for real,
      // but no request can reach the Stripe network.
      .overrideProvider(StripeClient)
      .useFactory({
        factory: () =>
          new StripeClient({
            apiKey: null,
            webhookSecret: WEBHOOK_SECRET,
            fetchImpl: globalThis.fetch.bind(globalThis),
          }),
      })
      .compile();

    // rawBody matches main.ts so the webhook handler gets the raw request bytes.
    app = moduleFixture.createNestApplication({ rawBody: true });
    await app.init();
    // Start every test from a known free state. Done over HTTP because
    // MikroORM only allows DB access inside a request context.
    await request(app.getHttpServer())
      .post('/payments/dev-complete')
      .send({ isPremium: false })
      .expect(201);
  });

  afterEach(async () => {
    await app.close();
    vi.unstubAllEnvs();
  });

  it('GET /payments/status reports the seeded free state', () => {
    return request(app.getHttpServer())
      .get('/payments/status')
      .expect(200)
      .expect({ isPremium: false });
  });

  it('POST /payments/dev-complete enables premium', async () => {
    await request(app.getHttpServer())
      .post('/payments/dev-complete')
      .expect(201);
    return request(app.getHttpServer())
      .get('/payments/status')
      .expect(200)
      .expect({ isPremium: true });
  });

  it('POST /payments/webhook with a valid signature enables premium', async () => {
    const t = Math.floor(Date.now() / 1000);
    await request(app.getHttpServer())
      .post('/payments/webhook')
      .set('content-type', 'application/json')
      .set(
        'stripe-signature',
        `t=${t},v1=${webhookSignature(t, WEBHOOK_PAYLOAD)}`,
      )
      // A string body is sent verbatim; a Buffer would be JSON-serialized and
      // the signature would then cover different bytes than Stripe would sign.
      .send(WEBHOOK_PAYLOAD)
      .expect(200)
      .expect({ received: true });
    return request(app.getHttpServer())
      .get('/payments/status')
      .expect(200)
      .expect({ isPremium: true });
  });

  it('POST /payments/webhook with a tampered signature returns 400', () => {
    const t = Math.floor(Date.now() / 1000);
    return request(app.getHttpServer())
      .post('/payments/webhook')
      .set('content-type', 'application/json')
      .set('stripe-signature', `t=${t},v1=${'a'.repeat(64)}`)
      .send(WEBHOOK_PAYLOAD)
      .expect(400);
  });

  it('POST /payments/checkout-session returns 503 without Stripe keys', () => {
    return request(app.getHttpServer())
      .post('/payments/checkout-session')
      .expect(503);
  });

  it('POST /payments/dev-complete is refused in production', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    return request(app.getHttpServer())
      .post('/payments/dev-complete')
      .expect(403);
  });
});
