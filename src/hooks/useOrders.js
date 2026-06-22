import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as api from '../api/orders'
import useGroupStore from '../store/groupStore'

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
      // Backend auto-creates the Finance expense entry
      qc.invalidateQueries({ queryKey: ['orders', activeGroupId] })
      qc.invalidateQueries({ queryKey: ['finance'] })
      qc.invalidateQueries({ queryKey: ['finance-summary'] })
    },
  })
}

export function useUpdateOrder() {
  const qc = useQueryClient()
  const activeGroupId = useGroupStore((s) => s.activeGroupId)
  return useMutation({
    mutationFn: ({ id, data }) => api.updateOrder(id, data),
    onSuccess: () => {
      // Backend syncs the Finance entry amount/description
      qc.invalidateQueries({ queryKey: ['orders', activeGroupId] })
      qc.invalidateQueries({ queryKey: ['finance'] })
      qc.invalidateQueries({ queryKey: ['finance-summary'] })
    },
  })
}

export function useDeleteOrder() {
  const qc = useQueryClient()
  const activeGroupId = useGroupStore((s) => s.activeGroupId)
  return useMutation({
    mutationFn: api.deleteOrder,
    onSuccess: () => {
      // Backend deletes the linked Finance entry
      qc.invalidateQueries({ queryKey: ['orders', activeGroupId] })
      qc.invalidateQueries({ queryKey: ['finance'] })
      qc.invalidateQueries({ queryKey: ['finance-summary'] })
    },
  })
}
