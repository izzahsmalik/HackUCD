const API_URL = import.meta.env.VITE_API_URL ?? '/api'

export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  })

  if (!response.ok) {
    // Nest error bodies carry a `message` field; surface it so validation
    // messages like "'productId' must be a positive integer" reach the UI.
    const body = await response.json().catch(() => null)
    const detail =
      typeof body?.message === 'string'
        ? `: ${body.message}`
        : Array.isArray(body?.message)
          ? `: ${body.message.join(', ')}`
          : ''
    throw new ApiError(
      response.status,
      `Request failed: ${response.status} ${response.statusText}${detail}`,
    )
  }

  return response.json() as Promise<T>
}
