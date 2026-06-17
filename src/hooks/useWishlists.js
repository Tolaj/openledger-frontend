import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as api from '../api/wishlists'
import useGroupStore from '../store/groupStore'

export function useWishlists() {
  const activeGroupId = useGroupStore((s) => s.activeGroupId)
  return useQuery({
    queryKey: ['wishlists', activeGroupId],
    queryFn: () => api.getWishlists(activeGroupId).then((r) => r.data),
    enabled: !!activeGroupId,
  })
}

export function useCreateWishlist() {
  const qc = useQueryClient()
  const activeGroupId = useGroupStore((s) => s.activeGroupId)
  return useMutation({
    mutationFn: api.createWishlist,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wishlists', activeGroupId] }),
  })
}

export function useUpdateWishlist() {
  const qc = useQueryClient()
  const activeGroupId = useGroupStore((s) => s.activeGroupId)
  return useMutation({
    mutationFn: ({ id, data }) => api.updateWishlist(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wishlists', activeGroupId] }),
  })
}

export function useDeleteWishlist() {
  const qc = useQueryClient()
  const activeGroupId = useGroupStore((s) => s.activeGroupId)
  return useMutation({
    mutationFn: api.deleteWishlist,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wishlists', activeGroupId] }),
  })
}
