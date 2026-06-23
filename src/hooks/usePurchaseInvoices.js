import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as api from '../api/purchaseInvoices'
import useGroupStore from '../store/groupStore'
import { toast } from '../store/toastStore'

const errMsg = (err) => err?.response?.data?.error || err?.message || 'Something went wrong'

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
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['purchase-invoices', activeGroupId] }); toast.success('Purchase invoice created') },
    onError: (err) => toast.error(errMsg(err)),
  })
}

export function useUpdatePurchaseInvoice() {
  const qc = useQueryClient()
  const activeGroupId = useGroupStore((s) => s.activeGroupId)
  return useMutation({
    mutationFn: ({ id, data }) => api.updatePurchaseInvoice(id, data, activeGroupId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['purchase-invoices', activeGroupId] })
      qc.invalidateQueries({ queryKey: ['finance'] })
      toast.success('Purchase invoice updated')
    },
    onError: (err) => toast.error(errMsg(err)),
  })
}

export function useDeletePurchaseInvoice() {
  const qc = useQueryClient()
  const activeGroupId = useGroupStore((s) => s.activeGroupId)
  return useMutation({
    mutationFn: (id) => api.deletePurchaseInvoice(id, activeGroupId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['purchase-invoices', activeGroupId] })
      qc.invalidateQueries({ queryKey: ['finance'] })
      toast.success('Purchase invoice deleted')
    },
    onError: (err) => toast.error(errMsg(err)),
  })
}

export function useSendPurchaseInvoice() {
  const qc  = useQueryClient()
  const gid = useGroupStore((s) => s.activeGroupId)
  return useMutation({
    mutationFn: ({ id, recipientEmail }) => api.sendPurchaseInvoice(id, gid, { recipientEmail }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['purchase-invoices', gid] }); toast.success('Purchase invoice sent') },
    onError: (err) => toast.error(errMsg(err)),
  })
}
