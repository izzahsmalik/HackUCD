import { Module } from '@nestjs/common';
import { ActionQueueModule } from '../action-queue/action-queue.module.js';
import { IngestModule } from '../ingest/ingest.module.js';
import { OutputsModule } from '../outputs/outputs.module.js';
import { QueryModule } from '../query/query.module.js';
import { McpController } from './mcp.controller.js';
import { McpServerFactory } from './mcp-server.factory.js';

@Module({
  imports: [ActionQueueModule, IngestModule, OutputsModule, QueryModule],
  controllers: [McpController],
  providers: [McpServerFactory],
})
export class McpModule {}
