import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as api from '../api/categories'
import * as groupApi from '../api/groups'
import useGroupStore from '../store/groupStore'

export function useCategories() {
  const activeGroupId = useGroupStore((s) => s.activeGroupId)
  return useQuery({
    queryKey: ['categories', activeGroupId],
    queryFn: async () => {
      const [catsRes, groupRes] = await Promise.all([
        api.getCategories(activeGroupId),
        groupApi.getGroup(activeGroupId),
      ])
      const allCategories = catsRes.data
      const group = groupRes.data
      const groupCategoryIds = new Set(
        (group.categories || []).map((c) => String(c._id || c))
      )
      return allCategories.filter((c) => groupCategoryIds.has(String(c._id)))
    },
    enabled: !!activeGroupId,
  })
}

export function useCreateCategory() {
  const qc = useQueryClient()
  const activeGroupId = useGroupStore((s) => s.activeGroupId)
  return useMutation({
    mutationFn: api.createCategory,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categories', activeGroupId] }),
  })
}

export function useUpdateCategory() {
  const qc = useQueryClient()
  const activeGroupId = useGroupStore((s) => s.activeGroupId)
  return useMutation({
    mutationFn: ({ id, data }) => api.updateCategory(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categories', activeGroupId] }),
  })
}

export function useDeleteCategory() {
  const qc = useQueryClient()
  const activeGroupId = useGroupStore((s) => s.activeGroupId)
  return useMutation({
    mutationFn: api.deleteCategory,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categories', activeGroupId] }),
  })
}
