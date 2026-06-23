import { useMutation, useQueryClient } from '@tanstack/react-query'
import { sendFriendRequest, respondFriendRequest } from '../api/friends'
import { toast } from '../store/toastStore'

const errMsg = (err) => err?.response?.data?.error || err?.message || 'Something went wrong'

export function useSendFriendRequest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: sendFriendRequest,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['me'] }); toast.success('Friend request sent') },
    onError: (err) => toast.error(errMsg(err)),
  })
}

export function useRespondFriendRequest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: respondFriendRequest,
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['me'] })
      if (vars?.action === 'ACCEPTED') toast.success('Friend request accepted')
      else if (vars?.action === 'DELETE') toast.success('Friend removed')
      else toast.info('Friend request updated')
    },
    onError: (err) => toast.error(errMsg(err)),
  })
}
