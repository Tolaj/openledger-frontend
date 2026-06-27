import { useMemo } from 'react'
import { useGroups } from './useGroups'
import useGroupStore from '../store/groupStore'
import useAuthStore from '../store/authStore'

export function useActiveGroupPermissions() {
  const { data: groups = [] } = useGroups()
  const activeGroupId = useGroupStore((s) => s.activeGroupId)
  const userId = useAuthStore((s) => s.user?._id || s.user?.id)

  return useMemo(() => {
    const group = groups.find((g) => g._id === activeGroupId)
    if (!group) return null
    // find this user's role assignment in the group
    const mr = (group.memberRoles || []).find(
      (r) => String(r.userId?._id || r.userId) === String(userId)
    )
    // if the assigned role is a system (Admin) role → full access
    if (mr?.roleId?.isSystem) return 'ADMIN'
    // if no role assigned → no permissions
    if (!mr?.roleId) return null
    return mr.roleId.permissions || []
  }, [groups, activeGroupId, userId])
}

// Check a specific permission. Returns true if:
// - group is personal (no role enforcement)
// - user is the group creator (ADMIN)
// - user's role has that permission explicitly true
export function usePermission(page, tab, action) {
  const activeGroupId = useGroupStore((s) => s.activeGroupId)
  const { data: groups = [] } = useGroups()
  const permissions = useActiveGroupPermissions()

  const group = groups.find((g) => g._id === activeGroupId)
  const isBusiness = group?.type === 'business'

  // Personal groups: no restrictions
  if (!isBusiness) return true
  // Creator / admin role
  if (permissions === 'ADMIN') return true
  // No role assigned → no access at all
  if (!permissions) return false
  // Find the permission entry
  const entry = permissions.find(
    (p) => p.page === page && (tab ? p.tab === tab : p.tab === null)
  )
  return !!entry?.[action]
}

// Returns an object of all actions for a tab: { view, add, edit, delete, ... }
export function useTabPermissions(page, tab) {
  const permissions = useActiveGroupPermissions()
  const activeGroupId = useGroupStore((s) => s.activeGroupId)
  const { data: groups = [] } = useGroups()
  const group = groups.find((g) => g._id === activeGroupId)
  const isBusiness = group?.type === 'business'

  if (!isBusiness || permissions === 'ADMIN') {
    // All true
    return { view: true, add: true, edit: true, delete: true, status: true, email: true, cart: true, place_order: true }
  }
  // No role assigned → no access at all
  if (!permissions) {
    return { view: false, add: false, edit: false, delete: false, status: false, email: false, cart: false, place_order: false }
  }
  const entry = permissions.find((p) => p.page === page && p.tab === tab)
  return entry || { view: false, add: false, edit: false, delete: false, status: false, email: false, cart: false, place_order: false }
}

// Pages that are always accessible regardless of role
const ALWAYS_ACCESSIBLE_PAGES = ['settings']

// Returns true if the user can access a page (page-level view permission)
export function usePagePermission(page) {
  const perm = usePermission(page, null, 'view')
  if (ALWAYS_ACCESSIBLE_PAGES.includes(page)) return true
  return perm
}

// Pure helper — check a permission for a SPECIFIC group object (not the active group).
// Use this when you need per-row permission checks (e.g. GroupsTab listing all groups).
export function getPermissionForGroup(group, userId, page, tab, action) {
  if (!group) return false
  // Personal groups: no restrictions
  if (group.type !== 'business') return true
  // Find this user's role assignment in this specific group
  const mr = (group.memberRoles || []).find(
    (r) => String(r.userId?._id || r.userId) === String(userId)
  )
  // System (Admin) role → full access
  if (mr?.roleId?.isSystem) return true
  // No role assigned → no access
  if (!mr?.roleId) return false
  const permissions = mr.roleId.permissions || []
  const entry = permissions.find(
    (p) => p.page === page && (tab ? p.tab === tab : p.tab === null)
  )
  return !!entry?.[action]
}
