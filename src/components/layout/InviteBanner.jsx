import { useState } from 'react'
import { X, Users, Check } from 'lucide-react'
import { usePendingInvites, useAcceptInvite, useDeclineInvite } from '../../hooks/useInvites'
import Button from '../ui/Button'

export default function InviteBanner() {
  const { data: invites } = usePendingInvites()
  const accept = useAcceptInvite()
  const decline = useDeclineInvite()
  const [dismissed, setDismissed] = useState(new Set())

  const visible = invites?.filter(i => !dismissed.has(i._id)) || []
  if (visible.length === 0) return null

  return (
    <div className="bg-zinc-900 text-white px-4 py-2.5 flex flex-col gap-2">
      {visible.map(inv => (
        <div key={inv._id} className="flex items-center gap-3 text-sm">
          <Users size={16} className="text-zinc-400 shrink-0" />
          <span className="flex-1 min-w-0 truncate">
            <strong>{inv.invitedBy?.name || 'Someone'}</strong> invited you to{' '}
            <strong>{inv.groupId?.displayName || inv.groupId?.name || inv.groupName}</strong>
          </span>
          <div className="flex gap-1.5 shrink-0">
            <button
              onClick={() => accept.mutate(inv._id)}
              disabled={accept.isPending}
              className="h-7 px-2.5 rounded-lg bg-white text-zinc-900 text-xs font-medium hover:bg-zinc-100 transition-colors flex items-center gap-1"
            >
              <Check size={14} /> Accept
            </button>
            <button
              onClick={() => decline.mutate(inv._id)}
              disabled={decline.isPending}
              className="h-7 px-2.5 rounded-lg bg-zinc-800 text-zinc-300 text-xs font-medium hover:bg-zinc-700 transition-colors"
            >
              Decline
            </button>
            <button
              onClick={() => setDismissed(prev => new Set(prev).add(inv._id))}
              className="h-7 w-7 rounded-lg bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white transition-colors flex items-center justify-center"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
