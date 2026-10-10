import {
  Controller,
  Delete,
  Get,
  Injectable,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { McpServerFactory } from './mcp-server.factory.js';

/**
 * Exposes the MCP server over Streamable HTTP at POST /mcp.
 *
 * Stateless mode: every POST gets a fresh McpServer + transport, so there are
 * no sessions to track and GET (SSE) / DELETE (session teardown) are refused.
 */
@Controller('mcp')
@Injectable()
export class McpController {
  constructor(private readonly serverFactory: McpServerFactory) {}

  @Post()
  async handlePost(@Req() req: Request, @Res() res: Response): Promise<void> {
    try {
      const server = this.serverFactory.create();
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined,
      });
      res.on('close', () => {
        void transport.close();
        void server.close();
      });
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
    } catch (error) {
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: '2.0',
          error: { code: -32603, message: 'Internal server error' },
          id: null,
        });
      } else {
        // Headers already sent (streaming response): just end the stream.
        res.end(String(error));
      }
    }
  }

  @Get()
  handleGet(@Res() res: Response): void {
    methodNotAllowed(res);
  }

  @Delete()
  handleDelete(@Res() res: Response): void {
    methodNotAllowed(res);
  }
}

function methodNotAllowed(res: Response): void {
  res.status(405).json({
    jsonrpc: '2.0',
    error: { code: -32000, message: 'Method not allowed.' },
    id: null,
  });
}
