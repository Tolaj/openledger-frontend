import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, Check, Home, Briefcase } from 'lucide-react'
import { useGroups } from '../../hooks/useGroups'
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

  const { data: groups = [] } = useGroups()
  const { activeGroupId, setActiveGroup } = useGroupStore()
  const { hydrate } = useCartStore()

  const allGroups = groups.map((g) => ({
    _id: g._id,
    name: g.displayName || g.name,
    type: g.type || 'personal',
  }))

  const active = allGroups.find((g) => g._id === activeGroupId)

  // Auto-select first group if nothing stored
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
          'flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-700 transition-colors hover:bg-zinc-100 active:bg-zinc-200',
          compact ? 'px-2.5 text-xs' : 'px-3 text-sm',
          height || (compact ? 'h-7' : 'h-9'),
        ].join(' ')}
      >
        <GroupIcon type={active?.type} size={iconSize} className={boxSize} />
        <span className="font-medium truncate max-w-[120px]">{active?.name ?? '—'}</span>
        <ChevronDown size={iconSize} className={`text-zinc-400 transition-transform flex-shrink-0 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && rect && createPortal(
        <div
          ref={dropRef}
          style={{ position: 'fixed', top: rect.bottom + 4, left: rect.left, minWidth: Math.max(rect.width, 200), zIndex: 9999 }}
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
              <GroupIcon type={g.type} size={16} className="w-8 h-8 rounded-xl" />
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
