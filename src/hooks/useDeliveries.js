import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as api from '../api/deliveries'
import useGroupStore from '../store/groupStore'
import { toast } from '../store/toastStore'

const errMsg = (err) => err?.response?.data?.error || err?.message || 'Something went wrong'

export function useDeliveries() {
  const activeGroupId = useGroupStore((s) => s.activeGroupId)
  return useQuery({
    queryKey: ['deliveries', activeGroupId],
    queryFn: () => api.getDeliveries(activeGroupId).then((r) => r.data),
    enabled: !!activeGroupId,
  })
}

export function useCreateDelivery() {
  const qc = useQueryClient()
  const activeGroupId = useGroupStore((s) => s.activeGroupId)
  return useMutation({
    mutationFn: (data) => api.createDelivery(data, activeGroupId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['deliveries', activeGroupId] })
      qc.invalidateQueries({ queryKey: ['sales-orders', activeGroupId] })
      qc.invalidateQueries({ queryKey: ['inventory', activeGroupId] })
      toast.success('Delivery created')
    },
    onError: (err) => toast.error(errMsg(err)),
  })
}

export function useUpdateDelivery() {
  const qc = useQueryClient()
  const activeGroupId = useGroupStore((s) => s.activeGroupId)
  return useMutation({
    mutationFn: ({ id, data }) => api.updateDelivery(id, data, activeGroupId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['deliveries', activeGroupId] })
      qc.invalidateQueries({ queryKey: ['sales-orders', activeGroupId] })
      toast.success('Delivery updated')
    },
    onError: (err) => toast.error(errMsg(err)),
  })
}

export function useDeleteDelivery() {
  const qc = useQueryClient()
  const activeGroupId = useGroupStore((s) => s.activeGroupId)
  return useMutation({
    mutationFn: (id) => api.deleteDelivery(id, activeGroupId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['deliveries', activeGroupId] }); toast.success('Delivery deleted') },
    onError: (err) => toast.error(errMsg(err)),
  })
}
