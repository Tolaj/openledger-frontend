import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as api from '../api/vendors'
import useGroupStore from '../store/groupStore'
import { toast } from '../store/toastStore'

const errMsg = (err) => err?.response?.data?.error || err?.message || 'Something went wrong'

export function useVendors() {
  const activeGroupId = useGroupStore((s) => s.activeGroupId)
  return useQuery({
    queryKey: ['vendors', activeGroupId],
    queryFn: () => api.getVendors(activeGroupId).then((r) => r.data),
    enabled: !!activeGroupId,
  })
}

export function useCreateVendor() {
  const qc = useQueryClient()
  const activeGroupId = useGroupStore((s) => s.activeGroupId)
  return useMutation({
    mutationFn: (data) => api.createVendor(data, activeGroupId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['vendors', activeGroupId] }); toast.success('Vendor added') },
    onError: (err) => toast.error(errMsg(err)),
  })
}

export function useUpdateVendor() {
  const qc = useQueryClient()
  const activeGroupId = useGroupStore((s) => s.activeGroupId)
  return useMutation({
    mutationFn: ({ id, data }) => api.updateVendor(id, data, activeGroupId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['vendors', activeGroupId] }); toast.success('Vendor updated') },
    onError: (err) => toast.error(errMsg(err)),
  })
}

export function useDeleteVendor() {
  const qc = useQueryClient()
  const activeGroupId = useGroupStore((s) => s.activeGroupId)
  return useMutation({
    mutationFn: (id) => api.deleteVendor(id, activeGroupId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['vendors', activeGroupId] }); toast.success('Vendor deleted') },
    onError: (err) => toast.error(errMsg(err)),
  })
}
