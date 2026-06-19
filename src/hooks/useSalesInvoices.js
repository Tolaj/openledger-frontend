import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as api from '../api/salesInvoices'
import useGroupStore from '../store/groupStore'

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
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sales-invoices', activeGroupId] }),
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
    },
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
    },
  })
}
