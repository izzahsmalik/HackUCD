import { apiFetch } from './client'

// Output margins for the dashboard. OutputPrice is the output's sale price;
// Products are its ingredients, and their latest ProductPrices are the cost.

export interface LatestProductPrice {
  productId: number
  productName: string
  amountCents: number
  setAt: string
}

export interface OutputMarginRow {
  outputId: number
  name: string
  productCostCents: number
  salePriceCents: number | null
  /** (salePrice − cost) / salePrice; null when unpriced or free. */
  margin: number | null
  latestProductPrices: LatestProductPrice[]
}

export async function getOutputMargins(): Promise<OutputMarginRow[]> {
  return apiFetch<OutputMarginRow[]>('/outputs/margins')
}
