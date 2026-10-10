import { parseCsvText, readCsvRows } from './csv-file.js';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

describe('parseCsvText', () => {
  it('parses header-keyed rows', () => {
    const rows = parseCsvText('date,amount\n2026-01-01,-4.50\n');
    expect(rows).toEqual([{ date: '2026-01-01', amount: '-4.50' }]);
  });

  it('strips a leading BOM from the first header', () => {
    const rows = parseCsvText('﻿date,amount\n2026-01-01,-4.50\n');
    expect(Object.keys(rows[0])).toEqual(['date', 'amount']);
  });

  it('skips empty lines', () => {
    const rows = parseCsvText('a,b\n\n1,2\n\n3,4\n');
    expect(rows).toHaveLength(2);
  });

  it('reports failures with the given label', () => {
    // A quoted field left open is a parse error papaparse reports.
    expect(() => parseCsvText('a,b\n"x,2\n', 'upload.csv')).toThrow(
      /upload\.csv/,
    );
  });

  it('defaults the label to "input"', () => {
    expect(() => parseCsvText('a,b\n"x,2\n')).toThrow(/input/);
  });
});

describe('readCsvRows', () => {
  let dir: string;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'csv-'));
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it('reads a file from disk and parses it with its path as label', async () => {
    const path = join(dir, 'bank.csv');
    await writeFile(path, 'date,amount\n2026-01-01,-4.50\n');
    expect(await readCsvRows(path)).toEqual([
      { date: '2026-01-01', amount: '-4.50' },
    ]);
  });
});
