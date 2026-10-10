var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { ConflictException, Injectable } from '@nestjs/common';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { IngestService } from '../ingest/ingest.service.js';
const SERVER_NAME = 'hackucd-ingest';
const SERVER_VERSION = '0.0.1';
let McpServerFactory = class McpServerFactory {
    ingestService;
    constructor(ingestService) {
        this.ingestService = ingestService;
    }
    create() {
        const server = new McpServer({
            name: SERVER_NAME,
            version: SERVER_VERSION,
        });
        server.registerTool('ingest_csv', {
            title: 'Ingest CSV',
            description: 'Ingest CSV text (a list of financial transactions or current product ' +
                'pricing). The file kind is auto-detected; rows are parsed and persisted ' +
                'and low-confidence rows land in the review queue.',
            inputSchema: {
                csv: z
                    .string()
                    .min(1)
                    .describe('Full CSV content including the header row'),
                fileName: z
                    .string()
                    .optional()
                    .describe('Original file name, used as a hint when classifying the file'),
            },
        }, async ({ csv, fileName }) => {
            try {
                const summary = await this.ingestService.ingestCsv(fileName ?? 'upload.csv', csv);
                return textResult(JSON.stringify(summary, null, 2));
            }
            catch (error) {
                const message = error instanceof ConflictException
                    ? 'An ingest run is already in progress; retry shortly.'
                    : String(error);
                return { isError: true, content: [{ type: 'text', text: message }] };
            }
        });
        return server;
    }
};
McpServerFactory = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [IngestService])
], McpServerFactory);
export { McpServerFactory };
function textResult(text) {
    return { content: [{ type: 'text', text }] };
}
//# sourceMappingURL=mcp-server.factory.js.map