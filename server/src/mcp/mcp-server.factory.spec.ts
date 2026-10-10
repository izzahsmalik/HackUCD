import { ConflictException } from '@nestjs/common';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
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

async function connect(ingestService: IngestService) {
  const server = new McpServerFactory(ingestService).create();
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
    const text = (result.content as { type: string; text: string }[])[0].text;
    expect(JSON.parse(text)).toEqual(makeSummary());
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
    const text = (result.content as { type: string; text: string }[])[0].text;
    expect(text).toMatch(/already in progress/);
  });
});
