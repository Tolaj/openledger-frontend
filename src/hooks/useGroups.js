import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as api from '../api/groups'
import { toast } from '../store/toastStore'

const errMsg = (err) => err?.response?.data?.error || err?.message || 'Something went wrong'

export function useGroups() {
  return useQuery({
    queryKey: ['groups'],
    queryFn: () => api.getGroups().then((r) => r.data),
  })
}

export function useGroup(id) {
  return useQuery({
    queryKey: ['groups', id],
    queryFn: () => api.getGroup(id).then((r) => r.data),
    enabled: !!id,
  })
}

export function useCreateGroup() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: api.createGroup,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['groups'] }); toast.success('Group created') },
    onError: (err) => toast.error(errMsg(err)),
  })
}

export function useUpdateGroup() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => api.updateGroup(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['groups'] }); toast.success('Group updated') },
    onError: (err) => toast.error(errMsg(err)),
  })
}

export function useDeleteGroup() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: api.deleteGroup,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['groups'] }); toast.success('Group deleted') },
    onError: (err) => toast.error(errMsg(err)),
  })
}
