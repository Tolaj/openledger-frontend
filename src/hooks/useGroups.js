import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as api from '../api/groups'

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
    onSuccess: () => qc.invalidateQueries({ queryKey: ['groups'] }),
  })
}

export function useUpdateGroup() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => api.updateGroup(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['groups'] }),
  })
}

export function useDeleteGroup() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: api.deleteGroup,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['groups'] }),
  })
}
