/** Euro formatting from integer cents, e.g. 245 -> "€2.45". */
export function eur(cents: number): string {
  return `€${(cents / 100).toFixed(2)}`
}

/** Percentage formatting from a fraction, e.g. 0.4923 -> "49.2%". */
export function pct(fraction: number): string {
  return `${(fraction * 100).toFixed(1)}%`
}

/** Time-of-day greeting, e.g. "Good morning". */
export function timeOfDayGreeting(): string {
  const hour = new Date().getHours()
  return hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
}

/** "YYYY-MM" keys for the current and prior calendar month. */
export function currentAndPriorMonthKeys(): [string, string] {
  const now = new Date()
  const key = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  const prior = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  return [key(now), key(prior)]
}
