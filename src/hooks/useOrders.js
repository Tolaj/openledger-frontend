import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as api from '../api/orders'
import useGroupStore from '../store/groupStore'

export function useOrders() {
  const activeGroupId = useGroupStore((s) => s.activeGroupId)
  return useQuery({
    queryKey: ['orders', activeGroupId],
    queryFn: () => api.getOrders(activeGroupId).then((r) => r.data),
    enabled: !!activeGroupId,
  })
}

export function useCreateOrder() {
  const qc = useQueryClient()
  const activeGroupId = useGroupStore((s) => s.activeGroupId)
  return useMutation({
    mutationFn: api.createOrder,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['orders', activeGroupId] }),
  })
}

export function useDeleteOrder() {
  const qc = useQueryClient()
  const activeGroupId = useGroupStore((s) => s.activeGroupId)
  return useMutation({
    mutationFn: api.deleteOrder,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['orders', activeGroupId] }),
  })
}
