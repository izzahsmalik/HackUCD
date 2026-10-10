import { Injectable } from '@nestjs/common';
import { LlmModel } from './llm.model.js';

const DEFAULT_MODEL = 'microsoft/microsoft-decision-1';

/**
 * Builds LlmModel instances per request so a caller can pick which OpenRouter
 * model handles it. Config is read lazily (at create time, not module init)
 * so tests can stub env vars and so construction never throws at boot.
 */
@Injectable()
export class LlmModelFactory {
  /** One LlmModel for the given model name, or the configured default. */
  create(model?: string): LlmModel {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error('OPENROUTER_API_KEY is required for LLM calls');
    }
    return new LlmModel(
      model || process.env.OPENROUTER_MODEL || DEFAULT_MODEL,
      {
      apiKey,
      ...(process.env.OPENROUTER_BASE_URL && {
        baseUrl: process.env.OPENROUTER_BASE_URL,
      }),
    });
  }
}
