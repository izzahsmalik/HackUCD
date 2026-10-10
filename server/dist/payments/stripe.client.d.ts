export declare class StripeError extends Error {
    readonly status?: number | undefined;
    readonly raw?: string | undefined;
    constructor(message: string, status?: number | undefined, raw?: string | undefined);
}
export declare class StripeConfigurationError extends StripeError {
}
export declare class StripeSignatureError extends StripeError {
}
export interface CheckoutSessionInput {
    priceId: string;
    successUrl: string;
    cancelUrl: string;
}
export interface CheckoutSession {
    id: string;
    url: string | null;
}
export interface StripeEvent {
    id: string;
    type: string;
    data: {
        object: Record<string, unknown>;
    };
}
export interface StripeClientOptions {
    apiKey: string | null;
    webhookSecret: string | null;
    apiBaseUrl?: string;
    fetchImpl?: typeof fetch;
    now?: () => number;
    toleranceSeconds?: number;
}
export declare class StripeClient {
    private readonly options;
    private readonly apiBaseUrl;
    private readonly fetchImpl;
    private readonly now;
    private readonly toleranceSeconds;
    constructor(options: StripeClientOptions);
    createCheckoutSession(input: CheckoutSessionInput): Promise<CheckoutSession>;
    constructWebhookEvent(payload: string | Buffer, signatureHeader: string): StripeEvent;
    private parseSignatureHeader;
    private apiErrorMessage;
}
