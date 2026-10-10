import { apiFetch } from './client'
import type { DecisionView } from '../types/decision'

export interface ResolveBody {
  actionId: string
  payload?: Record<string, unknown>
}

export const listDecisions = () => apiFetch<DecisionView[]>('/action-queue')

export const getDecision = (id: number) =>
  apiFetch<DecisionView>(`/action-queue/${id}`)

export const resolveDecision = (id: number, body: ResolveBody) =>
  apiFetch<unknown>(`/action-queue/${id}/resolve`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
