import { Module } from '@nestjs/common';
import { LlmModel } from './llm.model.js';

/**
 * Provides the default LlmModel (one model = one instance) for modules that
 * make AI calls. Tests override this token with a fake.
 */
@Module({
  providers: [
    {
      provide: LlmModel,
      useFactory: () => {
        const apiKey = process.env.OPENROUTER_API_KEY;
        if (!apiKey)
          throw new Error('OPENROUTER_API_KEY is required for LLM calls');
        return new LlmModel(
          process.env.OPENROUTER_MODEL ?? 'microsoft/microsoft-decision-1',
          {
            apiKey,
          },
        );
      },
    },
  ],
  exports: [LlmModel],
})
export class LlmModule {}
