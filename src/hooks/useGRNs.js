import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as api from '../api/grns'
import useGroupStore from '../store/groupStore'
import { toast } from '../store/toastStore'

const errMsg = (err) => err?.response?.data?.error || err?.message || 'Something went wrong'

export function useGRNs() {
  const activeGroupId = useGroupStore((s) => s.activeGroupId)
  return useQuery({
    queryKey: ['grns', activeGroupId],
    queryFn: () => api.getGRNs(activeGroupId).then((r) => r.data),
    enabled: !!activeGroupId,
  })
}

export function useCreateGRN() {
  const qc = useQueryClient()
  const activeGroupId = useGroupStore((s) => s.activeGroupId)
  return useMutation({
    mutationFn: (data) => api.createGRN(data, activeGroupId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['grns', activeGroupId] })
      qc.invalidateQueries({ queryKey: ['purchase-orders', activeGroupId] })
      qc.invalidateQueries({ queryKey: ['inventory', activeGroupId] })
      toast.success('GRN created')
    },
    onError: (err) => toast.error(errMsg(err)),
  })
}

export function useUpdateGRN() {
  const qc = useQueryClient()
  const activeGroupId = useGroupStore((s) => s.activeGroupId)
  return useMutation({
    mutationFn: ({ id, data }) => api.updateGRN(id, data, activeGroupId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['grns', activeGroupId] })
      qc.invalidateQueries({ queryKey: ['purchase-orders', activeGroupId] })
      toast.success('GRN updated')
    },
    onError: (err) => toast.error(errMsg(err)),
  })
}

export function useDeleteGRN() {
  const qc = useQueryClient()
  const activeGroupId = useGroupStore((s) => s.activeGroupId)
  return useMutation({
    mutationFn: (id) => api.deleteGRN(id, activeGroupId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['grns', activeGroupId] }); toast.success('GRN deleted') },
    onError: (err) => toast.error(errMsg(err)),
  })
}
