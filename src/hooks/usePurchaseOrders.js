import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as api from '../api/purchaseOrders'
import useGroupStore from '../store/groupStore'

export function usePurchaseOrders() {
  const activeGroupId = useGroupStore((s) => s.activeGroupId)
  return useQuery({
    queryKey: ['purchase-orders', activeGroupId],
    queryFn: () => api.getPurchaseOrders(activeGroupId).then((r) => r.data),
    enabled: !!activeGroupId,
  })
}

export function useCreatePurchaseOrder() {
  const qc = useQueryClient()
  const activeGroupId = useGroupStore((s) => s.activeGroupId)
  return useMutation({
    mutationFn: (data) => api.createPurchaseOrder(data, activeGroupId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['purchase-orders', activeGroupId] }),
  })
}

export function useUpdatePurchaseOrder() {
  const qc = useQueryClient()
  const activeGroupId = useGroupStore((s) => s.activeGroupId)
  return useMutation({
    mutationFn: ({ id, data }) => api.updatePurchaseOrder(id, data, activeGroupId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['purchase-orders', activeGroupId] }),
  })
}

export function useDeletePurchaseOrder() {
  const qc = useQueryClient()
  const activeGroupId = useGroupStore((s) => s.activeGroupId)
  return useMutation({
    mutationFn: (id) => api.deletePurchaseOrder(id, activeGroupId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['purchase-orders', activeGroupId] }),
  })
}
