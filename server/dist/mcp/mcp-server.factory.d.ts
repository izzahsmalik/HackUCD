import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { ActionQueueService } from '../action-queue/action-queue.service.js';
import { IngestService } from '../ingest/ingest.service.js';
export declare class McpServerFactory {
    private readonly ingestService;
    private readonly actionQueueService;
    constructor(ingestService: IngestService, actionQueueService: ActionQueueService);
    create(): McpServer;
    private wrap;
}
