/**
 * Exchange rate utilities — proxied through our own backend to avoid CORS.
 * The backend calls https://www.frankfurter.app on the server side.
 */

/**
 * Fetch the conversion rate from one currency to another.
 * Returns the multiplier to convert fromCurrency → toCurrency.
 * e.g. getRate('USD', 'INR') → 83.5
 */
export async function getRate(fromCurrency, toCurrency) {
  if (fromCurrency === toCurrency) return 1

  const res = await fetch(`/api/exchange-rate?from=${fromCurrency}&to=${toCurrency}`)
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || `Failed to fetch exchange rate (${res.status})`)
  }
  const data = await res.json()
  return data.rate
}
