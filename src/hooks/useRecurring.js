import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as api from '../api/recurring'
import useGroupStore from '../store/groupStore'
import { toast } from '../store/toastStore'

const errMsg = (err) => err?.response?.data?.error || err?.message || 'Something went wrong'

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
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['recurring', gid] }); toast.success('Recurring entry created') },
    onError: (err) => toast.error(errMsg(err)),
  })
}

export function useUpdateRecurring() {
  const qc  = useQueryClient()
  const gid = useGroupStore((s) => s.activeGroupId)
  return useMutation({
    mutationFn: ({ id, data }) => api.updateRecurring(id, data, gid),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['recurring', gid] }); toast.success('Recurring entry updated') },
    onError: (err) => toast.error(errMsg(err)),
  })
}

export function useDeleteRecurring() {
  const qc  = useQueryClient()
  const gid = useGroupStore((s) => s.activeGroupId)
  return useMutation({
    mutationFn: (id) => api.deleteRecurring(id, gid),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['recurring', gid] }); toast.success('Recurring entry deleted') },
    onError: (err) => toast.error(errMsg(err)),
  })
}
