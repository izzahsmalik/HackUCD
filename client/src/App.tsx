import { useCallback, useEffect, useState } from 'react'
import { ApiError } from './api/client'
import { createCheckoutSession, getPaymentStatus } from './api/payments'
import { ActionQueuePanel } from './components/ActionQueuePanel'
import { ChatBar } from './components/ChatBar'
import { Dashboard } from './components/Dashboard'
import { GreetingHeader } from './components/GreetingHeader'
import { CHAT_MODELS } from './lib/models'

type Phase = 'loading' | 'free' | 'premium' | 'error'

// After the Stripe redirect the webhook may land a moment later, so poll a
// few times before settling on the (still free) status.
const POLL_ATTEMPTS = 5
const POLL_INTERVAL_MS = 1500

function App() {
  const [phase, setPhase] = useState<Phase>('loading')
  const [error, setError] = useState<string | null>(null)
  const [upgrading, setUpgrading] = useState(false)
  const [model, setModel] = useState(CHAT_MODELS[0].id)

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
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-5 px-5 pb-48 py-8 text-gray-100">
      <GreetingHeader
        isPremium={phase === 'premium'}
        model={model}
        onModelChange={setModel}
      />

      <ActionQueuePanel />

      {phase === 'loading' && <p className="text-gray-400">Loading…</p>}

      {phase === 'error' && (
        <p className="text-red-400">{error}</p>
      )}

      {/* The diagnosis renders in every phase — only the chat is Pro-gated. */}
      <Dashboard />

      {phase === 'premium' && (
        <div className="rounded-xl border border-emerald-700 bg-emerald-950 px-8 py-6 text-center">
          <p className="text-lg font-semibold text-emerald-400">Pro plan</p>
          <p className="mt-1 text-sm text-gray-400">
            Thanks for subscribing — premium features are unlocked.
          </p>
        </div>
      )}

      {phase === 'free' && (
        <div className="rounded-xl border border-indigo-800 bg-gray-900 px-8 py-6">
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

      <p className="text-xs text-gray-500">
        Costs are recorded unit costs with VAT excluded. Margin is profit as a
        share of price, not markup. A target-margin price is not a prediction of
        what customers will accept. Scenarios are “what if” tests, not
        forecasts.
      </p>

      <ChatBar
        model={model}
        isPremium={phase === 'premium'}
        onUpgrade={upgrade}
      />
    </main>
  )
}

export default App
