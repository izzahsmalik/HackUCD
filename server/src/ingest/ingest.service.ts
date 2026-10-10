import { ConflictException, Injectable } from '@nestjs/common';
import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { ActionQueueService } from '../action-queue/action-queue.service.js';
import { ProductsIngestService } from './products-ingest.service.js';
import { TransactionsIngestService } from './transactions-ingest.service.js';
import { CsvRow, parseCsvText, readCsvRows } from './csv-file.js';
import { FileClassifier, FileKind } from './file-classifier.js';
import { DEFAULT_INGEST_DIRECTORY } from './ingest.constants.js';
import {
  IngestFileResult,
  IngestFileSummary,
  IngestRunSummary,
} from './ingest-result.js';

@Injectable()
export class IngestService {
  private running = false;

  constructor(
    private readonly classifier: FileClassifier,
    private readonly transactionsIngest: TransactionsIngestService,
    private readonly productsIngest: ProductsIngestService,
    private readonly actionQueue: ActionQueueService,
  ) {}

  /**
   * Scans a directory for .csv files and ingests each. Overlapping runs are
   * refused so a second run cannot double-insert rows while the first is
   * still awaiting LLM calls.
   */
  async run(directory?: string): Promise<IngestRunSummary> {
    return this.exclusive(() =>
      this.runFiles(
        directory ?? process.env.INGEST_DIRECTORY ?? DEFAULT_INGEST_DIRECTORY,
      ),
    );
  }

  /**
   * Ingests one CSV supplied in memory (an HTTP upload or an MCP tool call).
   * Shares the directory scan's overlap guard: both insert rows and issue LLM
   * calls, so only one may run at a time. Parse failures are reported in the
   * file summary rather than thrown.
   */
  async ingestCsv(fileName: string, text: string): Promise<IngestRunSummary> {
    return this.exclusive(async () => {
      const summary = emptySummary(fileName);
      try {
        const rows = parseCsvText(text, fileName);
        summary.rowsTotal = rows.length;
        Object.assign(summary, await this.processRows(fileName, rows));
      } catch (error) {
        summary.errors.push(String(error));
      }
      return { files: [summary], pendingDecisions: this.actionQueue.count() };
    });
  }

  /** Runs `fn` alone: refuses while another ingest is in progress. */
  private async exclusive<T>(fn: () => Promise<T>): Promise<T> {
    if (this.running)
      throw new ConflictException('An ingest run is already in progress');
    this.running = true;
    try {
      return await fn();
    } finally {
      this.running = false;
    }
  }

  private async runFiles(directory: string): Promise<IngestRunSummary> {
    const entries = await readdir(directory, { withFileTypes: true });
    const files = entries.filter(
      (e) => e.isFile() && e.name.toLowerCase().endsWith('.csv'),
    );

    const summaries: IngestFileSummary[] = [];
    for (const entry of files) {
      const fileName = entry.name;
      const summary = emptySummary(fileName);
      try {
        const rows = await readCsvRows(join(directory, fileName));
        summary.rowsTotal = rows.length;
        Object.assign(summary, await this.processRows(fileName, rows));
      } catch (error) {
        summary.errors.push(String(error));
      }
      summaries.push(summary);
    }

    return { files: summaries, pendingDecisions: this.actionQueue.count() };
  }

  private async processRows(
    fileName: string,
    rows: CsvRow[],
  ): Promise<Omit<IngestFileSummary, 'fileName' | 'rowsTotal'>> {
    const kind = await this.classifier.classify(fileName, rows);
    if (!kind) {
      return {
        kind: null,
        rowsPersisted: 0,
        decisionsCreated: 0,
        errors: [
          'could not determine whether the file is transactions or product pricing',
        ],
      };
    }
    const result: IngestFileResult = await this.ingestRows(
      kind,
      fileName,
      rows,
    );
    return {
      kind,
      rowsPersisted: result.rowsPersisted,
      decisionsCreated: result.decisionsCreated,
      errors: result.errors,
    };
  }

  private ingestRows(
    kind: FileKind,
    fileName: string,
    rows: CsvRow[],
  ): Promise<IngestFileResult> {
    return kind === 'transactions'
      ? this.transactionsIngest.ingest(fileName, rows)
      : this.productsIngest.ingest(fileName, rows);
  }
}

function emptySummary(fileName: string): IngestFileSummary {
  return {
    fileName,
    kind: null,
    rowsTotal: 0,
    rowsPersisted: 0,
    decisionsCreated: 0,
    errors: [],
  };
}
