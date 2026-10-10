import { ConflictException } from '@nestjs/common';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ActionQueueService } from '../action-queue/action-queue.service.js';
import { IngestService } from './ingest.service.js';
import { FileClassifier, FileKind } from './file-classifier.js';
import { ProductsIngestService } from './products-ingest.service.js';
import { TransactionsIngestService } from './transactions-ingest.service.js';
import type { IngestFileResult } from './ingest-result.js';

function makeResult(partial: Partial<IngestFileResult> = {}): IngestFileResult {
  return {
    rowsTotal: 2,
    rowsPersisted: 2,
    decisionsCreated: 0,
    errors: [],
    ...partial,
  };
}

function makeService(
  classify: (fileName: string, rows: unknown[]) => Promise<FileKind | null>,
) {
  const transactionsIngest = {
    ingest: vi.fn().mockResolvedValue(makeResult()),
  };
  const productsIngest = { ingest: vi.fn().mockResolvedValue(makeResult()) };
  const service = new IngestService(
    { classify } as unknown as FileClassifier,
    transactionsIngest as unknown as TransactionsIngestService,
    productsIngest as unknown as ProductsIngestService,
    new ActionQueueService(),
  );
  return { service, transactionsIngest, productsIngest };
}

describe('IngestService', () => {
  let dir: string;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'ingest-'));
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it('classifies and dispatches each csv file to the right ingest service', async () => {
    await writeFile(join(dir, 'bank.csv'), 'date,amount\n2026-01-01,-4.50\n');
    await writeFile(join(dir, 'prices.csv'), 'item,price\nCoffee,4.50\n');
    await writeFile(join(dir, 'notes.txt'), 'ignored');
    const classify = vi
      .fn()
      .mockResolvedValueOnce('transactions')
      .mockResolvedValueOnce('products');
    const { service, transactionsIngest, productsIngest } =
      makeService(classify);

    const summary = await service.run(dir);

    expect(summary.files).toHaveLength(2);
    expect(summary.files.find((f) => f.fileName === 'bank.csv')).toMatchObject({
      kind: 'transactions',
      rowsPersisted: 2,
    });
    expect(
      summary.files.find((f) => f.fileName === 'prices.csv'),
    ).toMatchObject({ kind: 'products' });
    expect(transactionsIngest.ingest).toHaveBeenCalledTimes(1);
    expect(productsIngest.ingest).toHaveBeenCalledTimes(1);
  });

  it('does not abort the run when one file fails', async () => {
    await writeFile(join(dir, 'bad.csv'), 'date,amount\n');
    await writeFile(join(dir, 'bank.csv'), 'date,amount\n');
    const classify = vi
      .fn()
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValueOnce('transactions');
    const { service, transactionsIngest } = makeService(classify);

    const summary = await service.run(dir);

    expect(summary.files).toHaveLength(2);
    expect(
      summary.files.find((f) => f.fileName === 'bad.csv')!.errors,
    ).toContain('Error: boom');
    expect(transactionsIngest.ingest).toHaveBeenCalledTimes(1);
  });

  it('refuses an overlapping run with 409', async () => {
    await writeFile(join(dir, 'bank.csv'), 'date,amount\n');
    let release!: (kind: FileKind | null) => void;
    const gate = new Promise<FileKind | null>((resolve) => (release = resolve));
    const classify = vi.fn().mockReturnValue(gate); // holds the first run mid-flight
    const { service } = makeService(classify);

    const first = service.run(dir);
    await expect(service.run(dir)).rejects.toThrow(ConflictException);
    release('transactions');
    const summary = await first;
    expect(summary.files).toHaveLength(1);
  });
});

describe('IngestService.ingestCsv', () => {
  it('classifies in-memory text and dispatches to the right ingest service', async () => {
    const { service, transactionsIngest, productsIngest } = makeService(
      vi.fn().mockResolvedValue('transactions'),
    );

    const summary = await service.ingestCsv(
      'bank.csv',
      'date,amount\n2026-01-01,-4.50\n',
    );

    expect(summary.files).toHaveLength(1);
    expect(summary.files[0]).toMatchObject({
      fileName: 'bank.csv',
      kind: 'transactions',
      rowsTotal: 1,
      rowsPersisted: 2,
    });
    expect(transactionsIngest.ingest).toHaveBeenCalledWith('bank.csv', [
      { date: '2026-01-01', amount: '-4.50' },
    ]);
    expect(productsIngest.ingest).not.toHaveBeenCalled();
  });

  it('reports an unclassifiable file in the summary', async () => {
    const { service, transactionsIngest } = makeService(
      vi.fn().mockResolvedValue(null),
    );

    const summary = await service.ingestCsv('mystery.csv', 'a,b\n1,2\n');

    expect(summary.files[0].errors).toEqual([
      'could not determine whether the file is transactions or product pricing',
    ]);
    expect(summary.files[0].kind).toBeNull();
    expect(transactionsIngest.ingest).not.toHaveBeenCalled();
  });

  it('reports a parse failure in the summary instead of throwing', async () => {
    const { service, transactionsIngest } = makeService(vi.fn());

    const summary = await service.ingestCsv('bad.csv', 'a,b\n"x,2\n');

    expect(summary.files[0].rowsTotal).toBe(0);
    expect(summary.files[0].errors[0]).toContain('Failed to parse bad.csv');
    expect(transactionsIngest.ingest).not.toHaveBeenCalled();
  });

  it('shares the overlap guard with run() and releases it afterwards', async () => {
    let release!: (kind: FileKind | null) => void;
    const gate = new Promise<FileKind | null>((resolve) => (release = resolve));
    const classify = vi.fn().mockReturnValue(gate);
    const { service, transactionsIngest } = makeService(classify);

    const inFlight = service.ingestCsv('bank.csv', 'date,amount\n');
    await expect(
      service.ingestCsv('other.csv', 'date,amount\n'),
    ).rejects.toThrow(ConflictException);
    await expect(service.run('/nonexistent')).rejects.toThrow(
      ConflictException,
    );
    release('transactions');
    await inFlight;

    // The flag is released once the run finishes, so the next call proceeds.
    classify.mockResolvedValue('transactions');
    await service.ingestCsv('again.csv', 'date,amount\n');
    expect(transactionsIngest.ingest).toHaveBeenCalledTimes(2);
  });

  it('releases the overlap guard when the ingest fails', async () => {
    const classify = vi.fn().mockRejectedValue(new Error('boom'));
    const { service } = makeService(classify);

    await service.ingestCsv('bank.csv', 'date,amount\n');

    const summary = await service.ingestCsv('again.csv', 'date,amount\n');
    expect(summary.files[0].errors).toContain('Error: boom');
  });
});
