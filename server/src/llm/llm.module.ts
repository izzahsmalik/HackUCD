import { Module } from '@nestjs/common';
import { LlmModel } from './llm.model.js';
import { LlmModelFactory } from './llm.factory.js';

/**
 * Provides the default LlmModel (one model = one instance) for modules that
 * make AI calls, plus LlmModelFactory for callers that pick a model per
 * request. Tests override the LlmModel token with a fake.
 */
@Module({
  providers: [
    LlmModelFactory,
    {
      provide: LlmModel,
      useFactory: (factory: LlmModelFactory) => factory.create(),
      inject: [LlmModelFactory],
    },
  ],
  exports: [LlmModel, LlmModelFactory],
})
export class LlmModule {}
