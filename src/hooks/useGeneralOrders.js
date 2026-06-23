import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as api from '../api/generalOrders'
import useGroupStore from '../store/groupStore'
import { toast } from '../store/toastStore'

const errMsg = (err) => err?.response?.data?.error || err?.message || 'Something went wrong'

export function useSendGeneralOrder() {
  const qc  = useQueryClient()
  const gid = useGroupStore((s) => s.activeGroupId)
  return useMutation({
    mutationFn: ({ id, recipientEmail }) => api.sendGeneralOrder(id, gid, { recipientEmail }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['general-orders', gid] }); toast.success('Order sent') },
    onError: (err) => toast.error(errMsg(err)),
  })
}

export function useGeneralOrders() {
  const gid = useGroupStore((s) => s.activeGroupId)
  return useQuery({
    queryKey: ['general-orders', gid],
    queryFn: () => api.getGeneralOrders(gid).then((r) => r.data),
    enabled: !!gid,
  })
}

export function useCreateGeneralOrder() {
  const qc  = useQueryClient()
  const gid = useGroupStore((s) => s.activeGroupId)
  return useMutation({
    mutationFn: (data) => api.createGeneralOrder(data, gid),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['general-orders', gid] }); toast.success('Order created') },
    onError: (err) => toast.error(errMsg(err)),
  })
}

export function useUpdateGeneralOrder() {
  const qc  = useQueryClient()
  const gid = useGroupStore((s) => s.activeGroupId)
  return useMutation({
    mutationFn: ({ id, data }) => api.updateGeneralOrder(id, data, gid),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['general-orders', gid] })
      qc.invalidateQueries({ queryKey: ['general-invoices', gid] })
      qc.invalidateQueries({ queryKey: ['inventory', gid] })
      toast.success('Order updated')
    },
    onError: (err) => toast.error(errMsg(err)),
  })
}

export function useDeleteGeneralOrder() {
  const qc  = useQueryClient()
  const gid = useGroupStore((s) => s.activeGroupId)
  return useMutation({
    mutationFn: (id) => api.deleteGeneralOrder(id, gid),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['general-orders', gid] }); toast.success('Order deleted') },
    onError: (err) => toast.error(errMsg(err)),
  })
}
