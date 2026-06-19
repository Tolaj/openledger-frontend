import { useMe } from './useUser'
import { currencySymbol } from '../lib/currency'

/** Returns the currency symbol for the current user's configured currency */
export function useCurrencySymbol() {
  const { data: me } = useMe()
  return currencySymbol(me?.currency)
}
