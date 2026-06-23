import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as api from '../api/salesInvoices'
import useGroupStore from '../store/groupStore'
import { toast } from '../store/toastStore'

const errMsg = (err) => err?.response?.data?.error || err?.message || 'Something went wrong'

export function useSalesInvoices() {
  const activeGroupId = useGroupStore((s) => s.activeGroupId)
  return useQuery({
    queryKey: ['sales-invoices', activeGroupId],
    queryFn: () => api.getSalesInvoices(activeGroupId).then((r) => r.data),
    enabled: !!activeGroupId,
  })
}

export function useCreateSalesInvoice() {
  const qc = useQueryClient()
  const activeGroupId = useGroupStore((s) => s.activeGroupId)
  return useMutation({
    mutationFn: (data) => api.createSalesInvoice(data, activeGroupId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sales-invoices', activeGroupId] }); toast.success('Sales invoice created') },
    onError: (err) => toast.error(errMsg(err)),
  })
}

export function useUpdateSalesInvoice() {
  const qc = useQueryClient()
  const activeGroupId = useGroupStore((s) => s.activeGroupId)
  return useMutation({
    mutationFn: ({ id, data }) => api.updateSalesInvoice(id, data, activeGroupId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sales-invoices', activeGroupId] })
      qc.invalidateQueries({ queryKey: ['finance'] })
      toast.success('Sales invoice updated')
    },
    onError: (err) => toast.error(errMsg(err)),
  })
}

export function useDeleteSalesInvoice() {
  const qc = useQueryClient()
  const activeGroupId = useGroupStore((s) => s.activeGroupId)
  return useMutation({
    mutationFn: (id) => api.deleteSalesInvoice(id, activeGroupId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sales-invoices', activeGroupId] })
      qc.invalidateQueries({ queryKey: ['finance'] })
      toast.success('Sales invoice deleted')
    },
    onError: (err) => toast.error(errMsg(err)),
  })
}

export function useSendSalesInvoice() {
  const qc  = useQueryClient()
  const gid = useGroupStore((s) => s.activeGroupId)
  return useMutation({
    mutationFn: ({ id, recipientEmail }) => api.sendSalesInvoice(id, gid, { recipientEmail }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sales-invoices', gid] }); toast.success('Sales invoice sent') },
    onError: (err) => toast.error(errMsg(err)),
  })
}
