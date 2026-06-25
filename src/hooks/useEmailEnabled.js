import { useGroups } from './useGroups'
import useGroupStore from '../store/groupStore'

/**
 * Returns whether email sending is configured and enabled for the active group.
 * { enabled: bool, configured: bool }
 */
export function useEmailEnabled() {
  const { data: groups = [] } = useGroups()
  const activeGroupId = useGroupStore((s) => s.activeGroupId)
  const activeGroup = groups.find((g) => g._id === activeGroupId)
  const bd = activeGroup?.businessDetails || {}
  return {
    configured: !!bd.smtpConfigured,
    enabled: !!bd.emailEnabled && !!bd.smtpConfigured,
  }
}
