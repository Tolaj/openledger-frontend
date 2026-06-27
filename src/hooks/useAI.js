import { useMutation, useQuery } from '@tanstack/react-query'
import * as api from '../api/ai'
import { toast } from '../store/toastStore'
import useGroupStore from '../store/groupStore'

const errMsg = (err) => err?.response?.data?.error || err?.message || 'AI request failed'

export function useScanReceipt() {
  return useMutation({
    mutationFn: api.scanReceipt,
    onError: (err) => toast.error(errMsg(err)),
  })
}

export function useSuggestProduct() {
  return useMutation({
    mutationFn: api.suggestProduct,
    onError: (err) => toast.error(errMsg(err)),
  })
}

export function useInsights() {
  const groupId = useGroupStore((s) => s.activeGroupId)
  return useQuery({
    queryKey: ['ai-insights', groupId],
    queryFn: () => api.getInsights(groupId).then((r) => r.data),
    enabled: !!groupId,
    staleTime: 1000 * 60 * 15, // cache 15 min — conserve free quota
  })
}

export function useChat() {
  return useMutation({
    mutationFn: api.chat,
    onError: (err) => toast.error(errMsg(err)),
  })
}
