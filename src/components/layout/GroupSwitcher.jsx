import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, Check, Home, Briefcase, Users, X } from 'lucide-react'
import { useGroups } from '../../hooks/useGroups'
import { usePendingInvites, useAcceptInvite, useDeclineInvite } from '../../hooks/useInvites'
import useGroupStore from '../../store/groupStore'
import useCartStore from '../../store/cartStore'

function GroupIcon({ type, size = 14, className = '' }) {
  const Icon = type === 'business' ? Briefcase : Home
  return (
    <div className={[
      'flex items-center justify-center rounded-xl flex-shrink-0 bg-zinc-100 text-zinc-600',
      className,
    ].join(' ')}>
      <Icon size={size} />
    </div>
  )
}

export default function GroupSwitcher({ compact = false, height = '' }) {
  const [open, setOpen] = useState(false)
  const [rect, setRect] = useState(null)
  const btnRef = useRef(null)
  const dropRef = useRef(null)

  const { data: groups = [], isLoading, isFetching } = useGroups()
  const { data: invites = [] } = usePendingInvites()
  const acceptInvite = useAcceptInvite()
  const declineInvite = useDeclineInvite()

  const loading = isLoading || (isFetching && groups.length === 0)
  const { activeGroupId, setActiveGroup } = useGroupStore()
  const { hydrate } = useCartStore()

  const allGroups = groups.map((g) => ({
    _id: g._id,
    name: g.displayName || g.name,
    type: g.type || 'personal',
  }))

  const active = allGroups.find((g) => g._id === activeGroupId)
  const hasInvites = invites.length > 0

  useEffect(() => {
    if (!activeGroupId && allGroups.length > 0) {
      setActiveGroup(allGroups[0]._id)
      hydrate(allGroups[0]._id)
    }
  }, [activeGroupId, allGroups.length])

  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (!btnRef.current?.contains(e.target) && !dropRef.current?.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const toggle = () => {
    if (!open && btnRef.current) setRect(btnRef.current.getBoundingClientRect())
    setOpen((o) => !o)
  }

  const select = (groupId) => {
    setActiveGroup(groupId)
    hydrate(groupId)
    setOpen(false)
  }

  const iconSize = compact ? 12 : 14
  const boxSize = compact ? 'w-5 h-5' : 'w-6 h-6'

  return (
    <>
      <button
        ref={btnRef}
        onClick={toggle}
        className={[
          'flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-700 transition-colors hover:bg-zinc-100 active:bg-zinc-200 relative',
          compact ? 'px-2.5 text-xs' : 'px-3 text-sm',
          height || (compact ? 'h-7' : 'h-9'),
        ].join(' ')}
      >
        {loading ? (
          <span className="h-3 w-20 bg-zinc-200 rounded animate-pulse" />
        ) : (
          <>
            <GroupIcon type={active?.type} size={iconSize} className={boxSize} />
            <span className="font-medium truncate max-w-[120px]">{active?.name ?? '—'}</span>
          </>
        )}
        <ChevronDown size={iconSize} className={`text-zinc-400 transition-transform flex-shrink-0 ${open ? 'rotate-180' : ''}`} />
        {hasInvites && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center">
            {invites.length}
          </span>
        )}
      </button>

      {open && rect && createPortal(
        <div
          ref={dropRef}
          style={{ position: 'fixed', top: rect.bottom + 4, right: Math.max(8, window.innerWidth - rect.right), minWidth: Math.max(rect.width, 240), maxWidth: 340, zIndex: 9999 }}
          className="bg-white border border-zinc-200 rounded-2xl shadow-xl overflow-hidden py-1"
        >
          {loading ? (
            <div className="px-4 py-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-zinc-100 animate-pulse flex-shrink-0" />
              <div className="h-3 w-24 bg-zinc-100 rounded animate-pulse" />
            </div>
          ) : allGroups.length === 0 && invites.length === 0 ? (
            <p className="px-4 py-3 text-sm text-zinc-400">No groups yet</p>
          ) : (
            <>
              {allGroups.map((g) => (
                <button
                  key={g._id}
                  onClick={() => select(g._id)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-zinc-50 transition-colors"
                >
                  <GroupIcon type={g.type} size={16} className="w-8 h-8 rounded-xl" />
                  <span className={`flex-1 text-left ${g._id === activeGroupId ? 'font-semibold text-zinc-900' : 'text-zinc-700'}`}>
                    {g.name}
                  </span>
                  {g._id === activeGroupId && <Check size={14} className="text-zinc-900 flex-shrink-0" />}
                </button>
              ))}

              {invites.length > 0 && (
                <>
                  <div className="mx-3 my-1 border-t border-zinc-100" />
                  <div className="px-4 pt-1.5 pb-1">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">Pending Invites</p>
                  </div>
                  {invites.map((inv) => (
                    <div key={inv._id} className="px-4 py-2.5 flex items-start gap-3">
                      <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
                        <Users size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-zinc-900 truncate">
                          {inv.groupId?.displayName || inv.groupId?.name || inv.groupName}
                        </p>
                        <p className="text-xs text-zinc-500 truncate">
                          From {inv.invitedBy?.name || 'someone'}
                        </p>
                        <div className="flex gap-1.5 mt-1.5">
                          <button
                            onClick={() => acceptInvite.mutate(inv._id)}
                            disabled={acceptInvite.isPending}
                            className="h-7 px-2.5 rounded-lg bg-zinc-900 text-white text-xs font-medium hover:bg-zinc-800 transition-colors flex items-center gap-1"
                          >
                            <Check size={12} /> Accept
                          </button>
                          <button
                            onClick={() => declineInvite.mutate(inv._id)}
                            disabled={declineInvite.isPending}
                            className="h-7 px-2.5 rounded-lg border border-zinc-200 text-zinc-600 text-xs font-medium hover:bg-zinc-50 transition-colors flex items-center gap-1"
                          >
                            <X size={12} /> Decline
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </>
          )}
        </div>,
        document.body
      )}
    </>
  )
}
