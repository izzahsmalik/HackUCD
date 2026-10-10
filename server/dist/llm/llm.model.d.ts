export interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}
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
    baseUrl?: string;
    fetchImpl?: typeof fetch;
}
export declare class LlmError extends Error {
    readonly model: string;
    readonly status?: number | undefined;
    readonly raw?: string | undefined;
    constructor(model: string, message: string, status?: number | undefined, raw?: string | undefined);
}
export declare class LlmModel {
    readonly model: string;
    private readonly options;
    private readonly baseUrl;
    private readonly fetchImpl;
    constructor(model: string, options: LlmModelOptions);
    chat(messages: ChatMessage[], opts?: ChatOptions): Promise<string>;
    complete(prompt: string, opts?: ChatOptions): Promise<string>;
    chatJson<T>(messages: ChatMessage[], schema: JsonSchema, opts?: ChatOptions): Promise<T>;
    private chatStructured;
    private schemaFallbackMessage;
    private parseJson;
    private tryParse;
}
