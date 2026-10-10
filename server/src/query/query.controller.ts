import { BadRequestException, Body, Controller, Post } from '@nestjs/common';
import { AskResponse, QueryService } from './query.service.js';
import { QueryPlan } from './query-plan.js';

export interface AskQuestionDto {
  question: string;
}

@Controller('query')
export class QueryController {
  constructor(private readonly queryService: QueryService) {}

  /** Answers a natural-language question against the database. */
  @Post()
  ask(@Body() dto: AskQuestionDto): Promise<AskResponse> {
    if (
      dto === null ||
      typeof dto !== 'object' ||
      typeof dto.question !== 'string' ||
      dto.question.trim().length === 0
    ) {
      throw new BadRequestException('question must be a non-empty string');
    }
    return this.queryService.ask(dto.question);
  }

  /** Dry-run: returns only the generated query plan, without executing it. */
  @Post('plan')
  plan(@Body() dto: AskQuestionDto): Promise<{ plan: QueryPlan }> {
    if (
      dto === null ||
      typeof dto !== 'object' ||
      typeof dto.question !== 'string' ||
      dto.question.trim().length === 0
    ) {
      throw new BadRequestException('question must be a non-empty string');
    }
    return this.queryService.planOnly(dto.question);
  }
}
