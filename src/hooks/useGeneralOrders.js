import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as api from '../api/generalOrders'
import useGroupStore from '../store/groupStore'

export function useGeneralOrders() {
  const gid = useGroupStore((s) => s.activeGroupId)
  return useQuery({
    queryKey: ['general-orders', gid],
    queryFn: () => api.getGeneralOrders(gid).then((r) => r.data),
    enabled: !!gid,
  })
}

export function useCreateGeneralOrder() {
  const qc  = useQueryClient()
  const gid = useGroupStore((s) => s.activeGroupId)
  return useMutation({
    mutationFn: (data) => api.createGeneralOrder(data, gid),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['general-orders', gid] }),
  })
}

export function useUpdateGeneralOrder() {
  const qc  = useQueryClient()
  const gid = useGroupStore((s) => s.activeGroupId)
  return useMutation({
    mutationFn: ({ id, data }) => api.updateGeneralOrder(id, data, gid),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['general-orders', gid] }),
  })
}

export function useDeleteGeneralOrder() {
  const qc  = useQueryClient()
  const gid = useGroupStore((s) => s.activeGroupId)
  return useMutation({
    mutationFn: (id) => api.deleteGeneralOrder(id, gid),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['general-orders', gid] }),
  })
}
