import { useMutation, useQueryClient } from '@tanstack/react-query'
import { sendFriendRequest, respondFriendRequest } from '../api/friends'

export function useSendFriendRequest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: sendFriendRequest,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['me'] }),
  })
}

export function useRespondFriendRequest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: respondFriendRequest,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['me'] }),
    onError: (err) => console.error('[respondFriendRequest]', err?.response?.data || err.message),
  })
}
