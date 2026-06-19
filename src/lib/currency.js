export const CURRENCIES = {
  INR: '₹',
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  AUD: 'A$',
}

export const DEFAULT_CURRENCY = 'INR'

/** Returns the symbol for a given currency code */
export function currencySymbol(code) {
  return CURRENCIES[code] || CURRENCIES[DEFAULT_CURRENCY]
}

/** Formats a number with the currency symbol prefix */
export function formatAmount(amount, code) {
  const sym = currencySymbol(code)
  const num = Number(amount)
  if (isNaN(num)) return `${sym}—`
  return `${sym}${num.toFixed(2)}`
}
