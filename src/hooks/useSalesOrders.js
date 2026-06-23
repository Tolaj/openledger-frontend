import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as api from '../api/salesOrders'
import useGroupStore from '../store/groupStore'
import { toast } from '../store/toastStore'

const errMsg = (err) => err?.response?.data?.error || err?.message || 'Something went wrong'

export function useSalesOrders() {
  const activeGroupId = useGroupStore((s) => s.activeGroupId)
  return useQuery({
    queryKey: ['sales-orders', activeGroupId],
    queryFn: () => api.getSalesOrders(activeGroupId).then((r) => r.data),
    enabled: !!activeGroupId,
  })
}

export function useCreateSalesOrder() {
  const qc = useQueryClient()
  const activeGroupId = useGroupStore((s) => s.activeGroupId)
  return useMutation({
    mutationFn: (data) => api.createSalesOrder(data, activeGroupId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sales-orders', activeGroupId] }); toast.success('Sales order created') },
    onError: (err) => toast.error(errMsg(err)),
  })
}

export function useUpdateSalesOrder() {
  const qc = useQueryClient()
  const activeGroupId = useGroupStore((s) => s.activeGroupId)
  return useMutation({
    mutationFn: ({ id, data }) => api.updateSalesOrder(id, data, activeGroupId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sales-orders', activeGroupId] })
      qc.invalidateQueries({ queryKey: ['deliveries', activeGroupId] })
      qc.invalidateQueries({ queryKey: ['sales-invoices', activeGroupId] })
      qc.invalidateQueries({ queryKey: ['inventory', activeGroupId] })
      toast.success('Sales order updated')
    },
    onError: (err) => toast.error(errMsg(err)),
  })
}

export function useDeleteSalesOrder() {
  const qc = useQueryClient()
  const activeGroupId = useGroupStore((s) => s.activeGroupId)
  return useMutation({
    mutationFn: (id) => api.deleteSalesOrder(id, activeGroupId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sales-orders', activeGroupId] }); toast.success('Sales order deleted') },
    onError: (err) => toast.error(errMsg(err)),
  })
}

export function useSendSalesOrder() {
  const qc = useQueryClient()
  const activeGroupId = useGroupStore((s) => s.activeGroupId)
  return useMutation({
    mutationFn: ({ id, recipientEmail }) => api.sendSalesOrder(id, activeGroupId, { recipientEmail }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sales-orders', activeGroupId] }); toast.success('Sales order sent') },
    onError: (err) => toast.error(errMsg(err)),
  })
}
