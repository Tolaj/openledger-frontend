import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as api from '../api/generalInvoices'
import useGroupStore from '../store/groupStore'

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
    onSuccess: () => qc.invalidateQueries({ queryKey: ['general-invoices', gid] }),
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
    },
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
    },
  })
}
