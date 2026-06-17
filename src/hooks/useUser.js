import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/axios'

export function useMe() {
  return useQuery({
    queryKey: ['me'],
    queryFn: () => api.get('/users/me').then((r) => r.data),
  })
}

export function useUpdateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => api.patch(`/users/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['me'] }),
  })
}
