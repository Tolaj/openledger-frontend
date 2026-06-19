import { useGroups } from './useGroups'
import useGroupStore from '../store/groupStore'

export function useActiveGroupType() {
  const { data: groups = [] } = useGroups()
  const activeGroupId = useGroupStore((s) => s.activeGroupId)
  const activeGroup = groups.find((g) => g._id === activeGroupId)
  return activeGroup?.type ?? 'personal'
}

export function useIsBusiness() {
  return useActiveGroupType() === 'business'
}
