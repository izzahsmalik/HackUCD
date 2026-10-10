import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { ActionQueueService } from './action-queue.service.js';

export interface ResolveDecisionDto {
  /** Id of the action to apply (from the decision's actions list) */
  actionId: string;
  /** Payload fields the action declares */
  payload?: Record<string, unknown>;
}

@Controller('action-queue')
export class ActionQueueController {
  constructor(private readonly actionQueueService: ActionQueueService) {}

  @Get()
  list() {
    return this.actionQueueService.list();
  }

  @Get(':id')
  get(@Param('id', ParseIntPipe) id: number) {
    return this.actionQueueService.get(id);
  }

  @Post(':id/resolve')
  async resolve(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ResolveDecisionDto,
  ) {
    if (typeof dto?.actionId !== 'string' || dto.actionId.trim().length === 0) {
      throw new BadRequestException('actionId must be a non-empty string');
    }
    return this.actionQueueService.resolve(id, dto.actionId, dto.payload);
  }
}
