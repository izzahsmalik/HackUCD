import { Module } from '@nestjs/common';
import { IngestModule } from '../ingest/ingest.module.js';
import { QueryModule } from '../query/query.module.js';
import { McpController } from './mcp.controller.js';
import { McpServerFactory } from './mcp-server.factory.js';

@Module({
  imports: [IngestModule, QueryModule],
  controllers: [McpController],
  providers: [McpServerFactory],
})
export class McpModule {}
