import { useMe } from './useUser'
import { useGroups } from './useGroups'
import useGroupStore from '../store/groupStore'
import { currencySymbol } from '../lib/countries'

/** Returns the currency code for the active group (falls back to user-level currency for legacy data) */
export function useActiveCurrency() {
  const { data: me } = useMe()
  const { data: groups = [] } = useGroups()
  const activeGroupId = useGroupStore((s) => s.activeGroupId)
  const activeGroup = groups.find((g) => g._id === activeGroupId)
  return activeGroup?.currency || me?.currency || 'INR'
}

/** Returns the currency symbol for the active group */
export function useCurrencySymbol() {
  return currencySymbol(useActiveCurrency())
}
