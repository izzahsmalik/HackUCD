import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { IngestService } from '../ingest/ingest.service.js';
import { QueryService } from '../query/query.service.js';
export declare class McpServerFactory {
    private readonly ingestService;
    private readonly queryService;
    constructor(ingestService: IngestService, queryService: QueryService);
    create(): McpServer;
    private registerQueryTool;
}
