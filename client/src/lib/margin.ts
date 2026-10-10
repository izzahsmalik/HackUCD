import type { LatestProductPrice } from '../api/outputs'

/**
 * The margin target every output is judged against. No target is stored in
 * the database yet, so one constant stands in for the mock's per-product
 * targets; a targetMargin column would replace this one-liner.
 */
export const TARGET_MARGIN = 0.5

/** Margin as a share of the sale price; null when unpriced or free. */
export function margin(
  costCents: number,
  salePriceCents: number | null,
): number | null {
  if (salePriceCents === null || salePriceCents <= 0) return null
  return (salePriceCents - costCents) / salePriceCents
}

/** Cheapest sale price (in cents) that hits the target margin. */
export function minPriceCents(costCents: number, target = TARGET_MARGIN): number {
  return Math.ceil(costCents / (1 - target) * 100 - 1e-9) / 100
}

/** Track fill percentage, clamped so a healthy margin still shows headroom. */
export function trackWidth(marginFraction: number): number {
  return Math.max(0, Math.min(100, (marginFraction / 0.7) * 100))
}

/** True when the output is under the target margin. */
export function belowTarget(
  costCents: number,
  salePriceCents: number | null,
): boolean {
  const m = margin(costCents, salePriceCents)
  return m !== null && m < TARGET_MARGIN
}

/**
 * Product cost with a what-if scenario applied: every affected ingredient's
 * latest price is scaled by (1 + pct). An empty ingredient matches nothing.
 */
export function scenarioCost(
  prices: LatestProductPrice[],
  ingredient: string | null,
  pct: number,
): number {
  return prices.reduce(
    (sum, price) =>
      sum + price.amountCents * (price.productName === ingredient ? 1 + pct : 1),
    0,
  )
}
