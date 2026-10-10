import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from './../src/app.module.js';
import { LlmModel } from './../src/llm/llm.model.js';
import { QueryService } from './../src/query/query.service.js';

/**
 * Covers the Pro gate on POST /query and the GET /outputs/margins view.
 * State is reset and seeded over HTTP only: MikroORM throws outside a
 * request context, so injected services must not be touched here.
 */
describe('Query gating and output margins (e2e)', () => {
  let app: INestApplication<App>;
  const ask = vi.fn();

  beforeEach(async () => {
    ask.mockReset();
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      // The LLM provider needs an API key at boot; these tests never call it.
      .overrideProvider(LlmModel)
      .useValue({ chat: vi.fn(), chatJson: vi.fn(), complete: vi.fn() })
      .overrideProvider(QueryService)
      .useValue({ ask, planOnly: vi.fn() })
      .compile();

    app = moduleFixture.createNestApplication({ rawBody: true });
    await app.init();
    // Start every test from a known free state.
    await request(app.getHttpServer())
      .post('/payments/dev-complete')
      .send({ isPremium: false })
      .expect(201);
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /query premium gate', () => {
    it('refuses a free user with 403', async () => {
      const response = await request(app.getHttpServer())
        .post('/query')
        .send({ question: 'How much did I spend?' })
        .expect(403);
      expect(response.body.message).toBe('This feature requires premium');
      expect(ask).not.toHaveBeenCalled();
    });

    it('answers once premium is enabled', async () => {
      ask.mockResolvedValue({ answer: 'ok', plan: {}, data: {} });
      await request(app.getHttpServer())
        .post('/payments/dev-complete')
        .expect(201);
      await request(app.getHttpServer())
        .get('/payments/status')
        .expect(200)
        .expect({ isPremium: true });
      return request(app.getHttpServer())
        .post('/query')
        .send({ question: 'How much did I spend?' })
        .expect(201)
        .expect({ answer: 'ok', plan: {}, data: {} });
    });

    it('leaves POST /query/plan free (the free diagnosis stays visible)', () => {
      return request(app.getHttpServer())
        .post('/query/plan')
        .send({ question: 'How much did I spend?' })
        .expect(201);
    });
  });

  describe('GET /outputs/margins', () => {
    async function seed(): Promise<{ cheapOutputId: number; priceyOutputId: number }> {
      const server = app.getHttpServer();
      const brand = await request(server)
        .post('/brands')
        .send({ name: 'Flour Power' })
        .expect(201);
      const flour = await request(server)
        .post('/products')
        .send({ name: 'Flour', brandId: brand.body.id })
        .expect(201);
      const cocoa = await request(server)
        .post('/products')
        .send({ name: 'Cocoa', brandId: brand.body.id })
        .expect(201);
      // Costs chosen so the two outputs straddle the 50% margin target.
      await request(server)
        .post(`/products/${flour.body.id}/prices`)
        .send({ amount: 100 })
        .expect(201);
      await request(server)
        .post(`/products/${cocoa.body.id}/prices`)
        .send({ amount: 125 })
        .expect(201);
      const cheap = await request(server)
        .post('/outputs')
        .send({ name: 'Cookies', productIds: [flour.body.id] })
        .expect(201);
      await request(server)
        .post(`/outputs/${cheap.body.id}/prices`)
        .send({ amount: 250 }) // margin (250-100)/250 = 0.60
        .expect(201);
      const pricey = await request(server)
        .post('/outputs')
        .send({ name: 'Brownies', productIds: [cocoa.body.id] })
        .expect(201);
      await request(server)
        .post(`/outputs/${pricey.body.id}/prices`)
        .send({ amount: 245 }) // margin (245-125)/245 ≈ 0.49
        .expect(201);
      return { cheapOutputId: cheap.body.id, priceyOutputId: pricey.body.id };
    }

    it('reports cost, sale price, and margin per output', async () => {
      const { cheapOutputId, priceyOutputId } = await seed();

      const response = await request(app.getHttpServer())
        .get('/outputs/margins')
        .expect(200);
      const rows = new Map(
        response.body.map(
          (row: { outputId: number; productCostCents: number }) => [
            row.outputId,
            row,
          ],
        ),
      );
      expect(rows.get(cheapOutputId)).toMatchObject({
        productCostCents: 100,
        salePriceCents: 250,
        margin: 0.6,
      });
      expect(rows.get(priceyOutputId)!.margin).toBeCloseTo(120 / 245, 10);
    });

    it('is not captured by the :id route', () => {
      // A ParseIntPipe hit would turn this into a 400.
      return request(app.getHttpServer()).get('/outputs/margins').expect(200);
    });
  });
});
