import { IngestService } from './ingest.service.js';
export interface RunIngestDto {
    directory?: string;
}
export declare class IngestController {
    private readonly ingestService;
    constructor(ingestService: IngestService);
    run(dto: RunIngestDto): Promise<import("./ingest.service.js").IngestRunSummary>;
}
