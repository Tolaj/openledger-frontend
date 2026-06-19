import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as api from '../api/purchaseInvoices'
import useGroupStore from '../store/groupStore'

export function usePurchaseInvoices() {
  const activeGroupId = useGroupStore((s) => s.activeGroupId)
  return useQuery({
    queryKey: ['purchase-invoices', activeGroupId],
    queryFn: () => api.getPurchaseInvoices(activeGroupId).then((r) => r.data),
    enabled: !!activeGroupId,
  })
}

export function useCreatePurchaseInvoice() {
  const qc = useQueryClient()
  const activeGroupId = useGroupStore((s) => s.activeGroupId)
  return useMutation({
    mutationFn: (data) => api.createPurchaseInvoice(data, activeGroupId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['purchase-invoices', activeGroupId] }),
  })
}

export function useUpdatePurchaseInvoice() {
  const qc = useQueryClient()
  const activeGroupId = useGroupStore((s) => s.activeGroupId)
  return useMutation({
    mutationFn: ({ id, data }) => api.updatePurchaseInvoice(id, data, activeGroupId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['purchase-invoices', activeGroupId] }),
  })
}

export function useDeletePurchaseInvoice() {
  const qc = useQueryClient()
  const activeGroupId = useGroupStore((s) => s.activeGroupId)
  return useMutation({
    mutationFn: (id) => api.deletePurchaseInvoice(id, activeGroupId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['purchase-invoices', activeGroupId] }),
  })
}
