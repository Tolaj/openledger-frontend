import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as api from '../api/stockMovements'
import useGroupStore from '../store/groupStore'

export function useStockMovements() {
  const activeGroupId = useGroupStore((s) => s.activeGroupId)
  return useQuery({
    queryKey: ['stock-movements', activeGroupId],
    queryFn: () => api.getStockMovements(activeGroupId).then((r) => r.data),
    enabled: !!activeGroupId,
  })
}

export function useCreateAdjustment() {
  const qc = useQueryClient()
  const activeGroupId = useGroupStore((s) => s.activeGroupId)
  return useMutation({
    mutationFn: (data) => api.createAdjustment(activeGroupId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['stock-movements', activeGroupId] })
      qc.invalidateQueries({ queryKey: ['inventory', activeGroupId] })
    },
  })
}
