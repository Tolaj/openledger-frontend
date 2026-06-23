import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as api from '../api/customers'
import useGroupStore from '../store/groupStore'
import { toast } from '../store/toastStore'

const errMsg = (err) => err?.response?.data?.error || err?.message || 'Something went wrong'

export function useCustomers() {
  const activeGroupId = useGroupStore((s) => s.activeGroupId)
  return useQuery({
    queryKey: ['customers', activeGroupId],
    queryFn: () => api.getCustomers(activeGroupId).then((r) => r.data),
    enabled: !!activeGroupId,
  })
}

export function useCreateCustomer() {
  const qc = useQueryClient()
  const activeGroupId = useGroupStore((s) => s.activeGroupId)
  return useMutation({
    mutationFn: (data) => api.createCustomer(data, activeGroupId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['customers', activeGroupId] }); toast.success('Customer added') },
    onError: (err) => toast.error(errMsg(err)),
  })
}

export function useUpdateCustomer() {
  const qc = useQueryClient()
  const activeGroupId = useGroupStore((s) => s.activeGroupId)
  return useMutation({
    mutationFn: ({ id, data }) => api.updateCustomer(id, data, activeGroupId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['customers', activeGroupId] }); toast.success('Customer updated') },
    onError: (err) => toast.error(errMsg(err)),
  })
}

export function useDeleteCustomer() {
  const qc = useQueryClient()
  const activeGroupId = useGroupStore((s) => s.activeGroupId)
  return useMutation({
    mutationFn: (id) => api.deleteCustomer(id, activeGroupId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['customers', activeGroupId] }); toast.success('Customer deleted') },
    onError: (err) => toast.error(errMsg(err)),
  })
}
