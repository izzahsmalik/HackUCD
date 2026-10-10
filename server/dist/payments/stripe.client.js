import { createHmac, timingSafeEqual } from 'node:crypto';
export class StripeError extends Error {
    status;
    raw;
    constructor(message, status, raw) {
        super(message);
        this.status = status;
        this.raw = raw;
        this.name = 'StripeError';
    }
}
export class StripeConfigurationError extends StripeError {
}
export class StripeSignatureError extends StripeError {
}
export class StripeClient {
    options;
    apiBaseUrl;
    fetchImpl;
    now;
    toleranceSeconds;
    constructor(options) {
        this.options = options;
        this.apiBaseUrl = options.apiBaseUrl ?? 'https://api.stripe.com';
        this.fetchImpl = options.fetchImpl ?? globalThis.fetch.bind(globalThis);
        this.now = options.now ?? (() => Math.floor(Date.now() / 1000));
        this.toleranceSeconds = options.toleranceSeconds ?? 300;
    }
    async createCheckoutSession(input) {
        const apiKey = this.options.apiKey;
        if (!apiKey) {
            throw new StripeConfigurationError('STRIPE_SECRET_KEY is not configured');
        }
        const body = new URLSearchParams({
            mode: 'subscription',
            'line_items[0][price]': input.priceId,
            'line_items[0][quantity]': '1',
            success_url: input.successUrl,
            cancel_url: input.cancelUrl,
        });
        const response = await this.fetchImpl(`${this.apiBaseUrl}/v1/checkout/sessions`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${apiKey}`,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: body.toString(),
        });
        const raw = await response.text();
        if (!response.ok) {
            throw new StripeError(this.apiErrorMessage(raw, `HTTP ${response.status}`), response.status, raw);
        }
        let parsed;
        try {
            parsed = JSON.parse(raw);
        }
        catch {
            throw new StripeError('response was not valid JSON', response.status, raw);
        }
        if (typeof parsed.id !== 'string') {
            throw new StripeError('response had no session id', response.status, raw);
        }
        return { id: parsed.id, url: parsed.url ?? null };
    }
    constructWebhookEvent(payload, signatureHeader) {
        const webhookSecret = this.options.webhookSecret;
        if (!webhookSecret) {
            throw new StripeConfigurationError('STRIPE_WEBHOOK_SECRET is not configured');
        }
        const { timestamp, signatures } = this.parseSignatureHeader(signatureHeader);
        if (signatures.length === 0) {
            throw new StripeSignatureError('stripe-signature header contained no v1 signature');
        }
        const payloadText = typeof payload === 'string' ? payload : payload.toString('utf8');
        const expected = createHmac('sha256', webhookSecret)
            .update(`${timestamp}.${payloadText}`)
            .digest('hex');
        if (!signatures.some((signature) => safeHexEqual(signature, expected))) {
            throw new StripeSignatureError('webhook signature mismatch');
        }
        const ageSeconds = Math.max(0, this.now()) - timestamp;
        if (Math.abs(ageSeconds) > this.toleranceSeconds) {
            throw new StripeSignatureError('webhook timestamp outside tolerance');
        }
        try {
            return JSON.parse(payloadText);
        }
        catch {
            throw new StripeError('webhook payload was not valid JSON');
        }
    }
    parseSignatureHeader(signatureHeader) {
        let timestamp = Number.NaN;
        const signatures = [];
        for (const part of signatureHeader.split(/[,\s]+/)) {
            const eq = part.indexOf('=');
            if (eq <= 0)
                continue;
            const key = part.slice(0, eq);
            const value = part.slice(eq + 1);
            if (key === 't') {
                timestamp = Number(value);
            }
            else if (key === 'v1' && value.length > 0) {
                signatures.push(value);
            }
        }
        if (!Number.isInteger(timestamp)) {
            throw new StripeSignatureError('stripe-signature header had no valid t timestamp');
        }
        return { timestamp, signatures };
    }
    apiErrorMessage(raw, fallback) {
        try {
            const parsed = JSON.parse(raw);
            return parsed.error?.message ?? fallback;
        }
        catch {
            return fallback;
        }
    }
}
function safeHexEqual(a, b) {
    const left = hexDecode(a);
    const right = hexDecode(b);
    if (left === null || right === null || left.length !== right.length) {
        return false;
    }
    return timingSafeEqual(left, right);
}
function hexDecode(value) {
    if (!/^[0-9a-f]+$/i.test(value) || value.length % 2 !== 0)
        return null;
    return Buffer.from(value, 'hex');
}
//# sourceMappingURL=stripe.client.js.map