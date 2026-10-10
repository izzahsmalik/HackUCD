import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { ActionQueueService } from '../action-queue/action-queue.service.js';
import { IngestService } from '../ingest/ingest.service.js';
import { QueryService } from '../query/query.service.js';
export declare class McpServerFactory {
    private readonly ingestService;
    private readonly queryService;
    private readonly actionQueueService;
    constructor(ingestService: IngestService, queryService: QueryService, actionQueueService: ActionQueueService);
    create(): McpServer;
    private registerQueryTool;
    private wrap;
}
