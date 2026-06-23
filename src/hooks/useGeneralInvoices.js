import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as api from '../api/generalInvoices'
import useGroupStore from '../store/groupStore'
import { toast } from '../store/toastStore'

const errMsg = (err) => err?.response?.data?.error || err?.message || 'Something went wrong'

export function useGeneralInvoices() {
  const gid = useGroupStore((s) => s.activeGroupId)
  return useQuery({
    queryKey: ['general-invoices', gid],
    queryFn: () => api.getGeneralInvoices(gid).then((r) => r.data),
    enabled: !!gid,
  })
}

export function useCreateGeneralInvoice() {
  const qc  = useQueryClient()
  const gid = useGroupStore((s) => s.activeGroupId)
  return useMutation({
    mutationFn: (data) => api.createGeneralInvoice(data, gid),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['general-invoices', gid] }); toast.success('Invoice created') },
    onError: (err) => toast.error(errMsg(err)),
  })
}

export function useUpdateGeneralInvoice() {
  const qc  = useQueryClient()
  const gid = useGroupStore((s) => s.activeGroupId)
  return useMutation({
    mutationFn: ({ id, data }) => api.updateGeneralInvoice(id, data, gid),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['general-invoices', gid] })
      qc.invalidateQueries({ queryKey: ['finance'] })
      toast.success('Invoice updated')
    },
    onError: (err) => toast.error(errMsg(err)),
  })
}

export function useDeleteGeneralInvoice() {
  const qc  = useQueryClient()
  const gid = useGroupStore((s) => s.activeGroupId)
  return useMutation({
    mutationFn: (id) => api.deleteGeneralInvoice(id, gid),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['general-invoices', gid] })
      qc.invalidateQueries({ queryKey: ['finance'] })
      toast.success('Invoice deleted')
    },
    onError: (err) => toast.error(errMsg(err)),
  })
}

export function useSendGeneralInvoice() {
  const qc  = useQueryClient()
  const gid = useGroupStore((s) => s.activeGroupId)
  return useMutation({
    mutationFn: ({ id, recipientEmail }) => api.sendGeneralInvoice(id, gid, { recipientEmail }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['general-invoices', gid] }); toast.success('Invoice sent') },
    onError: (err) => toast.error(errMsg(err)),
  })
}
