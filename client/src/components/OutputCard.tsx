import type { OutputMarginRow } from '../api/outputs'
import { eur, pct } from '../lib/format'
import { TARGET_MARGIN, margin, minPriceCents, scenarioCost } from '../lib/margin'
import type { Scenario } from './KpiRow'
import { MarginTrack } from './MarginTrack'

interface OutputCardProps {
  row: OutputMarginRow
  scenario: Scenario | null
  onBreakdown: (outputId: number) => void
}

/** One output: margin track, target tick, and the scenario-aware facts row. */
export function OutputCard({ row, scenario, onBreakdown }: OutputCardProps) {
  const cost = scenario
    ? scenarioCost(row.latestProductPrices, scenario.ingredient, scenario.pct)
    : row.productCostCents
  const m = margin(cost, row.salePriceCents)
  const m0 = margin(row.productCostCents, row.salePriceCents)
  const affected = scenario
    ? row.latestProductPrices.some(
        (price) => price.productName === scenario.ingredient,
      )
    : false

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 px-4 py-3.5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-semibold text-gray-100">{row.name}</h3>
        {m !== null ? (
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
              m < TARGET_MARGIN
                ? 'bg-red-500/10 text-red-400'
                : 'bg-emerald-500/10 text-emerald-400'
            }`}
          >
            {m < TARGET_MARGIN ? 'Below target' : 'On target'}
          </span>
        ) : (
          <span className="rounded-full bg-gray-800 px-2 py-0.5 text-xs font-semibold text-gray-400">
            Unpriced
          </span>
        )}
      </div>

      {m !== null && m0 !== null && (
        <div className="mt-3">
          <MarginTrack
            margin={m}
            wasMargin={scenario && affected ? m0 : undefined}
          />
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-400">
        {m !== null && (
          <span>
            Margin{' '}
            <b className="text-gray-100">
              {scenario && affected ? `${pct(m0!)} → ${pct(m)}` : pct(m)}
            </b>
          </span>
        )}
        <span>
          Unit cost{' '}
          <b className="text-gray-100">
            {scenario && affected
              ? `${eur(row.productCostCents)} → ${eur(cost)}`
              : eur(cost)}
          </b>
        </span>
        <span>
          Price <b className="text-gray-100">{row.salePriceCents === null ? '—' : eur(row.salePriceCents)}</b>
        </span>
        {row.salePriceCents !== null && (
          <span>
            Target {TARGET_MARGIN * 100}% needs{' '}
            <b className="text-gray-100">{eur(minPriceCents(cost))}</b>
          </span>
        )}
        {scenario && !affected && <span>Not affected</span>}
      </div>

      {row.latestProductPrices.length > 0 && (
        <button
          type="button"
          className="mt-2 px-0 text-sm font-semibold text-indigo-400 hover:text-indigo-300"
          onClick={() => onBreakdown(row.outputId)}
        >
          See cost breakdown
        </button>
      )}
    </div>
  )
}
