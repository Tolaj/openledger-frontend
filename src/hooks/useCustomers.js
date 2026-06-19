import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as api from '../api/customers'
import useGroupStore from '../store/groupStore'

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
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customers', activeGroupId] }),
  })
}

export function useUpdateCustomer() {
  const qc = useQueryClient()
  const activeGroupId = useGroupStore((s) => s.activeGroupId)
  return useMutation({
    mutationFn: ({ id, data }) => api.updateCustomer(id, data, activeGroupId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customers', activeGroupId] }),
  })
}

export function useDeleteCustomer() {
  const qc = useQueryClient()
  const activeGroupId = useGroupStore((s) => s.activeGroupId)
  return useMutation({
    mutationFn: (id) => api.deleteCustomer(id, activeGroupId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customers', activeGroupId] }),
  })
}
