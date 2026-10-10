import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { ActionQueueService } from '../action-queue/action-queue.service.js';
import { IngestService } from '../ingest/ingest.service.js';
import { IngestRunSummary } from '../ingest/ingest-result.js';
import { McpServerFactory } from './mcp-server.factory.js';

function makeSummary(): IngestRunSummary {
  return {
    files: [
      {
        fileName: 't.csv',
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

async function connect(
  ingestService: IngestService,
  actionQueueService: ActionQueueService = new ActionQueueService(),
) {
  const server = new McpServerFactory(ingestService, actionQueueService).create();
  const client = new Client({ name: 'test', version: '0.0.1' });
  // The SDK types createLinkedPair() as sync, but it returns a Promise at
  // runtime — hence the cast before awaiting.
  const pair = InMemoryTransport.createLinkedPair() as unknown as Promise<
    readonly [InMemoryTransport, InMemoryTransport]
  >;
  const [clientTransport, serverTransport] = await pair;
  await server.connect(serverTransport);
  await client.connect(clientTransport);
  return { server, client };
}

function textOf(result: { content: { type: string; text: string }[] }) {
  return result.content[0].text;
}

describe('McpServerFactory', () => {
  it('lists the ingest_csv tool', async () => {
    const { client } = await connect({} as IngestService);

    const { tools } = await client.listTools();

    const tool = tools.find((t) => t.name === 'ingest_csv');
    expect(tool).toBeDefined();
    expect(tool!.inputSchema.required).toContain('csv');
  });

  it('returns the ingest summary as JSON text', async () => {
    const ingestCsv = vi.fn().mockResolvedValue(makeSummary());
    const { client } = await connect({ ingestCsv } as unknown as IngestService);

    const result = await client.callTool({
      name: 'ingest_csv',
      arguments: { fileName: 't.csv', csv: 'date,amount\n2026-01-01,-4.50\n' },
    });

    expect(ingestCsv).toHaveBeenCalledWith(
      't.csv',
      'date,amount\n2026-01-01,-4.50\n',
    );
    expect(result.isError).toBeUndefined();
    expect(JSON.parse(textOf(result as never))).toEqual(makeSummary());
  });

  it('defaults the file name when none is given', async () => {
    const ingestCsv = vi.fn().mockResolvedValue(makeSummary());
    const { client } = await connect({ ingestCsv } as unknown as IngestService);

    await client.callTool({
      name: 'ingest_csv',
      arguments: { csv: 'date,amount\n2026-01-01,-4.50\n' },
    });

    expect(ingestCsv).toHaveBeenCalledWith('upload.csv', expect.any(String));
  });

  it('reports a conflict as an error result, not a throw', async () => {
    const ingestCsv = vi
      .fn()
      .mockRejectedValue(
        new ConflictException('An ingest run is already in progress'),
      );
    const { client } = await connect({ ingestCsv } as unknown as IngestService);

    const result = await client.callTool({
      name: 'ingest_csv',
      arguments: { csv: 'a,b\n1,2\n' },
    });

    expect(result.isError).toBe(true);
    expect(textOf(result as never)).toMatch(/already in progress/);
  });
});

describe('McpServerFactory action queue tools', () => {
  const view = {
    id: 1,
    type: 'product',
    summary: 'Pricing row #3 could not be confidently matched',
    actions: [{ id: 'discard', label: 'Discard this row' }],
    data: { rowIndex: 3 },
  };

  it('exposes all four tools and resolve_decision requires id and actionId', async () => {
    const { client } = await connect({} as IngestService);

    const { tools } = await client.listTools();
    const names = tools.map((t) => t.name);
    expect(names).toContain('list_pending_decisions');
    expect(names).toContain('get_decision');
    expect(names).toContain('resolve_decision');

    const resolve = tools.find((t) => t.name === 'resolve_decision')!;
    expect(resolve.inputSchema.required).toEqual(
      expect.arrayContaining(['id', 'actionId']),
    );
  });

  it('lists pending decisions as JSON', async () => {
    const list = vi.fn().mockReturnValue([view]);
    const { client } = await connect(
      {} as IngestService,
      { list } as unknown as ActionQueueService,
    );

    const result = await client.callTool({
      name: 'list_pending_decisions',
      arguments: {},
    });

    expect(list).toHaveBeenCalled();
    expect(result.isError).toBeUndefined();
    expect(JSON.parse(textOf(result as never))).toEqual([view]);
  });

  it('gets a decision by id', async () => {
    const get = vi.fn().mockReturnValue(view);
    const { client } = await connect(
      {} as IngestService,
      { get } as unknown as ActionQueueService,
    );

    const result = await client.callTool({
      name: 'get_decision',
      arguments: { id: 1 },
    });

    expect(get).toHaveBeenCalledWith(1);
    expect(JSON.parse(textOf(result as never))).toEqual(view);
  });

  it('reports an unknown decision id as an error result', async () => {
    const get = vi.fn().mockImplementation(() => {
      throw new NotFoundException('Decision #9 not found');
    });
    const { client } = await connect(
      {} as IngestService,
      { get } as unknown as ActionQueueService,
    );

    const result = await client.callTool({
      name: 'get_decision',
      arguments: { id: 9 },
    });

    expect(result.isError).toBe(true);
    expect(textOf(result as never)).toMatch(/not found/i);
  });

  it('resolves a decision and returns the apply result', async () => {
    const applied = { id: 7, name: 'Chocolate' };
    const resolve = vi.fn().mockResolvedValue(applied);
    const { client } = await connect(
      {} as IngestService,
      { resolve } as unknown as ActionQueueService,
    );

    const result = await client.callTool({
      name: 'resolve_decision',
      arguments: { id: 1, actionId: 'match-product', payload: { productId: 3 } },
    });

    expect(resolve).toHaveBeenCalledWith(1, 'match-product', {
      productId: 3,
    });
    expect(JSON.parse(textOf(result as never))).toEqual(applied);
  });

  it('passes a bad action through as an error result', async () => {
    const resolve = vi
      .fn()
      .mockRejectedValue(
        new BadRequestException("Unknown action 'nope' for a product decision"),
      );
    const { client } = await connect(
      {} as IngestService,
      { resolve } as unknown as ActionQueueService,
    );

    const result = await client.callTool({
      name: 'resolve_decision',
      arguments: { id: 1, actionId: 'nope' },
    });

    expect(result.isError).toBe(true);
    expect(textOf(result as never)).toMatch(/Unknown action/);
  });
});
