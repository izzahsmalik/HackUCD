import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { IngestService } from '../ingest/ingest.service.js';
import { QueryService } from '../query/query.service.js';
import {
  QUERY_TOOL_DESCRIPTION,
  QUERY_TOOL_NAME,
} from '../query/query-tool.js';

const SERVER_NAME = 'hackucd-ingest';
const SERVER_VERSION = '0.0.1';

/**
 * Builds a stateless McpServer exposing the ingest pipeline and the
 * natural-language query service as tools. A fresh instance is created per
 * request by the controller, so no state is kept between MCP sessions.
 */
@Injectable()
export class McpServerFactory {
  constructor(
    private readonly ingestService: IngestService,
    private readonly queryService: QueryService,
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
}

function textResult(text: string) {
  return { content: [{ type: 'text' as const, text }] };
}
