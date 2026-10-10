// Duplicated from server/src/action-queue/decision.ts — no shared package; keep in sync.
// Dates cross the wire as ISO strings, so they are typed as strings here.

export interface DecisionAction {
  id: string
  label: string
  /** Field names and types the action expects, for rendering generic forms. */
  payload?: Record<string, 'number' | 'string'>
}

export interface DecisionView {
  id: number
  type: string
  summary: string
  actions: DecisionAction[]
  data: unknown
}

// Mirrors server/src/action-queue/product-decision.ts
export interface ProductDecisionData {
  rowIndex: number
  fileName: string
  rawRow: Record<string, string>
  productName: string
  amountCents: number
  setAt: string
  candidateProducts: { id: number; name: string; brandName: string }[]
  confidence: number
}

// Mirrors server/src/action-queue/transaction-decision.ts
export interface TransactionDecisionData {
  rowIndex: number
  fileName: string
  rawRow: Record<string, string>
  amountCents: number
  date: string
  suggestedCategoryName: string
  confidence: number
  existingCategories: { id: number; name: string }[]
  groupId: number
}

export function isProductDecision(decision: DecisionView): boolean {
  return decision.type === 'product'
}

export function isTransactionDecision(decision: DecisionView): boolean {
  return decision.type === 'transaction'
}
