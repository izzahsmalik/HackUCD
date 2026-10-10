import {
  BadRequestException,
  Body,
  Controller,
  Post,
  UseGuards,
} from '@nestjs/common';
import { PremiumGuard } from '../payments/premium.guard.js';
import { AskResponse, QueryService } from './query.service.js';
import { QueryPlan } from './query-plan.js';

export interface AskQuestionDto {
  question: string;
  model?: string;
}

@Controller('query')
export class QueryController {
  constructor(private readonly queryService: QueryService) {}

  /**
   * Answers a natural-language question against the database. Pro-only:
   * the free diagnosis (dashboard, what-if) stays open; this makes LLM calls.
   */
  @Post()
  @UseGuards(PremiumGuard)
  ask(@Body() dto: AskQuestionDto): Promise<AskResponse> {
    const model = validateModel(dto);
    if (
      dto === null ||
      typeof dto !== 'object' ||
      typeof dto.question !== 'string' ||
      dto.question.trim().length === 0
    ) {
      throw new BadRequestException('question must be a non-empty string');
    }
    return this.queryService.ask(dto.question, model);
  }

  /** Dry-run: returns only the generated query plan, without executing. */
  @Post('plan')
  plan(@Body() dto: AskQuestionDto): Promise<{ plan: QueryPlan }> {
    const model = validateModel(dto);
    if (
      dto === null ||
      typeof dto !== 'object' ||
      typeof dto.question !== 'string' ||
      dto.question.trim().length === 0
    ) {
      throw new BadRequestException('question must be a non-empty string');
    }
    return this.queryService.planOnly(dto.question, model);
  }
}

/** Hand-rolled validation: this app uses no global ValidationPipe. */
function validateModel(dto: AskQuestionDto): string | undefined {
  if (dto === null || typeof dto !== 'object' || dto.model === undefined) {
    return undefined;
  }
  if (
    typeof dto.model !== 'string' ||
    dto.model.trim().length === 0 ||
    dto.model.length > 200
  ) {
    throw new BadRequestException(
      'model must be a non-empty string of at most 200 characters when provided',
    );
  }
  return dto.model.trim();
}
