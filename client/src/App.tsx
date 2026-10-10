import { useCallback, useEffect, useState } from 'react'
import { ApiError } from './api/client'
import { createCheckoutSession, getPaymentStatus } from './api/payments'

type Phase = 'loading' | 'free' | 'premium' | 'error'

// After the Stripe redirect the webhook may land a moment later, so poll a
// few times before settling on the (still free) status.
const POLL_ATTEMPTS = 5
const POLL_INTERVAL_MS = 1500

function App() {
  const [phase, setPhase] = useState<Phase>('loading')
  const [error, setError] = useState<string | null>(null)
  const [upgrading, setUpgrading] = useState(false)

  const refresh = useCallback(async (poll = false) => {
    try {
      if (await getPaymentStatus().then((s) => s.isPremium)) {
        setPhase('premium')
        return
      }
      if (!poll) {
        setPhase('free')
        return
      }
      for (let attempt = 1; attempt < POLL_ATTEMPTS; attempt++) {
        await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS))
        if (await getPaymentStatus().then((s) => s.isPremium)) {
          setPhase('premium')
          return
        }
      }
      setPhase('free')
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not reach the server')
      setPhase('error')
    }
  }, [])

  useEffect(() => {
    // Success/cancel query params come back from Stripe Checkout; capture the
    // value, strip the params so a reload does not re-trigger the flow, then
    // poll on success in case the webhook lands shortly after the redirect.
    const params = new URLSearchParams(window.location.search)
    const payment = params.get('payment')
    if (payment !== null) {
      params.delete('payment')
      const query = params.toString()
      window.history.replaceState(
        null,
        '',
        `${window.location.pathname}${query ? `?${query}` : ''}`,
      )
    }
    void refresh(payment === 'success')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function upgrade() {
    setUpgrading(true)
    setError(null)
    try {
      const { url } = await createCheckoutSession()
      if (!url) throw new Error('Stripe did not return a checkout URL')
      window.location.href = url
    } catch (e) {
      setError(
        e instanceof ApiError
          ? e.message
          : e instanceof Error
            ? e.message
            : 'Something went wrong',
      )
      setUpgrading(false)
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-gray-950 px-6 text-gray-100">
      <h1 className="text-4xl font-bold tracking-tight">MarginGuard</h1>

      {phase === 'loading' && <p className="text-gray-400">Loading…</p>}

      {phase === 'error' && (
        <p className="max-w-md text-center text-red-400">{error}</p>
      )}

      {phase === 'premium' && (
        <div className="rounded-xl border border-emerald-700 bg-emerald-950 px-8 py-6 text-center">
          <p className="text-lg font-semibold text-emerald-400">Pro plan</p>
          <p className="mt-1 text-sm text-gray-400">
            Thanks for subscribing — premium features are unlocked.
          </p>
        </div>
      )}

      {phase === 'free' && (
        <div className="w-full max-w-md rounded-xl border border-indigo-800 bg-gray-900 px-8 py-6">
          <p className="text-sm font-medium text-indigo-400">Free plan</p>
          <h2 className="mt-1 text-lg font-semibold">
            MarginGuard Pro — €4.99/month
          </h2>
          <p className="mt-1 text-sm text-gray-400">
            3- and 6-month scenarios, every product ranked by risk, 50 AI
            requests a month. Your free diagnosis always stays visible.
          </p>
          <button
            type="button"
            onClick={upgrade}
            disabled={upgrading}
            className="mt-4 w-full rounded-lg bg-indigo-600 px-4 py-2 font-semibold hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {upgrading ? 'Redirecting to Stripe…' : 'Upgrade to Pro'}
          </button>
          {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
        </div>
      )}
    </main>
  )
}

export default App
