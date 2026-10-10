import type { OutputMarginRow } from '../api/outputs'
import { eur } from '../lib/format'

interface CostBreakdownViewProps {
  row: OutputMarginRow
  onBack: () => void
}

/** Where an output's unit cost comes from: one line per ingredient. */
export function CostBreakdownView({ row, onBack }: CostBreakdownViewProps) {
  const lines = [...row.latestProductPrices].sort(
    (a, b) => b.amountCents - a.amountCents,
  )
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 px-4 py-3.5">
      <div className="flex flex-col gap-2">
        {lines.map((line) => (
          <div
            key={line.productId}
            className="flex items-center justify-between gap-3 text-sm"
          >
            <span className="text-gray-300">{line.productName}</span>
            <b className="text-gray-100">
              {eur(line.amountCents)}{' '}
              <span className="font-normal text-gray-500">
                ({Math.round((line.amountCents / row.productCostCents) * 100)}%)
              </span>
            </b>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between gap-3 border-t border-gray-800 pt-3">
        <b className="text-gray-100">Unit cost</b>
        <b className="text-gray-100">{eur(row.productCostCents)}</b>
      </div>
      <button
        type="button"
        className="mt-3 px-0 font-semibold text-indigo-400 hover:text-indigo-300"
        onClick={onBack}
      >
        Back to all products
      </button>
    </div>
  )
}
