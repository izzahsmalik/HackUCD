import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from './../src/app.module.js';
import { LlmModel } from './../src/llm/llm.model.js';
import { IngestService } from '../src/ingest/ingest.service.js';
import { IngestRunSummary } from '../src/ingest/ingest-result.js';
import { QueryService } from '../src/query/query.service.js';

function makeSummary(): IngestRunSummary {
  return {
    files: [
      {
        fileName: 'bank.csv',
        kind: 'transactions',
        rowsTotal: 1,
        rowsPersisted: 1,
        decisionsCreated: 0,
        errors: [],
      },
    ],
    pendingDecisions: 0,
  };
}

/**
 * The stateless transport answers POSTs as an SSE stream even for JSON
 * requests; supertest does not parse that, so pull the single JSON-RPC
 * message out of the `data:` line ourselves.
 */
function jsonResult(res: { text: string }): Record<string, unknown> {
  const dataLine = res.text
    .split('\n')
    .find((line) => line.startsWith('data: '));
  expect(dataLine).toBeDefined();
  return JSON.parse(dataLine!.slice('data: '.length)).result;
}

function makeQueryResponse() {
  return {
    answer: 'You spent $10.50.',
    plan: { entity: 'transactions', aggregation: 'sum' },
    data: { entity: 'transactions', rowCount: 2, totals: { count: 2 } },
  };
}

describe('Ingest upload and MCP (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      // The LLM provider needs an API key at boot; e2e tests never call it.
      .overrideProvider(LlmModel)
      .useValue({ chat: vi.fn(), chatJson: vi.fn(), complete: vi.fn() })
      // Ingestion is mocked out: the pipeline itself is covered by unit tests,
      // and the real one would need a database and LLM calls.
      .overrideProvider(IngestService)
      .useValue({
        run: vi.fn().mockResolvedValue(makeSummary()),
        ingestCsv: vi.fn().mockResolvedValue(makeSummary()),
      })
      .overrideProvider(QueryService)
      .useValue({ ask: vi.fn().mockResolvedValue(makeQueryResponse()) })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('POST /ingest/upload with no file returns 400', () => {
    return request(app.getHttpServer()).post('/ingest/upload').expect(400);
  });

  it('POST /ingest/upload ingests an attached csv', () => {
    return request(app.getHttpServer())
      .post('/ingest/upload')
      .attach(
        'file',
        Buffer.from('date,amount\n2026-01-01,-4.50\n'),
        'bank.csv',
      )
      .expect(201)
      .expect((res) => {
        expect(res.body.files[0]).toMatchObject({ fileName: 'bank.csv' });
      });
  });

  it('POST /mcp handles an initialize request', () => {
    return request(app.getHttpServer())
      .post('/mcp')
      .set('Accept', 'application/json, text/event-stream')
      .send({
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2025-03-26',
          capabilities: {},
          clientInfo: { name: 'supertest', version: '0.0.1' },
        },
      })
      .expect(200)
      .expect((res) => {
        expect(jsonResult(res).serverInfo.name).toBe('hackucd-ingest');
      });
  });

  it('POST /mcp lists the ingest_csv and ask_financial_question tools', () => {
    return request(app.getHttpServer())
      .post('/mcp')
      .set('Accept', 'application/json, text/event-stream')
      .send({ jsonrpc: '2.0', id: 2, method: 'tools/list' })
      .expect(200)
      .expect((res) => {
        const names = jsonResult(res).tools.map(
          (t: { name: string }) => t.name,
        );
        expect(names).toContain('ingest_csv');
        expect(names).toContain('ask_financial_question');
      });
  });

  it('POST /mcp answers a financial question through the query tool', () => {
    return request(app.getHttpServer())
      .post('/mcp')
      .set('Accept', 'application/json, text/event-stream')
      .send({
        jsonrpc: '2.0',
        id: 3,
        method: 'tools/call',
        params: {
          name: 'ask_financial_question',
          arguments: { question: 'How much did I spend?' },
        },
      })
      .expect(200)
      .expect((res) => {
        // jsonResult() already unwraps the JSON-RPC envelope: for tools/call it
        // IS the tool result ({ content: [...] }).
        const toolResult = jsonResult(res) as {
          content: { type: string; text: string }[];
        };
        const response = JSON.parse(toolResult.content[0]!.text);
        expect(response.answer).toBe('You spent $10.50.');
      });
  });

  it('POST /mcp lists the action queue tools', () => {
    return request(app.getHttpServer())
      .post('/mcp')
      .set('Accept', 'application/json, text/event-stream')
      .send({ jsonrpc: '2.0', id: 3, method: 'tools/list' })
      .expect(200)
      .expect((res) => {
        const names = jsonResult(res).tools.map(
          (t: { name: string }) => t.name,
        );
        expect(names).toContain('list_pending_decisions');
        expect(names).toContain('get_decision');
        expect(names).toContain('resolve_decision');
      });
  });

  it('GET /mcp is refused in stateless mode', () => {
    return request(app.getHttpServer())
      .get('/mcp')
      .set('Accept', 'application/json, text/event-stream')
      .expect(405);
  });
});
