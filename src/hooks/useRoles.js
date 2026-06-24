import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as api from '../api/roles'
import useGroupStore from '../store/groupStore'
import { toast } from '../store/toastStore'

const errMsg = (err) => err?.response?.data?.error || err?.message || 'Something went wrong'

export function useRoles() {
  const groupId = useGroupStore((s) => s.activeGroupId)
  return useQuery({
    queryKey: ['roles', groupId],
    queryFn: () => api.getRoles(groupId).then((r) => r.data),
    enabled: !!groupId,
  })
}

export function useCreateRole() {
  const qc = useQueryClient()
  const groupId = useGroupStore((s) => s.activeGroupId)
  return useMutation({
    mutationFn: (data) => api.createRole({ ...data, groupId }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['roles', groupId] }); toast.success('Role created') },
    onError: (err) => toast.error(errMsg(err)),
  })
}

export function useUpdateRole() {
  const qc = useQueryClient()
  const groupId = useGroupStore((s) => s.activeGroupId)
  return useMutation({
    mutationFn: ({ id, data }) => api.updateRole(id, { ...data, groupId }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['roles', groupId] }); toast.success('Role updated') },
    onError: (err) => toast.error(errMsg(err)),
  })
}

export function useDeleteRole() {
  const qc = useQueryClient()
  const groupId = useGroupStore((s) => s.activeGroupId)
  return useMutation({
    mutationFn: (id) => api.deleteRole(id, groupId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['roles', groupId] }); toast.success('Role deleted') },
    onError: (err) => toast.error(errMsg(err)),
  })
}
