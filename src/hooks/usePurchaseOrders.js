import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as api from '../api/purchaseOrders'
import useGroupStore from '../store/groupStore'
import { toast } from '../store/toastStore'

const errMsg = (err) => err?.response?.data?.error || err?.message || 'Something went wrong'

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
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['purchase-orders', activeGroupId] }); toast.success('Purchase order created') },
    onError: (err) => toast.error(errMsg(err)),
  })
}

export function useUpdatePurchaseOrder() {
  const qc = useQueryClient()
  const activeGroupId = useGroupStore((s) => s.activeGroupId)
  return useMutation({
    mutationFn: ({ id, data }) => api.updatePurchaseOrder(id, data, activeGroupId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['purchase-orders', activeGroupId] })
      qc.invalidateQueries({ queryKey: ['grns', activeGroupId] })
      qc.invalidateQueries({ queryKey: ['purchase-invoices', activeGroupId] })
      qc.invalidateQueries({ queryKey: ['inventory', activeGroupId] })
      toast.success('Purchase order updated')
    },
    onError: (err) => toast.error(errMsg(err)),
  })
}

export function useDeletePurchaseOrder() {
  const qc = useQueryClient()
  const activeGroupId = useGroupStore((s) => s.activeGroupId)
  return useMutation({
    mutationFn: (id) => api.deletePurchaseOrder(id, activeGroupId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['purchase-orders', activeGroupId] }); toast.success('Purchase order deleted') },
    onError: (err) => toast.error(errMsg(err)),
  })
}

export function useSendPurchaseOrder() {
  const qc = useQueryClient()
  const activeGroupId = useGroupStore((s) => s.activeGroupId)
  return useMutation({
    mutationFn: ({ id, recipientEmail }) => api.sendPurchaseOrder(id, activeGroupId, { recipientEmail }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['purchase-orders', activeGroupId] }); toast.success('Purchase order sent') },
    onError: (err) => toast.error(errMsg(err)),
  })
}
