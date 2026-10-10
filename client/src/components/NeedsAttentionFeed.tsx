import type { OutputMarginRow } from '../api/outputs'
import { eur, pct } from '../lib/format'
import { TARGET_MARGIN, margin, minPriceCents, scenarioCost } from '../lib/margin'
import type { Scenario } from './KpiRow'

interface NeedsAttentionFeedProps {
  rows: OutputMarginRow[]
  scenario: Scenario | null
  onBreakdown: (outputId: number) => void
}

/** Outputs sitting under the margin target, worst first. */
export function NeedsAttentionFeed({
  rows,
  scenario,
  onBreakdown,
}: NeedsAttentionFeedProps) {
  const items = rows
    .map((row) => {
      const cost = scenario
        ? scenarioCost(
            row.latestProductPrices,
            scenario.ingredient,
            scenario.pct,
          )
        : row.productCostCents
      return { row, cost, m: margin(cost, row.salePriceCents) }
    })
    .filter((x) => x.m !== null && x.m < TARGET_MARGIN)
    .sort((a, b) => a.m! - b.m!)

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-gray-800 bg-gray-900 px-4 py-3.5 text-sm text-gray-400">
        Every product meets its target margin.
      </div>
    )
  }

  return (
    <ul className="flex flex-col gap-2.5">
      {items.map(({ row, cost, m }) => (
        <li
          key={row.outputId}
          className="rounded-xl border border-gray-800 border-l-4 border-l-red-500 bg-gray-900 px-4 py-3"
        >
          <p className="text-sm text-gray-300">
            <b className="text-gray-100">{row.name}</b> is{' '}
            {((TARGET_MARGIN - m!) * 100).toFixed(1)} points below its{' '}
            {TARGET_MARGIN * 100}% target ({pct(m!)} now). Charge at least{' '}
            <b className="text-gray-100">{eur(minPriceCents(cost))}</b>; it is{' '}
            {eur(row.salePriceCents!)} today.
          </p>
          <button
            type="button"
            className="mt-1.5 px-0 font-semibold text-indigo-400 hover:text-indigo-300"
            onClick={() => onBreakdown(row.outputId)}
          >
            See cost breakdown
          </button>
        </li>
      ))}
    </ul>
  )
}
