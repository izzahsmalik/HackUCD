import { ActionQueueService } from '../action-queue/action-queue.service.js';
import { ProductsIngestService } from './products-ingest.service.js';
import { TransactionsIngestService } from './transactions-ingest.service.js';
import { FileClassifier } from './file-classifier.js';
import { IngestRunSummary } from './ingest-result.js';
export declare class IngestService {
    private readonly classifier;
    private readonly transactionsIngest;
    private readonly productsIngest;
    private readonly actionQueue;
    private running;
    constructor(classifier: FileClassifier, transactionsIngest: TransactionsIngestService, productsIngest: ProductsIngestService, actionQueue: ActionQueueService);
    run(directory?: string): Promise<IngestRunSummary>;
    ingestCsv(fileName: string, text: string): Promise<IngestRunSummary>;
    private exclusive;
    private runFiles;
    private processRows;
    private ingestRows;
}
