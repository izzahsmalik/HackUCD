var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { BadRequestException, ConflictException, Injectable, NotFoundException, } from '@nestjs/common';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { ActionQueueService } from '../action-queue/action-queue.service.js';
import { IngestService } from '../ingest/ingest.service.js';
import { OutputsService } from '../outputs/outputs.service.js';
import { QueryService } from '../query/query.service.js';
import { QUERY_TOOL_DESCRIPTION, QUERY_TOOL_NAME, } from '../query/query-tool.js';
const SERVER_NAME = 'hackucd-ingest';
const SERVER_VERSION = '0.0.1';
let McpServerFactory = class McpServerFactory {
    ingestService;
    queryService;
    actionQueueService;
    outputsService;
    constructor(ingestService, queryService, actionQueueService, outputsService) {
        this.ingestService = ingestService;
        this.queryService = queryService;
        this.actionQueueService = actionQueueService;
        this.outputsService = outputsService;
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
        this.registerQueryTool(server);
        server.registerTool('list_pending_decisions', {
            title: 'List pending decisions',
            description: 'List the rows queued for human resolution. Each item is a decision ' +
                'view: { id, type, summary, actions, data }. Every action declares the ' +
                'payload fields it expects; pass them to resolve_decision to apply the ' +
                'chosen action and remove the decision from the queue.',
            inputSchema: {},
        }, async () => this.wrap(() => this.actionQueueService.list()));
        server.registerTool('get_decision', {
            title: 'Get a decision',
            description: 'Get one pending decision by id, including its full data (the raw CSV ' +
                'row, candidate products or existing categories).',
            inputSchema: {
                id: z
                    .number()
                    .int()
                    .positive()
                    .describe('Decision id from list_pending_decisions'),
            },
        }, async ({ id }) => this.wrap(() => this.actionQueueService.get(id)));
        server.registerTool('resolve_decision', {
            title: 'Resolve a decision',
            description: "Apply one of a decision's actions and remove it from the queue. " +
                "actionId must match one of the decision's action ids (e.g. " +
                'match-product, create-product, categorize, categorize-new, discard); ' +
                'payload must contain the fields that action declares.',
            inputSchema: {
                id: z.number().int().positive().describe('Decision id'),
                actionId: z
                    .string()
                    .min(1)
                    .describe("Action id from the decision's actions list"),
                payload: z
                    .record(z.string(), z.unknown())
                    .optional()
                    .describe('Payload fields the chosen action declares'),
            },
        }, async ({ id, actionId, payload }) => this.wrap(() => this.actionQueueService.resolve(id, actionId, payload)));
        server.registerTool('get_output_cost', {
            title: 'Get an output cost',
            description: 'Get the cost of one output by id: the latest product price for each ' +
                'dependent product plus the latest output price, broken down and summed.',
            inputSchema: {
                outputId: z
                    .number()
                    .int()
                    .positive()
                    .describe('Output id (see GET /outputs)'),
            },
        }, async ({ outputId }) => this.wrap(() => this.outputsService.getCost(outputId)));
        return server;
    }
    registerQueryTool(server) {
        server.registerTool(QUERY_TOOL_NAME, {
            title: 'Ask a financial question',
            description: QUERY_TOOL_DESCRIPTION,
            inputSchema: {
                question: z
                    .string()
                    .min(1)
                    .describe('Natural-language question, e.g. "How much did I spend on groceries last month?"'),
            },
        }, async ({ question }) => {
            try {
                const response = await this.queryService.ask(question);
                return textResult(JSON.stringify(response, null, 2));
            }
            catch (error) {
                const message = error instanceof BadRequestException
                    ? error.message
                    : String(error);
                return { isError: true, content: [{ type: 'text', text: message }] };
            }
        });
    }
    async wrap(apply) {
        try {
            const result = await apply();
            return textResult(JSON.stringify(result, null, 2));
        }
        catch (error) {
            let message;
            if (error instanceof NotFoundException) {
                message = 'Decision not found (it may already have been resolved).';
            }
            else if (error instanceof BadRequestException) {
                message = error.message;
            }
            else {
                message = String(error);
            }
            return errorResult(message);
        }
    }
};
McpServerFactory = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [IngestService,
        QueryService,
        ActionQueueService,
        OutputsService])
], McpServerFactory);
export { McpServerFactory };
function textResult(text) {
    return { content: [{ type: 'text', text }] };
}
function errorResult(text) {
    return {
        isError: true,
        content: [{ type: 'text', text }],
    };
}
//# sourceMappingURL=mcp-server.factory.js.map