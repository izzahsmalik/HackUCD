import { apiFetch } from './client'

// Booked transactions. amount is integer cents: negative = expense,
// positive = income.

export interface TransactionRow {
  id: number
  amount: number
  /** YYYY-MM-DD */
  date: string
}

export async function getTransactions(): Promise<TransactionRow[]> {
  return apiFetch<TransactionRow[]>('/transactions')
}
