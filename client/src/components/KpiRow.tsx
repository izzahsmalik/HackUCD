import type { OutputMarginRow } from '../api/outputs'
import { currentAndPriorMonthKeys, eur, pct } from '../lib/format'
import { TARGET_MARGIN, margin, scenarioCost } from '../lib/margin'
import { MarginTrack } from './MarginTrack'

export interface Scenario {
  ingredient: string
  /** Signed fraction, e.g. 0.15 for +15%. */
  pct: number
}

interface KpiRowProps {
  rows: OutputMarginRow[]
  /** Active scenario; when set, the KPIs reflect the adjusted costs. */
  scenario: Scenario | null
  /** Income per month key "YYYY-MM" in cents, from the transaction list. */
  incomeByMonth: Map<string, number>
}

const monthLabel = (key: string) => {
  const [y, m] = key.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleDateString('en-GB', {
    month: 'short',
    year: 'numeric',
  })
}

/** The three dashboard KPIs, reflecting the active what-if scenario. */
export function KpiRow({ rows, scenario, incomeByMonth }: KpiRowProps) {
  const margins = rows.map((row) => ({
    row,
    current: scenario
      ? margin(scenarioCost(row.latestProductPrices, scenario.ingredient, scenario.pct), row.salePriceCents)
      : margin(row.productCostCents, row.salePriceCents),
  }))
  const priced = margins.filter((x) => x.current !== null)
  const bad = priced.filter((x) => x.current! < TARGET_MARGIN)
  const worst = priced.reduce<
    (typeof priced)[number] | null
  >((acc, x) => (acc === null || acc.current! > x.current! ? acc : x), null)
  // Largest gap: how far the worst output sits below its target, in points.
  const largestGap =
    bad.length > 0
      ? Math.max(...bad.map((x) => TARGET_MARGIN - x.current!))
      : Math.max(...priced.map((x) => x.current! - TARGET_MARGIN), 0)

  const [thisMonth, priorMonth] = currentAndPriorMonthKeys()
  const thisIncome = incomeByMonth.get(thisMonth) ?? 0
  const priorIncome = incomeByMonth.get(priorMonth) ?? 0
  const incomeChange =
    priorIncome > 0 ? (thisIncome - priorIncome) / priorIncome : null

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <div className="rounded-xl border border-gray-800 bg-gray-900 px-4 py-3.5">
        <span className="text-xs font-medium text-gray-400">Below target</span>
        <b className="my-2 block text-2xl font-bold tracking-tight">
          {bad.length} of {priced.length}
        </b>
        <div className="flex gap-[3px]">
          {margins.map((x) => (
            <i
              key={x.row.outputId}
              className={`h-1.5 flex-1 rounded-sm ${
                x.current !== null && x.current < TARGET_MARGIN
                  ? 'bg-red-500'
                  : 'bg-gray-800'
              }`}
            />
          ))}
        </div>
        <span className="mt-2 block text-xs text-gray-500">
          {scenario
            ? 'products under target in this scenario'
            : 'products under their margin target'}
        </span>
      </div>

      <div className="rounded-xl border border-gray-800 bg-gray-900 px-4 py-3.5">
        <span className="text-xs font-medium text-gray-400">Largest gap</span>
        <b className="my-2 block text-2xl font-bold tracking-tight">
          {(largestGap * 100).toFixed(1)} pts
        </b>
        {worst && worst.current !== null && (
          <MarginTrack margin={worst.current} />
        )}
        <span className="mt-2 block text-xs text-gray-500">
          {worst
            ? `${worst.row.name}: ${pct(worst.current!)} vs ${TARGET_MARGIN * 100}% target`
            : 'No priced products yet'}
        </span>
      </div>

      <div className="rounded-xl border border-gray-800 bg-gray-900 px-4 py-3.5">
        <span className="text-xs font-medium text-gray-400">
          Income, {monthLabel(thisMonth)}
        </span>
        <b className="my-2 block text-2xl font-bold tracking-tight">
          {eur(thisIncome)}
          {incomeChange !== null && (
            <em
              className={`ml-2 text-xs font-semibold not-italic ${
                incomeChange >= 0 ? 'text-emerald-400' : 'text-red-400'
              }`}
            >
              {incomeChange >= 0 ? '▲' : '▼'}{' '}
              {Math.abs(incomeChange * 100).toFixed(1)}%
            </em>
          )}
        </b>
        <span className="mt-2 block text-xs text-gray-500">
          vs {monthLabel(priorMonth)} ({eur(priorIncome)}). From booked
          transactions.
        </span>
      </div>
    </div>
  )
}
