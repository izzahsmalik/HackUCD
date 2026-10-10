import { readFile } from 'node:fs/promises';
import Papa from 'papaparse';

export type CsvRow = Record<string, string>;

/** Reads a CSV file from disk and parses it into header-keyed string rows. */
export async function readCsvRows(path: string): Promise<CsvRow[]> {
  return parseCsvText(await readFile(path, 'utf8'), path);
}

/**
 * Parses CSV text into header-keyed string rows. `label` names the source in
 * error messages (a path, an upload name, ...).
 */
export function parseCsvText(text: string, label = 'input'): CsvRow[] {
  // Excel-exported CSVs often start with a UTF-8 BOM; drop it so the first
  // header name does not carry an invisible prefix.
  const parsed = Papa.parse<CsvRow>(text.replace(/^﻿/, ''), {
    header: true,
    skipEmptyLines: true,
  });
  if (parsed.errors.length > 0) {
    const first = parsed.errors[0];
    throw new Error(
      `Failed to parse ${label}: ${first.message} (row ${first.row ?? '?'})`,
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
