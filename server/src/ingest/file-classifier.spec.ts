import { FileClassifier } from './file-classifier.js';
import type { LlmModel } from '../llm/llm.model.js';
import type { CsvRow } from './csv-file.js';

function makeClassifier(chatJson: LlmModel['chatJson']): FileClassifier {
  return new FileClassifier({ chatJson } as unknown as LlmModel);
}

describe('FileClassifier', () => {
  it('classifies by transaction-style headers without calling the LLM', async () => {
    const chatJson = vi.fn();
    const classifier = makeClassifier(chatJson as never);
    const rows: CsvRow[] = [
      { date: '2026-01-01', amount: '-4.50', description: 'Coffee' },
    ];
    await expect(classifier.classify('bank.csv', rows)).resolves.toBe(
      'transactions',
    );
    expect(chatJson).not.toHaveBeenCalled();
  });

  it('classifies by product-pricing headers without calling the LLM', async () => {
    const chatJson = vi.fn();
    const classifier = makeClassifier(chatJson as never);
    const rows: CsvRow[] = [{ item: 'Coffee', price: '4.50' }];
    await expect(classifier.classify('prices.csv', rows)).resolves.toBe(
      'products',
    );
    expect(chatJson).not.toHaveBeenCalled();
  });

  it('falls back to the LLM on ambiguous headers', async () => {
    const chatJson = vi.fn().mockResolvedValue({ kind: 'transactions' });
    const classifier = makeClassifier(chatJson as never);
    const rows: CsvRow[] = [{ when: '2026-01-01', what: 'Coffee' }];
    await expect(classifier.classify('mystery.csv', rows)).resolves.toBe(
      'transactions',
    );
    expect(chatJson).toHaveBeenCalledTimes(1);
    const [, schema] = chatJson.mock.calls[0]!;
    expect(schema.properties.kind).toMatchObject({
      enum: ['transactions', 'products'],
    });
  });

  it('returns null when the LLM call fails', async () => {
    const chatJson = vi.fn().mockRejectedValue(new Error('down'));
    const classifier = makeClassifier(chatJson as never);
    const rows: CsvRow[] = [{ when: '2026-01-01', what: 'Coffee' }];
    await expect(classifier.classify('mystery.csv', rows)).resolves.toBeNull();
  });

  it('returns null for an empty file', async () => {
    const chatJson = vi.fn().mockResolvedValue({ kind: 'products' });
    const classifier = makeClassifier(chatJson as never);
    await expect(classifier.classify('empty.csv', [])).resolves.toBeNull();
    expect(chatJson).not.toHaveBeenCalled();
  });
});
