import { createHmac, timingSafeEqual } from 'node:crypto';

export class StripeError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly raw?: string,
  ) {
    super(message);
    this.name = 'StripeError';
  }
}

/** Stripe env config is missing; thrown lazily, only when an operation needs it. */
export class StripeConfigurationError extends StripeError {}

/** Webhook signature missing, tampered, or outside the tolerance window. */
export class StripeSignatureError extends StripeError {}

export interface CheckoutSessionInput {
  priceId: string;
  successUrl: string;
  cancelUrl: string;
}

export interface CheckoutSession {
  id: string;
  url: string | null;
}

/** Minimal subset of a Stripe event envelope; unknown fields are ignored. */
export interface StripeEvent {
  id: string;
  type: string;
  data: { object: Record<string, unknown> };
}

export interface StripeClientOptions {
  apiKey: string | null;
  webhookSecret: string | null;
  /** Stripe API root, without a trailing slash; overridable for tests. */
  apiBaseUrl?: string;
  /** Injectable fetch for tests; defaults to the global. */
  fetchImpl?: typeof fetch;
  /** Injectable clock for signature tolerance checks in tests. */
  now?: () => number;  toleranceSeconds?: number;
}

interface StripeApiError {
  error?: { message?: string };
}

/**
 * Minimal Stripe REST client: checkout session creation and webhook signature
 * verification via the official scheme (HMAC-SHA256 over `${t}.${payload}`).
 * Deliberately dependency-free and injectable so tests can stub fetch and time.
 */
export class StripeClient {
  private readonly apiBaseUrl: string;
  private readonly fetchImpl: typeof fetch;
  /** Injectable clock in epoch seconds (Stripe timestamps are seconds). */
  private readonly now: () => number;
  private readonly toleranceSeconds: number;

  constructor(private readonly options: StripeClientOptions) {
    this.apiBaseUrl = options.apiBaseUrl ?? 'https://api.stripe.com';
    this.fetchImpl = options.fetchImpl ?? globalThis.fetch.bind(globalThis);
    this.now = options.now ?? (() => Math.floor(Date.now() / 1000));
    this.toleranceSeconds = options.toleranceSeconds ?? 300;
  }

  /** Creates a one-time-payment checkout session with a single priced line item. */
  async createCheckoutSession(
    input: CheckoutSessionInput,
  ): Promise<CheckoutSession> {
    const apiKey = this.options.apiKey;
    if (!apiKey) {
      throw new StripeConfigurationError('STRIPE_SECRET_KEY is not configured');
    }

    const body = new URLSearchParams({
      // Premium is a recurring plan; STRIPE_PRICE_ID must be a recurring price.
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
      throw new StripeError(
        this.apiErrorMessage(raw, `HTTP ${response.status}`),
        response.status,
        raw,
      );
    }

    let parsed: { id?: string; url?: string | null };
    try {
      parsed = JSON.parse(raw) as { id?: string; url?: string | null };
    } catch {
      throw new StripeError(
        'response was not valid JSON',
        response.status,
        raw,
      );
    }
    if (typeof parsed.id !== 'string') {
      throw new StripeError('response had no session id', response.status, raw);
    }
    return { id: parsed.id, url: parsed.url ?? null };
  }

  /**
   * Verifies the Stripe-Signature header against the raw payload and parses it
   * into an event. Throws StripeSignatureError on any mismatch or staleness.
   */
  constructWebhookEvent(
    payload: string | Buffer,
    signatureHeader: string,
  ): StripeEvent {
    const webhookSecret = this.options.webhookSecret;
    if (!webhookSecret) {
      throw new StripeConfigurationError(
        'STRIPE_WEBHOOK_SECRET is not configured',
      );
    }

    const { timestamp, signatures } = this.parseSignatureHeader(signatureHeader);
    if (signatures.length === 0) {
      throw new StripeSignatureError(
        'stripe-signature header contained no v1 signature',
      );
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
      return JSON.parse(payloadText) as StripeEvent;
    } catch {
      throw new StripeError('webhook payload was not valid JSON');
    }
  }

  /** Parses `t=<unix-seconds>,v1=<hex>[,v1=<hex>...]` (separator may be space or comma). */
  private parseSignatureHeader(signatureHeader: string): {
    timestamp: number;
    signatures: string[];
  } {
    let timestamp = Number.NaN;
    const signatures: string[] = [];
    for (const part of signatureHeader.split(/[,\s]+/)) {
      const eq = part.indexOf('=');
      if (eq <= 0) continue;
      const key = part.slice(0, eq);
      const value = part.slice(eq + 1);
      if (key === 't') {
        timestamp = Number(value);
      } else if (key === 'v1' && value.length > 0) {
        signatures.push(value);
      }
    }
    if (!Number.isInteger(timestamp)) {
      throw new StripeSignatureError(
        'stripe-signature header had no valid t timestamp',
      );
    }
    return { timestamp, signatures };
  }

  private apiErrorMessage(raw: string, fallback: string): string {
    try {
      const parsed = JSON.parse(raw) as StripeApiError;
      return parsed.error?.message ?? fallback;
    } catch {
      return fallback;
    }
  }
}

/** Constant-time comparison of two hex digests; unequal shapes are a mismatch. */
function safeHexEqual(a: string, b: string): boolean {
  const left = hexDecode(a);
  const right = hexDecode(b);
  if (left === null || right === null || left.length !== right.length) {
    return false;
  }
  return timingSafeEqual(left, right);
}

function hexDecode(value: string): Buffer | null {
  // Buffer.from(..., 'hex') silently truncates bad input, so validate first.
  if (!/^[0-9a-f]+$/i.test(value) || value.length % 2 !== 0) return null;
  return Buffer.from(value, 'hex');
}
