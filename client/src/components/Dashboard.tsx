import { useCallback, useEffect, useState } from 'react'
import { getOutputMargins, type OutputMarginRow } from '../api/outputs'
import { getTransactions } from '../api/transactions'
import { CostBreakdownView } from './CostBreakdownView'
import { KpiRow, type Scenario } from './KpiRow'
import { NeedsAttentionFeed } from './NeedsAttentionFeed'
import { OutputCard } from './OutputCard'
import { WhatIfControls } from './WhatIfControls'

const POLL_MS = 5000

type PaneView = { kind: 'products' } | { kind: 'breakdown'; outputId: number }

/**
 * The margin dashboard: KPIs, needs-attention feed, product tracks, and the
 * what-if scenario controls. Margins are polled like the action queue —
 * resolving an action item (e.g. a new product price) changes them.
 */
export function Dashboard() {
  const [rows, setRows] = useState<OutputMarginRow[]>([])
  const [error, setError] = useState<string | null>(null)
  const [scenario, setScenario] = useState<Scenario | null>(null)
  const [pane, setPane] = useState<PaneView>({ kind: 'products' })
  const [incomeByMonth, setIncomeByMonth] = useState(new Map<string, number>())

  const load = useCallback(async () => {
    try {
      setRows(await getOutputMargins())
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }, [])

  useEffect(() => {
    void load()
    const timer = setInterval(() => void load(), POLL_MS)
    return () => clearInterval(timer)
  }, [load])

  useEffect(() => {
    // Income totals for the revenue KPI; transaction volume is demo-small.
    getTransactions()
      .then((transactions) => {
        const byMonth = new Map<string, number>()
        for (const transaction of transactions) {
          if (transaction.amount <= 0) continue
          const key = transaction.date.slice(0, 7)
          byMonth.set(key, (byMonth.get(key) ?? 0) + transaction.amount)
        }
        setIncomeByMonth(byMonth)
      })
      .catch(() => setIncomeByMonth(new Map()))
  }, [])

  const breakdownRow =
    pane.kind === 'breakdown'
      ? rows.find((row) => row.outputId === pane.outputId)
      : undefined

  return (
    <section className="flex flex-col gap-5">
      {error && <p className="text-sm text-red-400">{error}</p>}

      <KpiRow rows={rows} scenario={scenario} incomeByMonth={incomeByMonth} />

      <div>
        <h2 className="mb-2.5 text-sm font-semibold">Needs attention</h2>
        <NeedsAttentionFeed
          rows={rows}
          scenario={scenario}
          onBreakdown={(outputId) => setPane({ kind: 'breakdown', outputId })}
        />
      </div>

      {pane.kind === 'breakdown' && breakdownRow ? (
        <div>
          <h2 className="mb-2.5 text-sm font-semibold">
            {breakdownRow.name}: where the cost comes from
          </h2>
          <CostBreakdownView
            row={breakdownRow}
            onBack={() => setPane({ kind: 'products' })}
          />
        </div>
      ) : (
        <div>
          <h2 className="text-sm font-semibold">
            {scenario
              ? `If ${scenario.ingredient} ${scenario.pct >= 0 ? 'rises' : 'falls'} ${Math.abs(scenario.pct * 100).toFixed(0)}%`
              : 'Your products'}
          </h2>
          <p className="mb-2.5 mt-0.5 text-xs text-gray-500">
            Bar: margin. Dashed line: margin today (in a scenario). Light tick:
            your target.
          </p>
          {rows.length === 0 && !error && (
            <div className="rounded-xl border border-gray-800 bg-gray-900 px-4 py-3.5 text-sm text-gray-400">
              No outputs yet — create some via the importer or the API.
            </div>
          )}
          <div className="flex flex-col gap-2.5">
            {rows.map((row) => (
              <OutputCard
                key={row.outputId}
                row={row}
                scenario={scenario}
                onBreakdown={(outputId) =>
                  setPane({ kind: 'breakdown', outputId })
                }
              />
            ))}
          </div>
        </div>
      )}

      <WhatIfControls
        rows={rows}
        scenario={scenario}
        onScenario={setScenario}
      />
    </section>
  )
}
