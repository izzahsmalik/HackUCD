import { Module } from '@nestjs/common';
import { ActionQueueController } from './action-queue.controller.js';
import { ActionQueueService } from './action-queue.service.js';

/**
 * In-memory decision queue; no database entities involved. Decisions receive
 * their repos from the ingest services that construct them.
 */
@Module({
  controllers: [ActionQueueController],
  providers: [ActionQueueService],
  exports: [ActionQueueService],
})
export class ActionQueueModule {}
