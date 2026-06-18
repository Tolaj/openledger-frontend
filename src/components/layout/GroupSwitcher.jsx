import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, Check, Users } from 'lucide-react'
import { useGroups } from '../../hooks/useGroups'
import useGroupStore from '../../store/groupStore'
import useCartStore from '../../store/cartStore'
import useAuthStore from '../../store/authStore'

export default function GroupSwitcher({ compact = false }) {
  const [open, setOpen] = useState(false)
  const [rect, setRect] = useState(null)
  const btnRef = useRef(null)
  const dropRef = useRef(null)

  const { data: groups = [] } = useGroups()
  const { activeGroupId, setActiveGroup } = useGroupStore()
  const { hydrate } = useCartStore()
  const user = useAuthStore((s) => s.user)

  const sharedGroups = groups.filter((g) => g.name !== 'ISOLATED_GROUP')
  const isolatedGroup = groups.find((g) => g.name === 'ISOLATED_GROUP')

  const allGroups = [
    isolatedGroup && { _id: isolatedGroup._id, name: 'Personal', icon: '🏠' },
    ...sharedGroups.map((g) => ({ _id: g._id, name: g.name, icon: '👥' })),
  ].filter(Boolean)

  const active = allGroups.find((g) => g._id === activeGroupId)

  // Auto-select isolated (Personal) group on first login if nothing is stored
  useEffect(() => {
    if (!activeGroupId && isolatedGroup) {
      setActiveGroup(isolatedGroup._id)
      hydrate(isolatedGroup._id)
    }
  }, [activeGroupId, isolatedGroup?._id])

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

  return (
    <>
      <button
        ref={btnRef}
        onClick={toggle}
        className={[
          'flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-700 transition-colors hover:bg-zinc-100 active:bg-zinc-200',
          compact ? 'px-2.5 py-1.5 text-xs' : 'px-3 py-2 text-sm',
        ].join(' ')}
      >
        <Users size={compact ? 12 : 14} className="text-zinc-500 flex-shrink-0" />
        <span className="font-medium truncate max-w-[120px]">{active?.name ?? '—'}</span>
        <ChevronDown size={compact ? 12 : 14} className={`text-zinc-400 transition-transform flex-shrink-0 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && rect && createPortal(
        <div
          ref={dropRef}
          style={{ position: 'fixed', top: rect.bottom + 4, left: rect.left, minWidth: rect.width, zIndex: 9999 }}
          className="bg-white border border-zinc-200 rounded-2xl shadow-xl overflow-hidden py-1"
        >
          {allGroups.length === 0 ? (
            <p className="px-4 py-3 text-sm text-zinc-400">No groups yet</p>
          ) : allGroups.map((g) => (
            <button
              key={g._id}
              onClick={() => select(g._id)}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-zinc-50 transition-colors"
            >
              <span className="text-base leading-none">{g.icon}</span>
              <span className={`flex-1 text-left ${g._id === activeGroupId ? 'font-semibold text-zinc-900' : 'text-zinc-700'}`}>
                {g.name}
              </span>
              {g._id === activeGroupId && <Check size={14} className="text-zinc-900 flex-shrink-0" />}
            </button>
          ))}
        </div>,
        document.body
      )}
    </>
  )
}
