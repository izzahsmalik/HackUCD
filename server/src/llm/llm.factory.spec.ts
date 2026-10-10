import { LlmModelFactory } from './llm.factory.js';
import { LlmModel } from './llm.model.js';

describe('LlmModelFactory', () => {
  const factory = new LlmModelFactory();

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('builds an LlmModel for the requested model name', () => {
    vi.stubEnv('OPENROUTER_API_KEY', 'test-key');
    const llm = factory.create('openai/gpt-4o-mini');
    expect(llm).toBeInstanceOf(LlmModel);
    expect(llm.model).toBe('openai/gpt-4o-mini');
  });

  it('falls back to OPENROUTER_MODEL, then the built-in default', () => {
    vi.stubEnv('OPENROUTER_API_KEY', 'test-key');
    vi.stubEnv('OPENROUTER_MODEL', 'some/other-model');
    expect(factory.create().model).toBe('some/other-model');

    vi.stubEnv('OPENROUTER_MODEL', '');
    expect(factory.create().model).toBe('microsoft/microsoft-decision-1');
  });

  it('uses an explicit model over the env default', () => {
    vi.stubEnv('OPENROUTER_API_KEY', 'test-key');
    vi.stubEnv('OPENROUTER_MODEL', 'some/other-model');
    expect(factory.create('explicit/model').model).toBe('explicit/model');
  });

  it('throws without an API key', () => {
    vi.stubEnv('OPENROUTER_API_KEY', '');
    expect(() => factory.create()).toThrow('OPENROUTER_API_KEY is required');
  });
});
