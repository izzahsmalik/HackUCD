import { IngestService } from './ingest.service.js';
import { IngestRunSummary } from './ingest-result.js';
export interface RunIngestDto {
    directory?: string;
}
export declare class IngestController {
    private readonly ingestService;
    constructor(ingestService: IngestService);
    run(dto: RunIngestDto): Promise<IngestRunSummary>;
    upload(file?: Express.Multer.File): Promise<IngestRunSummary>;
}
