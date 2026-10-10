import { readFile } from 'node:fs/promises';
import Papa from 'papaparse';

export type CsvRow = Record<string, string>;

/** Reads a CSV file from disk and parses it into header-keyed string rows. */
export async function readCsvRows(path: string): Promise<CsvRow[]> {
  const text = await readFile(path, 'utf8');
  const parsed = Papa.parse<CsvRow>(text, {
    header: true,
    skipEmptyLines: true,
  });
  if (parsed.errors.length > 0) {
    const first = parsed.errors[0];
    throw new Error(
      `Failed to parse ${path}: ${first.message} (row ${first.row ?? '?'})`,
    );
  }
  return parsed.data;
}

/** Parses a price/amount cell into integer cents; throws on unparseable values. */
export function parseCents(value: string, context: string): number {
  const cleaned = value.replace(/[$,\s]/g, '');
  const number = Number(cleaned);
  if (cleaned.length === 0 || Number.isNaN(number)) {
    throw new Error(`${context}: cannot parse amount '${value}'`);
  }
  return Math.round(number * 100);
}

/** Normalizes a raw CSV cell value: null/undefined become '', everything else a trimmed string. */
export function cell(value: string | undefined): string {
  return value?.trim() ?? '';
}
