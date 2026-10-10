import { apiFetch } from './client'

// MarginGuard Pro billing. Paths are relative to the /api prefix (see
// vite.config.ts proxy), so '/payments/...' reaches the backend's
// /payments/... routes.

export interface PaymentStatus {
  isPremium: boolean
}

export interface CheckoutSession {
  url: string | null
}

export async function getPaymentStatus(): Promise<PaymentStatus> {
  return apiFetch<PaymentStatus>('/payments/status')
}

export async function createCheckoutSession(): Promise<CheckoutSession> {
  return apiFetch<CheckoutSession>('/payments/checkout-session', {
    method: 'POST',
  })
}
