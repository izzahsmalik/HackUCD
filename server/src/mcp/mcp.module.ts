import { Module } from '@nestjs/common';
import { ActionQueueModule } from '../action-queue/action-queue.module.js';
import { IngestModule } from '../ingest/ingest.module.js';
import { McpController } from './mcp.controller.js';
import { McpServerFactory } from './mcp-server.factory.js';

@Module({
  imports: [ActionQueueModule, IngestModule],
  controllers: [McpController],
  providers: [McpServerFactory],
})
export class McpModule {}
