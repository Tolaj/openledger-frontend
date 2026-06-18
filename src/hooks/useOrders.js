import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as api from '../api/orders'
import { createFinance } from '../api/finance'
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
    onSuccess: async (res) => {
      const order = res.data

      // Auto-create a finance expense entry for this order
      try {
        const splitAmong = (order.items || [])
          .flatMap((item) => item.splitAmong || [])
          .filter(Boolean)

        // Deduplicate members and calculate equal share
        const memberIds = [...new Set(splitAmong.map((u) => String(u._id || u)))]
        const totalAmount = parseFloat(order.totalPrice) || 0
        const sharePerMember = memberIds.length > 0 ? totalAmount / memberIds.length : 0

        const financeRes = await createFinance({
          type: 'expense',
          amount: totalAmount,
          description: `Order: ${order.name}`,
          date: order.date ? new Date(order.date).toISOString() : new Date().toISOString(),
          group: activeGroupId,
          paidBy: order.paidBy?._id || order.paidBy || null,
          splitAmong: memberIds.map((userId) => ({ user: userId, amount: sharePerMember })),
        })

        // Link the finance entry back to the order so delete stays in sync
        await api.updateOrder(order._id, { financeEntryId: financeRes.data._id })
      } catch (e) {
        // Finance entry failure shouldn't block order creation
        console.warn('Failed to auto-create finance entry for order:', e)
      }

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
      qc.invalidateQueries({ queryKey: ['orders', activeGroupId] })
      qc.invalidateQueries({ queryKey: ['finance'] })
      qc.invalidateQueries({ queryKey: ['finance-summary'] })
      qc.invalidateQueries({ queryKey: ['finance-summary'] })
    },
  })
}
