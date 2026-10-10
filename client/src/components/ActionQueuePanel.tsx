import { useCallback, useEffect, useState } from 'react'
import { apiFetch } from '../api/client'
import { listDecisions } from '../api/actionQueue'
import type { DecisionView } from '../types/decision'
import { DecisionCard, type BrandOption } from './DecisionCard'

const POLL_MS = 5000

/**
 * The review queue: pending LLM decisions polled from /action-queue, styled
 * after the "Action items" panel of the original static mock.
 */
export function ActionQueuePanel() {
  const [decisions, setDecisions] = useState<DecisionView[]>([])
  const [error, setError] = useState<string | null>(null)
  const [open, setOpen] = useState(true)
  const [resolvingId, setResolvingId] = useState<number | null>(null)
  const [brands, setBrands] = useState<BrandOption[] | null>(null)

  const load = useCallback(async () => {
    try {
      setDecisions(await listDecisions())
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }, [])

  useEffect(() => {
    void load()
    const timer = setInterval(() => {
      // Don't clobber in-flight resolves with a background refresh.
      setResolvingId((current) => {
        if (current === null) void load()
        return current
      })
    }, POLL_MS)
    return () => clearInterval(timer)
  }, [load])

  useEffect(() => {
    // Non-fatal: without brands the create-product action falls back to a
    // plain brand-id input.
    apiFetch<BrandOption[]>('/brands')
      .then(setBrands)
      .catch(() => setBrands(null))
  }, [])

  const onGone = useCallback(
    (id: number) => {
      setResolvingId(null)
      setDecisions((current) => current.filter((decision) => decision.id !== id))
      void load()
    },
    [load],
  )

  const pending = decisions.length

  return (
    <section className="overflow-hidden rounded-lg border border-gray-800 bg-gray-900">
      <button
        type="button"
        className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-gray-100"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
      >
        <b className="font-semibold">Action items</b>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
            pending
              ? 'bg-red-500/10 text-red-400'
              : 'bg-emerald-500/10 text-emerald-400'
          }`}
        >
          {pending ? `${pending} pending` : 'All resolved'}
        </span>
        <span className="ml-auto text-gray-500">{open ? '▾' : '▸'}</span>
      </button>

      {error && (
        <p className="border-t border-gray-800 px-4 py-3 text-sm text-red-400">
          {error}
        </p>
      )}

      {open && pending > 0 && (
        <ul className="border-t border-gray-800">
          {decisions.map((decision) => (
            <DecisionCard
              key={decision.id}
              decision={decision}
              brands={brands}
              disabled={resolvingId !== null && resolvingId !== decision.id}
              onBusy={setResolvingId}
              onGone={onGone}
            />
          ))}
        </ul>
      )}
    </section>
  )
}
