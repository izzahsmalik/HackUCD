export interface CheckoutSessionDto {
  /** Where Stripe redirects after a successful payment. */
  successUrl?: string;
  /** Where Stripe redirects if the customer aborts checkout. */
  cancelUrl?: string;
}

export interface DevCompleteDto {
  /** Desired flag state; defaults to enabling premium. */
  isPremium?: boolean;
}
