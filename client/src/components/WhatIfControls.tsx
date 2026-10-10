import { useState } from 'react'
import type { OutputMarginRow } from '../api/outputs'
import type { Scenario } from './KpiRow'

interface WhatIfControlsProps {
  rows: OutputMarginRow[]
  scenario: Scenario | null
  onScenario: (scenario: Scenario | null) => void
}

/** Pick an ingredient and a % change to see every affected margin move. */
export function WhatIfControls({
  rows,
  scenario,
  onScenario,
}: WhatIfControlsProps) {
  const [ingredient, setIngredient] = useState('')
  const [pctInput, setPctInput] = useState('')

  const ingredients = [
    ...new Set(
      rows.flatMap((row) =>
        row.latestProductPrices.map((price) => price.productName),
      ),
    ),
  ].sort()

  // Recompute the scenario from both fields; null (no scenario) until both
  // name an ingredient and a non-zero change.
  function update(nextIngredient: string, nextPct: string) {
    setIngredient(nextIngredient)
    setPctInput(nextPct)
    const value = Number.parseFloat(nextPct)
    if (nextIngredient && Number.isFinite(value) && value !== 0) {
      onScenario({ ingredient: nextIngredient, pct: value / 100 })
    } else {
      onScenario(null)
    }
  }

  function clear() {
    setIngredient('')
    setPctInput('')
    onScenario(null)
  }

  const active = scenario !== null

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-gray-800 bg-gray-900 px-4 py-3 text-sm">
      <span className="text-gray-400">What if</span>
      <select
        aria-label="Ingredient"
        className="min-w-0 rounded border border-gray-700 bg-gray-950 px-2 py-1 text-sm text-gray-100"
        value={ingredient}
        onChange={(e) => update(e.target.value, pctInput)}
      >
        <option value="">pick an ingredient…</option>
        {ingredients.map((name) => (
          <option key={name} value={name}>
            {name}
          </option>
        ))}
      </select>
      <span className="text-gray-400">changes by</span>
      <input
        type="number"
        step="1"
        aria-label="Percent change"
        placeholder="±%"
        className="w-20 rounded border border-gray-700 bg-gray-950 px-2 py-1 text-sm text-gray-100"
        value={pctInput}
        onChange={(e) => update(ingredient, e.target.value)}
      />
      <span className="text-gray-400">%</span>
      {active && (
        <button
          type="button"
          className="px-0 text-sm text-gray-400 hover:text-gray-100 hover:underline"
          onClick={clear}
        >
          Clear scenario
        </button>
      )}
    </div>
  )
}
