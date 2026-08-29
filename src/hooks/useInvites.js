import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getPendingInvites, acceptInvite, declineInvite, getPendingForGroup } from '../api/invites'
import { toast } from '../store/toastStore'

const errMsg = (err) => err?.response?.data?.error || err?.message || 'Something went wrong'

export function usePendingInvites() {
  return useQuery({
    queryKey: ['invites'],
    queryFn: () => getPendingInvites().then(r => r.data),
    refetchInterval: 60_000,
  })
}

export function useAcceptInvite() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: acceptInvite,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['invites'] })
      qc.invalidateQueries({ queryKey: ['groups'] })
      qc.invalidateQueries({ queryKey: ['me'] })
      toast.success('Invite accepted — you joined the group')
    },
    onError: (err) => toast.error(errMsg(err)),
  })
}

export function useDeclineInvite() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: declineInvite,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['invites'] })
      toast.info('Invite declined')
    },
    onError: (err) => toast.error(errMsg(err)),
  })
}

export function usePendingForGroup(groupId) {
  return useQuery({
    queryKey: ['invites', 'group', groupId],
    queryFn: () => getPendingForGroup(groupId).then(r => r.data),
    enabled: !!groupId,
  })
}
