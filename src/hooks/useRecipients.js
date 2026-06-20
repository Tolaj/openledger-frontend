import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as api from '../api/recipients'
import useGroupStore from '../store/groupStore'

export function useRecipients() {
  const gid = useGroupStore((s) => s.activeGroupId)
  return useQuery({
    queryKey: ['recipients', gid],
    queryFn: () => api.getRecipients(gid).then((r) => r.data),
    enabled: !!gid,
  })
}

export function useCreateRecipient() {
  const qc  = useQueryClient()
  const gid = useGroupStore((s) => s.activeGroupId)
  return useMutation({
    mutationFn: (data) => api.createRecipient(data, gid),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recipients', gid] }),
  })
}

export function useUpdateRecipient() {
  const qc  = useQueryClient()
  const gid = useGroupStore((s) => s.activeGroupId)
  return useMutation({
    mutationFn: ({ id, data }) => api.updateRecipient(id, data, gid),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recipients', gid] }),
  })
}

export function useDeleteRecipient() {
  const qc  = useQueryClient()
  const gid = useGroupStore((s) => s.activeGroupId)
  return useMutation({
    mutationFn: (id) => api.deleteRecipient(id, gid),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recipients', gid] }),
  })
}
