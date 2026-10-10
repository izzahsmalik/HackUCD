import { Injectable } from '@nestjs/common';
import { LlmModel } from '../llm/llm.model.js';
import { CsvRow } from './csv-file.js';

export type FileKind = 'transactions' | 'products';

const TRANSACTION_HINTS = [
  'amount',
  'debit',
  'credit',
  'date',
  'balance',
  'description',
];
const PRODUCT_HINTS = ['price', 'cost', 'product', 'item', 'sku'];

/**
 * Decides whether a CSV is a list of transactions or a list of product
 * pricing. Uses header heuristics first; falls back to one LLM call with the
 * headers and a few sample rows. Returns null when the LLM cannot decide and
 * the heuristics were inconclusive.
 */
@Injectable()
export class FileClassifier {
  constructor(private readonly llm: LlmModel) {}

  async classify(fileName: string, rows: CsvRow[]): Promise<FileKind | null> {
    if (rows.length === 0) return null;
    const heuristic = classifyByHeaders(rows[0]);
    if (heuristic) return heuristic;
    return this.classifyWithLlm(fileName, rows);
  }

  private async classifyWithLlm(
    fileName: string,
    rows: CsvRow[],
  ): Promise<FileKind | null> {
    try {
      const result = await this.llm.chatJson<{ kind: FileKind }>(
        [
          {
            role: 'user',
            content:
              `A CSV file named "${fileName}" contains either a list of financial transactions ` +
              `or a list of current product pricing. Headers:\n` +
              `${Object.keys(rows[0] ?? {}).join(', ')}\n\nSample rows:\n` +
              rows
                .slice(0, 5)
                .map((row) => JSON.stringify(row))
                .join('\n'),
          },
        ],
        {
          type: 'object',
          properties: {
            kind: { type: 'string', enum: ['transactions', 'products'] },
          },
          required: ['kind'],
          additionalProperties: false,
        },
        { temperature: 0 },
      );
      return result.kind === 'transactions' || result.kind === 'products'
        ? result.kind
        : null;
    } catch {
      return null; // caller decides how to report the unclassifiable file
    }
  }
}

function classifyByHeaders(firstRow: CsvRow | undefined): FileKind | null {
  if (!firstRow) return null;
  const headers = Object.keys(firstRow).map((h) => h.toLowerCase());
  const has = (hints: string[]) => hints.some((hint) => headers.includes(hint));
  const isTransactions = has(TRANSACTION_HINTS);
  const isProducts = has(PRODUCT_HINTS);
  if (isTransactions && !isProducts) return 'transactions';
  if (isProducts && !isTransactions) return 'products';
  return null;
}
