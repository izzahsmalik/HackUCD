export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/** JSON Schema for the desired object (OpenAI/OpenRouter json_schema format). */
export interface JsonSchema {
  type: 'object';
  properties: Record<string, unknown>;
  required?: readonly string[];
  additionalProperties: false;
}

export interface ChatOptions {
  temperature?: number;
  maxTokens?: number;
}

export interface LlmModelOptions {
  apiKey: string;
  /** OpenRouter base URL, without a trailing slash */
  baseUrl?: string;
  /** Injectable fetch for tests; defaults to the global */
  fetchImpl?: typeof fetch;
}

export class LlmError extends Error {
  constructor(
    readonly model: string,
    message: string,
    readonly status?: number,
    readonly raw?: string,
  ) {
    super(`[${model}] ${message}`);
    this.name = 'LlmError';
  }
}

interface Choice {
  message?: { content?: string | null };
}

interface ChatCompletionResponse {
  choices?: Choice[];
}

/**
 * Represents a single AI model reachable through OpenRouter. One instance = one
 * model name; create (or inject) separate instances to use different models.
 */
export class LlmModel {
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;

  constructor(
    readonly model: string,
    private readonly options: LlmModelOptions,
  ) {
    this.baseUrl = options.baseUrl ?? 'https://openrouter.ai/api/v1';
    this.fetchImpl = options.fetchImpl ?? globalThis.fetch.bind(globalThis);
  }

  /** One round-trip of chat messages; returns the assistant message content. */
  async chat(messages: ChatMessage[], opts?: ChatOptions): Promise<string> {
    const response = await this.fetchImpl(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.options.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        ...(opts?.temperature !== undefined && {
          temperature: opts.temperature,
        }),
        ...(opts?.maxTokens !== undefined && { max_tokens: opts.maxTokens }),
      }),
    });

    const raw = await response.text();
    if (!response.ok) {
      throw new LlmError(
        this.model,
        `HTTP ${response.status}`,
        response.status,
        raw,
      );
    }

    let parsed: ChatCompletionResponse;
    try {
      parsed = JSON.parse(raw) as ChatCompletionResponse;
    } catch {
      throw new LlmError(
        this.model,
        'response was not valid JSON',
        response.status,
        raw,
      );
    }
    const content = parsed.choices?.[0]?.message?.content;
    if (typeof content !== 'string') {
      throw new LlmError(
        this.model,
        'response had no assistant message content',
        response.status,
        raw,
      );
    }
    return content;
  }

  /** Convenience: a single user prompt. */
  async complete(prompt: string, opts?: ChatOptions): Promise<string> {
    return this.chat([{ role: 'user', content: prompt }], opts);
  }

  /**
   * Structured completion. Requests a strict json_schema via response_format;
   * if the model rejects response_format, retries once with the schema embedded
   * in a system instruction instead. Result is parsed to an object; callers own
   * deeper shape validation.
   */
  async chatJson<T>(
    messages: ChatMessage[],
    schema: JsonSchema,
    opts?: ChatOptions,
  ): Promise<T> {
    let content: string;
    try {
      content = await this.chatStructured(messages, schema, opts);
    } catch (error) {
      // Some models reject response_format; fall back to a prompt-embedded schema.
      if (
        error instanceof LlmError &&
        error.status !== undefined &&
        error.status >= 400 &&
        error.status < 500
      ) {
        content = await this.chat(
          [...messages, this.schemaFallbackMessage(schema)],
          opts,
        );
      } else {
        throw error;
      }
    }
    return this.parseJson<T>(content, messages, opts);
  }

  private async chatStructured(
    messages: ChatMessage[],
    schema: JsonSchema,
    opts?: ChatOptions,
  ): Promise<string> {
    const response = await this.fetchImpl(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.options.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        ...(opts?.temperature !== undefined && {
          temperature: opts.temperature,
        }),
        ...(opts?.maxTokens !== undefined && { max_tokens: opts.maxTokens }),
        response_format: {
          type: 'json_schema',
          json_schema: { name: 'response', strict: true, schema },
        },
      }),
    });

    const raw = await response.text();
    if (!response.ok) {
      throw new LlmError(
        this.model,
        `HTTP ${response.status}`,
        response.status,
        raw,
      );
    }

    let parsed: ChatCompletionResponse;
    try {
      parsed = JSON.parse(raw) as ChatCompletionResponse;
    } catch {
      throw new LlmError(
        this.model,
        'response was not valid JSON',
        response.status,
        raw,
      );
    }
    const content = parsed.choices?.[0]?.message?.content;
    if (typeof content !== 'string') {
      throw new LlmError(
        this.model,
        'response had no assistant message content',
        response.status,
        raw,
      );
    }
    return content;
  }

  private schemaFallbackMessage(schema: JsonSchema): ChatMessage {
    return {
      role: 'system',
      content:
        `Respond with a single JSON object (no markdown, no commentary) matching this schema:\n` +
        JSON.stringify(schema),
    };
  }

  private async parseJson<T>(
    content: string,
    messages: ChatMessage[],
    opts?: ChatOptions,
  ): Promise<T> {
    const parsed = this.tryParse(content) as T | undefined;
    if (parsed !== undefined) return parsed;

    // One retry with an explicit JSON-only instruction before giving up.
    const retry = await this.chat(
      [
        ...messages,
        {
          role: 'user',
          content: 'Respond with valid JSON only. No markdown, no commentary.',
        },
      ],
      opts,
    );
    const reparsed = this.tryParse(retry) as T | undefined;
    if (reparsed !== undefined) return reparsed;
    throw new LlmError(
      this.model,
      'response was not parseable JSON',
      undefined,
      retry,
    );
  }

  private tryParse(content: string): unknown {
    // Strip markdown fences if the model wrapped the JSON in them.
    const stripped = content
      .trim()
      .replace(/^```(?:json)?\s*\n?/, '')
      .replace(/\n?```\s*$/, '');
    try {
      const value: unknown = JSON.parse(stripped);
      if (value !== null && typeof value === 'object') return value;
      return undefined;
    } catch {
      return undefined;
    }
  }
}
