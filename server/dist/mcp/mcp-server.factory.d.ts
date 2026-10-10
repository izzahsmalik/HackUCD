import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { IngestService } from '../ingest/ingest.service.js';
export declare class McpServerFactory {
    private readonly ingestService;
    constructor(ingestService: IngestService);
    create(): McpServer;
}
