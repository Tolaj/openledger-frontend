import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as api from '../api/inventory'
import useGroupStore from '../store/groupStore'
import { toast } from '../store/toastStore'

const errMsg = (err) => err?.response?.data?.error || err?.message || 'Something went wrong'

export function useInventory() {
  const activeGroupId = useGroupStore((s) => s.activeGroupId)
  return useQuery({
    queryKey: ['inventory', activeGroupId],
    queryFn: () => api.getInventory(activeGroupId).then((r) => r.data),
    enabled: !!activeGroupId,
  })
}

export function useCreateInventory() {
  const qc = useQueryClient()
  const activeGroupId = useGroupStore((s) => s.activeGroupId)
  return useMutation({
    mutationFn: api.createInventory,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['inventory', activeGroupId] }); toast.success('Stock entry added') },
    onError: (err) => toast.error(errMsg(err)),
  })
}

export function useUpdateInventory() {
  const qc = useQueryClient()
  const activeGroupId = useGroupStore((s) => s.activeGroupId)
  return useMutation({
    mutationFn: ({ id, data }) => api.updateInventory(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['inventory', activeGroupId] }); toast.success('Stock entry updated') },
    onError: (err) => toast.error(errMsg(err)),
  })
}

export function useDeleteInventory() {
  const qc = useQueryClient()
  const activeGroupId = useGroupStore((s) => s.activeGroupId)
  return useMutation({
    mutationFn: api.deleteInventory,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['inventory', activeGroupId] }); toast.success('Stock entry deleted') },
    onError: (err) => toast.error(errMsg(err)),
  })
}
