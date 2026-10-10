import { TARGET_MARGIN, trackWidth } from '../lib/margin'

interface MarginTrackProps {
  /** Current (or scenario) margin fraction. */
  margin: number
  /** Margin before the scenario, for the dashed "was" line. */
  wasMargin?: number
}

/**
 * Margin bar: fill to the current margin, a light tick at the target, and a
 * dashed line where the margin was before a what-if scenario.
 */
export function MarginTrack({ margin, wasMargin }: MarginTrackProps) {
  const ok = margin >= TARGET_MARGIN
  return (
    <div className="relative h-2 rounded bg-gray-800">
      <div
        className={`absolute bottom-0 left-0 top-0 rounded ${ok ? 'bg-emerald-500' : 'bg-red-500'}`}
        style={{ width: `${trackWidth(margin)}%` }}
      />
      {wasMargin !== undefined && (
        <div
          className="absolute -top-0.5 -bottom-0.5 border-l-2 border-dashed border-gray-400"
          style={{ left: `${trackWidth(wasMargin)}%` }}
          title="Margin before the scenario"
        />
      )}
      <div
        className="absolute -top-1 -bottom-1 w-0.5 bg-gray-100"
        style={{ left: `${trackWidth(TARGET_MARGIN)}%` }}
        title={`Target ${TARGET_MARGIN * 100}%`}
      />
    </div>
  )
}
