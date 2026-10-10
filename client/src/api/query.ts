import { apiFetch } from './client'

// Natural-language questions, answered server-side via OpenRouter.
// Pro-only: a free user gets ApiError 403 from the PremiumGuard.

export interface AskResponse {
  answer: string
  plan: unknown
  data: unknown
}

export async function askQuestion(
  question: string,
  model?: string,
): Promise<AskResponse> {
  return apiFetch<AskResponse>('/query', {
    method: 'POST',
    body: JSON.stringify({ question, ...(model && { model }) }),
  })
}
