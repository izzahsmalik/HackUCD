import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { ActionQueueService } from '../action-queue/action-queue.service.js';
import { IngestService } from '../ingest/ingest.service.js';
import { QueryService } from '../query/query.service.js';
import {
  QUERY_TOOL_DESCRIPTION,
  QUERY_TOOL_NAME,
} from '../query/query-tool.js';

const SERVER_NAME = 'hackucd-ingest';
const SERVER_VERSION = '0.0.1';

/**
 * Builds a stateless McpServer exposing the ingest pipeline, the
 * natural-language query service and the review queue as tools. A fresh
 * instance is created per request by the controller, so no state is kept
 * between MCP sessions.
 */
@Injectable()
export class McpServerFactory {
  constructor(
    private readonly ingestService: IngestService,
    private readonly queryService: QueryService,
    private readonly actionQueueService: ActionQueueService,
  ) {}

  create(): McpServer {
    const server = new McpServer({
      name: SERVER_NAME,
      version: SERVER_VERSION,
    });

    server.registerTool(
      'ingest_csv',
      {
        title: 'Ingest CSV',
        description:
          'Ingest CSV text (a list of financial transactions or current product ' +
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
            .describe(
              'Original file name, used as a hint when classifying the file',
            ),
        },
      },
      async ({ csv, fileName }) => {
        try {
          const summary = await this.ingestService.ingestCsv(
            fileName ?? 'upload.csv',
            csv,
          );
          return textResult(JSON.stringify(summary, null, 2));
        } catch (error) {
          const message =
            error instanceof ConflictException
              ? 'An ingest run is already in progress; retry shortly.'
              : String(error);
          return { isError: true, content: [{ type: 'text', text: message }] };
        }
      },
    );

    this.registerQueryTool(server);

    server.registerTool(
      'list_pending_decisions',
      {
        title: 'List pending decisions',
        description:
          'List the rows queued for human resolution. Each item is a decision ' +
          'view: { id, type, summary, actions, data }. Every action declares the ' +
          'payload fields it expects; pass them to resolve_decision to apply the ' +
          'chosen action and remove the decision from the queue.',
        inputSchema: {},
      },
      async () => this.wrap(() => this.actionQueueService.list()),
    );

    server.registerTool(
      'get_decision',
      {
        title: 'Get a decision',
        description:
          'Get one pending decision by id, including its full data (the raw CSV ' +
          'row, candidate products or existing categories).',
        inputSchema: {
          id: z
            .number()
            .int()
            .positive()
            .describe('Decision id from list_pending_decisions'),
        },
      },
      async ({ id }) => this.wrap(() => this.actionQueueService.get(id)),
    );

    server.registerTool(
      'resolve_decision',
      {
        title: 'Resolve a decision',
        description:
          "Apply one of a decision's actions and remove it from the queue. " +
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
      },
      async ({ id, actionId, payload }) =>
        this.wrap(() => this.actionQueueService.resolve(id, actionId, payload)),
    );

    return server;
  }

  private registerQueryTool(server: McpServer): void {
    server.registerTool(
      QUERY_TOOL_NAME,
      {
        title: 'Ask a financial question',
        description: QUERY_TOOL_DESCRIPTION,
        inputSchema: {
          question: z
            .string()
            .min(1)
            .describe(
              'Natural-language question, e.g. "How much did I spend on groceries last month?"',
            ),
        },
      },
      async ({ question }) => {
        try {
          const response = await this.queryService.ask(question);
          return textResult(JSON.stringify(response, null, 2));
        } catch (error) {
          const message =
            error instanceof BadRequestException
              ? error.message
              : String(error);
          return { isError: true, content: [{ type: 'text', text: message }] };
        }
      },
    );
  }

  /** Maps domain errors onto friendly MCP error results. */
  private async wrap(apply: () => unknown) {
    try {
      const result = await apply();
      return textResult(JSON.stringify(result, null, 2));
    } catch (error) {
      let message: string;
      if (error instanceof NotFoundException) {
        message = 'Decision not found (it may already have been resolved).';
      } else if (error instanceof BadRequestException) {
        message = error.message;
      } else {
        message = String(error);
      }
      return errorResult(message);
    }
  }
}

function textResult(text: string) {
  return { content: [{ type: 'text' as const, text }] };
}

function errorResult(text: string) {
  return {
    isError: true as const,
    content: [{ type: 'text' as const, text }],
  };
}
