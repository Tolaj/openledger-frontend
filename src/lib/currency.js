export { currencySymbol, CURRENCY_META as CURRENCIES, CURRENCIES as CURRENCY_LIST } from './countries.js'

import { currencySymbol } from './countries.js'

/** Formats a number with the currency symbol prefix */
export function formatAmount(amount, code) {
  const sym = currencySymbol(code)
  const num = Number(amount)
  if (isNaN(num)) return `${sym}—`
  return `${sym}${num.toFixed(2)}`
}
