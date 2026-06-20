import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as api from '../api/recurring'
import useGroupStore from '../store/groupStore'

export function useRecurring() {
  const gid = useGroupStore((s) => s.activeGroupId)
  return useQuery({
    queryKey: ['recurring', gid],
    queryFn: () => api.getRecurrings(gid).then((r) => r.data),
    enabled: !!gid,
  })
}

export function useCreateRecurring() {
  const qc  = useQueryClient()
  const gid = useGroupStore((s) => s.activeGroupId)
  return useMutation({
    mutationFn: (data) => api.createRecurring(data, gid),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recurring', gid] }),
  })
}

export function useUpdateRecurring() {
  const qc  = useQueryClient()
  const gid = useGroupStore((s) => s.activeGroupId)
  return useMutation({
    mutationFn: ({ id, data }) => api.updateRecurring(id, data, gid),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recurring', gid] }),
  })
}

export function useDeleteRecurring() {
  const qc  = useQueryClient()
  const gid = useGroupStore((s) => s.activeGroupId)
  return useMutation({
    mutationFn: (id) => api.deleteRecurring(id, gid),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recurring', gid] }),
  })
}
