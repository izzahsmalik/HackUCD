import { useState } from 'react'
import { resolveDecision } from '../api/actionQueue'
import {
  isProductDecision,
  isTransactionDecision,
  type DecisionAction,
  type DecisionView,
  type ProductDecisionData,
  type TransactionDecisionData,
} from '../types/decision'

export interface BrandOption {
  id: number
  name: string
}

interface Props {
  decision: DecisionView
  brands: BrandOption[] | null
  disabled: boolean
  /** Reports this card's in-flight resolve so the panel can disable the rest. */
  onBusy: (id: number | null) => void
  /** The decision was resolved (or vanished) and should leave the list. */
  onGone: (id: number) => void
}

const eur = (cents: number) => `€${(cents / 100).toFixed(2)}`

export function DecisionCard({
  decision,
  brands,
  disabled,
  onBusy,
  onGone,
}: Props) {
  const product = isProductDecision(decision)
    ? (decision.data as ProductDecisionData)
    : null
  const transaction = isTransactionDecision(decision)
    ? (decision.data as TransactionDecisionData)
    : null

  const [selectedProductId, setSelectedProductId] = useState('')
  const [newProductName, setNewProductName] = useState(product?.productName ?? '')
  const [selectedBrandId, setSelectedBrandId] = useState('')
  const [selectedCategoryId, setSelectedCategoryId] = useState('')
  const [newCategoryName, setNewCategoryName] = useState(
    transaction?.suggestedCategoryName ?? '',
  )
  const [generic, setGeneric] = useState<Record<string, Record<string, string>>>({})
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const data = (product ?? transaction) as
    | ProductDecisionData
    | TransactionDecisionData
    | null
  const rowLabel = data ? `Row ${data.rowIndex} · ${data.fileName}` : decision.type
  const confidence = product?.confidence ?? transaction?.confidence

  async function resolve(action: DecisionAction) {
    const payload = payloadFor(action)
    if (payload === null) {
      setError('Pick a value for this action first')
      return
    }
    setBusy(true)
    onBusy(decision.id)
    setError(null)
    try {
      await resolveDecision(decision.id, { actionId: action.id, payload })
      onGone(decision.id)
    } catch (err) {
      if (err instanceof Error && 'status' in err && err.status === 404) {
        // Resolved elsewhere or the server restarted; drop the stale row.
        onGone(decision.id)
      } else {
        setError(err instanceof Error ? err.message : String(err))
      }
    } finally {
      setBusy(false)
      onBusy(null)
    }
  }

  /** Returns the payload for an action, or null if a required pick is missing. */
  function payloadFor(action: DecisionAction): Record<string, unknown> | null {
    switch (action.id) {
      case 'match-product':
        return selectedProductId ? { productId: Number(selectedProductId) } : null
      case 'create-product':
        return {
          name: newProductName,
          brandId: Number(selectedBrandId || brands?.[0]?.id || 0),
        }
      case 'categorize':
        return selectedCategoryId ? { categoryId: Number(selectedCategoryId) } : null
      case 'categorize-new':
        return { name: newCategoryName }
      default: {
        // Generic fallback for future decision types: one value per declared
        // payload field. Numbers must be coerced — the server wants integers.
        const payload: Record<string, unknown> = {}
        for (const [field, kind] of Object.entries(action.payload ?? {})) {
          const value = generic[action.id]?.[field] ?? ''
          payload[field] = kind === 'number' ? Number(value) : value
        }
        return payload
      }
    }
  }

  const selectClass =
    'min-w-0 rounded border border-gray-700 bg-gray-950 px-2 py-1 text-sm text-gray-100'
  const inputClass = `${selectClass} w-40`
  const primaryClass =
    'rounded bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50'
  const secondaryClass =
    'rounded px-2 py-1.5 text-sm text-gray-400 hover:text-gray-200 disabled:cursor-not-allowed disabled:opacity-50'

  return (
    <li className="border-b border-gray-800 p-4 last:border-b-0">
      <div className="flex flex-wrap items-center gap-2">
        <code className="rounded border border-gray-800 bg-gray-950 px-2 py-0.5 font-mono text-xs text-gray-300">
          {rowLabel}
        </code>
        {data && (
          <span className="text-xs text-gray-500">
            {Object.entries(data.rawRow)
              .map(([key, value]) => `${key}: ${value}`)
              .join(' · ')}
          </span>
        )}
        {(product || transaction) && (
          <span className="ml-auto text-xs text-gray-500">
            {eur((product ?? transaction)!.amountCents)}
            {confidence !== undefined && ` · ${Math.round(confidence * 100)}% confident`}
          </span>
        )}
      </div>

      <p className="mt-2 text-sm text-gray-200">{decision.summary}</p>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        {decision.actions.map((action) => (
          <ActionControl
            key={action.id}
            action={action}
            disabled={disabled || busy}
            product={product}
            transaction={transaction}
            brands={brands}
            state={{
              selectedProductId,
              setSelectedProductId,
              newProductName,
              setNewProductName,
              selectedBrandId,
              setSelectedBrandId,
              selectedCategoryId,
              setSelectedCategoryId,
              newCategoryName,
              setNewCategoryName,
              generic,
              setGeneric,
            }}
            classes={{ selectClass, inputClass, primaryClass, secondaryClass }}
            onSubmit={() => resolve(action)}
          />
        ))}
      </div>

      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </li>
  )
}

interface ActionState {
  selectedProductId: string
  setSelectedProductId: (value: string) => void
  newProductName: string
  setNewProductName: (value: string) => void
  selectedBrandId: string
  setSelectedBrandId: (value: string) => void
  selectedCategoryId: string
  setSelectedCategoryId: (value: string) => void
  newCategoryName: string
  setNewCategoryName: (value: string) => void
  generic: Record<string, Record<string, string>>
  setGeneric: (value: Record<string, Record<string, string>>) => void
}

interface ActionProps {
  action: DecisionAction
  disabled: boolean
  product: ProductDecisionData | null
  transaction: TransactionDecisionData | null
  brands: BrandOption[] | null
  state: ActionState
  classes: {
    selectClass: string
    inputClass: string
    primaryClass: string
    secondaryClass: string
  }
  onSubmit: () => void
}

function ActionControl({
  action,
  disabled,
  product,
  transaction,
  brands,
  state,
  classes,
  onSubmit,
}: ActionProps) {
  const { selectClass, inputClass, primaryClass, secondaryClass } = classes
  const primary = (label: string) => (
    <button type="button" className={primaryClass} disabled={disabled} onClick={onSubmit}>
      {label}
    </button>
  )

  switch (action.id) {
    case 'match-product': {
      // Hiding the control when there are no candidates: the server would
      // only reject the payload.
      if (!product || product.candidateProducts.length === 0) return null
      return (
        <label className="flex items-center gap-2 text-sm text-gray-400">
          {action.label}
          <select
            className={selectClass}
            disabled={disabled}
            value={state.selectedProductId}
            onChange={(e) => state.setSelectedProductId(e.target.value)}
          >
            <option value="">Pick a product…</option>
            {product.candidateProducts.map((candidate) => (
              <option key={candidate.id} value={candidate.id}>
                {candidate.name} — {candidate.brandName}
              </option>
            ))}
          </select>
          {primary('Match')}
        </label>
      )
    }
    case 'create-product':
      if (!product) return null
      return (
        <span className="flex flex-wrap items-center gap-2 text-sm text-gray-400">
          {action.label}
          <input
            className={inputClass}
            disabled={disabled}
            value={state.newProductName}
            onChange={(e) => state.setNewProductName(e.target.value)}
            aria-label="Product name"
          />
          {brands ? (
            <select
              className={selectClass}
              disabled={disabled}
              value={state.selectedBrandId}
              onChange={(e) => state.setSelectedBrandId(e.target.value)}
              aria-label="Brand"
            >
              <option value="">Pick a brand…</option>
              {brands.map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ))}
            </select>
          ) : (
            <input
              className={`${inputClass} w-24`}
              type="number"
              placeholder="Brand id"
              disabled={disabled}
              value={state.selectedBrandId}
              onChange={(e) => state.setSelectedBrandId(e.target.value)}
              aria-label="Brand id"
            />
          )}
          {primary('Create')}
        </span>
      )
    case 'categorize': {
      if (!transaction || transaction.existingCategories.length === 0) return null
      return (
        <label className="flex items-center gap-2 text-sm text-gray-400">
          {action.label}
          <select
            className={selectClass}
            disabled={disabled}
            value={state.selectedCategoryId}
            onChange={(e) => state.setSelectedCategoryId(e.target.value)}
          >
            <option value="">Pick a category…</option>
            {transaction.existingCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          {primary('File')}
        </label>
      )
    }
    case 'categorize-new':
      if (!transaction) return null
      return (
        <span className="flex items-center gap-2 text-sm text-gray-400">
          {action.label}
          <input
            className={inputClass}
            disabled={disabled}
            value={state.newCategoryName}
            onChange={(e) => state.setNewCategoryName(e.target.value)}
            aria-label="New category name"
          />
          {primary('Create & file')}
        </span>
      )
    case 'discard':
      return (
        <button
          type="button"
          className={secondaryClass}
          disabled={disabled}
          onClick={onSubmit}
        >
          {action.label}
        </button>
      )
    default: {
      // Unknown decision type: render one input per declared payload field.
      const fields = Object.entries(action.payload ?? {})
      return (
        <span className="flex flex-wrap items-center gap-2 text-sm text-gray-400">
          {action.label}
          {fields.map(([field, kind]) => (
            <input
              key={field}
              className={inputClass}
              type={kind === 'number' ? 'number' : 'text'}
              placeholder={field}
              disabled={disabled}
              value={state.generic[action.id]?.[field] ?? ''}
              onChange={(e) =>
                state.setGeneric({
                  ...state.generic,
                  [action.id]: {
                    ...state.generic[action.id],
                    [field]: e.target.value,
                  },
                })
              }
            />
          ))}
          {primary('Apply')}
        </span>
      )
    }
  }
}
