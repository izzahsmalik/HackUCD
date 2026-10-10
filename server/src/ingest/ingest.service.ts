import { ConflictException, Injectable } from '@nestjs/common';
import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { ActionQueueService } from '../action-queue/action-queue.service.js';
import { ProductsIngestService } from './products-ingest.service.js';
import { TransactionsIngestService } from './transactions-ingest.service.js';
import { CsvRow, readCsvRows } from './csv-file.js';
import { FileClassifier, FileKind } from './file-classifier.js';
import { DEFAULT_INGEST_DIRECTORY } from './ingest.constants.js';
import { IngestFileResult } from './ingest-result.js';

export interface IngestFileSummary {
  fileName: string;
  kind: FileKind | null;
  rowsTotal: number;
  rowsPersisted: number;
  decisionsCreated: number;
  errors: string[];
}

export interface IngestRunSummary {
  files: IngestFileSummary[];
  pendingDecisions: number;
}

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
    if (this.running)
      throw new ConflictException('An ingest run is already in progress');
    this.running = true;
    try {
      return await this.runFiles(
        directory ?? process.env.INGEST_DIRECTORY ?? DEFAULT_INGEST_DIRECTORY,
      );
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
      const path = join(directory, fileName);
      const summary: IngestFileSummary = {
        fileName,
        kind: null,
        rowsTotal: 0,
        rowsPersisted: 0,
        decisionsCreated: 0,
        errors: [],
      };
      try {
        const rows = await readCsvRows(path);
        summary.rowsTotal = rows.length;
        summary.kind = await this.classifier.classify(fileName, rows);
        if (!summary.kind) {
          summary.errors.push(
            'could not determine whether the file is transactions or product pricing',
          );
          summaries.push(summary);
          continue;
        }
        const result = await this.ingestRows(summary.kind, fileName, rows);
        summary.rowsPersisted = result.rowsPersisted;
        summary.decisionsCreated = result.decisionsCreated;
        summary.errors = result.errors;
      } catch (error) {
        summary.errors.push(String(error));
      }
      summaries.push(summary);
    }

    return { files: summaries, pendingDecisions: this.actionQueue.count() };
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
