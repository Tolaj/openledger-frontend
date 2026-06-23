import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as api from '../api/orders'
import useGroupStore from '../store/groupStore'
import { toast } from '../store/toastStore'

const errMsg = (err) => err?.response?.data?.error || err?.message || 'Something went wrong'

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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders', activeGroupId] })
      qc.invalidateQueries({ queryKey: ['finance'] })
      qc.invalidateQueries({ queryKey: ['finance-summary'] })
      toast.success('Order created')
    },
    onError: (err) => toast.error(errMsg(err)),
  })
}

export function useUpdateOrder() {
  const qc = useQueryClient()
  const activeGroupId = useGroupStore((s) => s.activeGroupId)
  return useMutation({
    mutationFn: ({ id, data }) => api.updateOrder(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders', activeGroupId] })
      qc.invalidateQueries({ queryKey: ['finance'] })
      qc.invalidateQueries({ queryKey: ['finance-summary'] })
      toast.success('Order updated')
    },
    onError: (err) => toast.error(errMsg(err)),
  })
}

export function useDeleteOrder() {
  const qc = useQueryClient()
  const activeGroupId = useGroupStore((s) => s.activeGroupId)
  return useMutation({
    mutationFn: api.deleteOrder,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders', activeGroupId] })
      qc.invalidateQueries({ queryKey: ['finance'] })
      qc.invalidateQueries({ queryKey: ['finance-summary'] })
      toast.success('Order deleted')
    },
    onError: (err) => toast.error(errMsg(err)),
  })
}
