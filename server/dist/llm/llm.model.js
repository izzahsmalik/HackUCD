export class LlmError extends Error {
    model;
    status;
    raw;
    constructor(model, message, status, raw) {
        super(`[${model}] ${message}`);
        this.model = model;
        this.status = status;
        this.raw = raw;
        this.name = 'LlmError';
    }
}
export class LlmModel {
    model;
    options;
    baseUrl;
    fetchImpl;
    constructor(model, options) {
        this.model = model;
        this.options = options;
        this.baseUrl = options.baseUrl ?? 'https://openrouter.ai/api/v1';
        this.fetchImpl = options.fetchImpl ?? globalThis.fetch.bind(globalThis);
    }
    async chat(messages, opts) {
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
            throw new LlmError(this.model, `HTTP ${response.status}`, response.status, raw);
        }
        let parsed;
        try {
            parsed = JSON.parse(raw);
        }
        catch {
            throw new LlmError(this.model, 'response was not valid JSON', response.status, raw);
        }
        const content = parsed.choices?.[0]?.message?.content;
        if (typeof content !== 'string') {
            throw new LlmError(this.model, 'response had no assistant message content', response.status, raw);
        }
        return content;
    }
    async complete(prompt, opts) {
        return this.chat([{ role: 'user', content: prompt }], opts);
    }
    async chatJson(messages, schema, opts) {
        let content;
        try {
            content = await this.chatStructured(messages, schema, opts);
        }
        catch (error) {
            if (error instanceof LlmError &&
                error.status !== undefined &&
                error.status >= 400 &&
                error.status < 500) {
                content = await this.chat([...messages, this.schemaFallbackMessage(schema)], opts);
            }
            else {
                throw error;
            }
        }
        return this.parseJson(content, messages, opts);
    }
    async chatStructured(messages, schema, opts) {
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
            throw new LlmError(this.model, `HTTP ${response.status}`, response.status, raw);
        }
        let parsed;
        try {
            parsed = JSON.parse(raw);
        }
        catch {
            throw new LlmError(this.model, 'response was not valid JSON', response.status, raw);
        }
        const content = parsed.choices?.[0]?.message?.content;
        if (typeof content !== 'string') {
            throw new LlmError(this.model, 'response had no assistant message content', response.status, raw);
        }
        return content;
    }
    schemaFallbackMessage(schema) {
        return {
            role: 'system',
            content: `Respond with a single JSON object (no markdown, no commentary) matching this schema:\n` +
                JSON.stringify(schema),
        };
    }
    async parseJson(content, messages, opts) {
        const parsed = this.tryParse(content);
        if (parsed !== undefined)
            return parsed;
        const retry = await this.chat([
            ...messages,
            {
                role: 'user',
                content: 'Respond with valid JSON only. No markdown, no commentary.',
            },
        ], opts);
        const reparsed = this.tryParse(retry);
        if (reparsed !== undefined)
            return reparsed;
        throw new LlmError(this.model, 'response was not parseable JSON', undefined, retry);
    }
    tryParse(content) {
        const stripped = content
            .trim()
            .replace(/^```(?:json)?\s*\n?/, '')
            .replace(/\n?```\s*$/, '');
        try {
            const value = JSON.parse(stripped);
            if (value !== null && typeof value === 'object')
                return value;
            return undefined;
        }
        catch {
            return undefined;
        }
    }
}
//# sourceMappingURL=llm.model.js.map