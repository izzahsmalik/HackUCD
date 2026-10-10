import { ActionQueueService } from '../action-queue/action-queue.service.js';
import { ProductsIngestService } from './products-ingest.service.js';
import { TransactionsIngestService } from './transactions-ingest.service.js';
import { FileClassifier, FileKind } from './file-classifier.js';
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
export declare class IngestService {
    private readonly classifier;
    private readonly transactionsIngest;
    private readonly productsIngest;
    private readonly actionQueue;
    private running;
    constructor(classifier: FileClassifier, transactionsIngest: TransactionsIngestService, productsIngest: ProductsIngestService, actionQueue: ActionQueueService);
    run(directory?: string): Promise<IngestRunSummary>;
    private runFiles;
    private ingestRows;
}
