import { ChatMessage, LlmError, LlmModel } from './llm.model.js';

/** Builds a fetch stub returning an OpenAI-style chat completion. */
function completionResponse(content: string, status = 200): Response {
  return new Response(
    JSON.stringify({ choices: [{ message: { role: 'assistant', content } }] }),
    { status },
  );
}

const SCHEMA = {
  type: 'object',
  properties: { name: { type: 'string' } },
  required: ['name'],
  additionalProperties: false,
} as const;

const MESSAGES: ChatMessage[] = [
  { role: 'user', content: 'What is the name?' },
];

function makeLlm(fetchImpl: typeof fetch): LlmModel {
  return new LlmModel('test/model', { apiKey: 'test-key', fetchImpl });
}

describe('LlmModel', () => {
  it('chat returns the assistant message content', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(completionResponse('Hello!'));
    const llm = makeLlm(fetchImpl);
    await expect(llm.chat(MESSAGES)).resolves.toBe('Hello!');
    expect(fetchImpl).toHaveBeenCalledWith(
      'https://openrouter.ai/api/v1/chat/completions',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ Authorization: 'Bearer test-key' }),
      }),
    );
  });

  it('chat includes temperature and max_tokens when given', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(completionResponse('ok'));
    const llm = makeLlm(fetchImpl);
    await llm.chat(MESSAGES, { temperature: 0.2, maxTokens: 100 });
    const body = JSON.parse(
      vi.mocked(fetchImpl).mock.calls[0]![1]!.body as string,
    );
    expect(body).toMatchObject({
      model: 'test/model',
      temperature: 0.2,
      max_tokens: 100,
    });
  });

  it('chat throws LlmError with status on non-2xx', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(new Response('rate limited', { status: 429 }));
    const llm = makeLlm(fetchImpl);
    await expect(llm.chat(MESSAGES)).rejects.toMatchObject({
      name: 'LlmError',
      status: 429,
      raw: 'rate limited',
    });
  });

  it('complete sends a single user message', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(completionResponse('pong'));
    const llm = makeLlm(fetchImpl);
    await expect(llm.complete('ping')).resolves.toBe('pong');
    const body = JSON.parse(
      vi.mocked(fetchImpl).mock.calls[0]![1]!.body as string,
    );
    expect(body.messages).toEqual([{ role: 'user', content: 'ping' }]);
  });

  describe('chatJson', () => {
    it('sends a response_format json_schema and parses the object', async () => {
      const fetchImpl = vi
        .fn()
        .mockResolvedValue(completionResponse('{"name":"Acme"}'));
      const llm = makeLlm(fetchImpl);
      await expect(llm.chatJson(MESSAGES, SCHEMA)).resolves.toEqual({
        name: 'Acme',
      });
      const body = JSON.parse(
        vi.mocked(fetchImpl).mock.calls[0]![1]!.body as string,
      );
      expect(body.response_format).toEqual({
        type: 'json_schema',
        json_schema: { name: 'response', strict: true, schema: SCHEMA },
      });
    });

    it('strips markdown fences around the JSON', async () => {
      const fetchImpl = vi
        .fn()
        .mockResolvedValue(completionResponse('```json\n{"name":"Acme"}\n```'));
      const llm = makeLlm(fetchImpl);
      await expect(llm.chatJson(MESSAGES, SCHEMA)).resolves.toEqual({
        name: 'Acme',
      });
    });

    it('falls back to a prompt-embedded schema when response_format is rejected', async () => {
      const fetchImpl = vi
        .fn()
        .mockResolvedValueOnce(
          new Response('response_format unsupported', { status: 400 }),
        )
        .mockResolvedValueOnce(completionResponse('{"name":"Acme"}'));
      const llm = makeLlm(fetchImpl);
      await expect(llm.chatJson(MESSAGES, SCHEMA)).resolves.toEqual({
        name: 'Acme',
      });
      expect(fetchImpl).toHaveBeenCalledTimes(2);
      const retryBody = JSON.parse(
        vi.mocked(fetchImpl).mock.calls[1]![1]!.body as string,
      );
      expect(retryBody.response_format).toBeUndefined();
      // The schema is embedded in the fallback system message instead.
      expect(JSON.stringify(retryBody.messages)).toContain(
        'Respond with a single JSON object',
      );
    });

    it('does not fall back on server errors', async () => {
      const fetchImpl = vi
        .fn()
        .mockResolvedValue(new Response('boom', { status: 500 }));
      const llm = makeLlm(fetchImpl);
      await expect(llm.chatJson(MESSAGES, SCHEMA)).rejects.toMatchObject({
        status: 500,
      });
      expect(fetchImpl).toHaveBeenCalledTimes(1);
    });

    it('retries once with a JSON-only instruction on malformed output', async () => {
      const fetchImpl = vi
        .fn()
        .mockResolvedValueOnce(completionResponse('not json at all'))
        .mockResolvedValueOnce(completionResponse('{"name":"Acme"}'));
      const llm = makeLlm(fetchImpl);
      await expect(llm.chatJson(MESSAGES, SCHEMA)).resolves.toEqual({
        name: 'Acme',
      });
      expect(fetchImpl).toHaveBeenCalledTimes(2);
    });

    it('throws LlmError when output stays malformed after the retry', async () => {
      // A fresh Response per call: a Response body can only be consumed once.
      const fetchImpl = vi
        .fn()
        .mockImplementation(async () => completionResponse('still not json'));
      const llm = makeLlm(fetchImpl);
      await expect(llm.chatJson(MESSAGES, SCHEMA)).rejects.toBeInstanceOf(
        LlmError,
      );
      expect(fetchImpl).toHaveBeenCalledTimes(2);
    });

    it('throws when the model returns a JSON scalar instead of an object', async () => {
      const fetchImpl = vi
        .fn()
        .mockResolvedValueOnce(completionResponse('"just a string"'))
        .mockResolvedValueOnce(completionResponse('"still a string"'));
      const llm = makeLlm(fetchImpl);
      await expect(llm.chatJson(MESSAGES, SCHEMA)).rejects.toBeInstanceOf(
        LlmError,
      );
    });
  });
});
