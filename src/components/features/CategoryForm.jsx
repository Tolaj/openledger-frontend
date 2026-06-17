import { useEffect, useId, useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useForm, Controller } from 'react-hook-form'
import { ChevronDown } from 'lucide-react'
import useGroupStore from '../../store/groupStore'
import { useCreateCategory, useUpdateCategory } from '../../hooks/useCategories'
import BottomSheet from '../ui/BottomSheet'
import Input from '../ui/Input'
import Button from '../ui/Button'

const ICON_GROUPS = [
  { label: 'Produce & Dairy', icons: ['🥦', '🥬', '🥕', '🧅', '🧄', '🍅', '🍆', '🌽', '🥒', '🥑', '🍋', '🍎', '🍇', '🍓', '🍌', '🥛', '🧀', '🥚'] },
  { label: 'Meat & Seafood', icons: ['🥩', '🍗', '🥓', '🌭', '🍖', '🦐', '🐟', '🦑'] },
  { label: 'Bakery & Pantry', icons: ['🍞', '🥐', '🥖', '🫙', '🥫', '🧂', '🍯', '🧃', '🫒', '🌾'] },
  { label: 'Beverages', icons: ['☕', '🍵', '🧋', '🥤', '🍷', '🍺', '🧉', '🫖'] },
  { label: 'Household & Cleaning', icons: ['🧹', '🧴', '🧻', '🧼', '🪣', '🧽', '🪥', '🫧', '🔧', '🪛', '🧯'] },
  { label: 'Personal Care', icons: ['🪒', '💊', '🩺', '🧖', '💄', '🪞', '🛁'] },
  { label: 'Other', icons: ['📦', '🛒', '🏠', '❄️', '⚡', '🌿', '♻️', '🎁'] },
]

const COLOR_GRID = [
  // each row is one hue, cols are 100→600
  ['#fee2e2','#fecaca','#fca5a5','#f87171','#ef4444','#dc2626'], // red
  ['#ffedd5','#fed7aa','#fdba74','#fb923c','#f97316','#ea580c'], // orange
  ['#fef9c3','#fef08a','#fde047','#facc15','#eab308','#ca8a04'], // yellow
  ['#dcfce7','#bbf7d0','#86efac','#4ade80','#22c55e','#16a34a'], // green
  ['#d1fae5','#a7f3d0','#6ee7b7','#34d399','#10b981','#059669'], // emerald
  ['#cffafe','#a5f3fc','#67e8f9','#22d3ee','#06b6d4','#0891b2'], // cyan
  ['#dbeafe','#bfdbfe','#93c5fd','#60a5fa','#3b82f6','#2563eb'], // blue
  ['#ede9fe','#ddd6fe','#c4b5fd','#a78bfa','#8b5cf6','#7c3aed'], // violet
  ['#fce7f3','#fbcfe8','#f9a8d4','#f472b6','#ec4899','#db2777'], // pink
  ['#f4f4f5','#e4e4e7','#a1a1aa','#71717a','#52525b','#18181b'], // zinc
]

function PortalDropdown({ anchorRef, open, onClose, children }) {
  const [rect, setRect] = useState(null)
  const contentRef = useRef(null)

  useEffect(() => {
    if (open && anchorRef.current) {
      setRect(anchorRef.current.getBoundingClientRect())
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      const inAnchor = anchorRef.current?.contains(e.target)
      const inContent = contentRef.current?.contains(e.target)
      if (!inAnchor && !inContent) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  if (!open || !rect) return null

  const spaceBelow = window.innerHeight - rect.bottom
  const above = spaceBelow < 260

  return createPortal(
    <div
      ref={contentRef}
      style={{
        position: 'fixed',
        left: rect.left,
        width: rect.width,
        ...(above
          ? { bottom: window.innerHeight - rect.top + 4 }
          : { top: rect.bottom + 4 }),
        zIndex: 9999,
      }}
      className="bg-white border border-zinc-200 rounded-2xl shadow-xl max-h-60 overflow-y-auto"
    >
      {children}
    </div>,
    document.body
  )
}

function IconPicker({ value, onChange }) {
  const [open, setOpen] = useState(false)
  const btnRef = useRef(null)

  return (
    <div ref={btnRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full h-11 flex items-center justify-between px-3 rounded-xl border border-zinc-300 bg-white text-sm text-zinc-900 outline-none focus:border-zinc-900"
      >
        <span className="flex items-center gap-2">
          <span className="text-xl">{value}</span>
          <span className="text-zinc-500">Select icon</span>
        </span>
        <ChevronDown size={16} className={`text-zinc-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      <PortalDropdown anchorRef={btnRef} open={open} onClose={() => setOpen(false)}>
        <div className="p-3 flex flex-col gap-3">
          {ICON_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wide mb-1.5">{group.label}</p>
              <div className="flex flex-wrap gap-1">
                {group.icons.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => { onChange(icon); setOpen(false) }}
                    className={[
                      'w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-colors',
                      value === icon ? 'bg-zinc-900' : 'hover:bg-zinc-100',
                    ].join(' ')}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </PortalDropdown>
    </div>
  )
}

function ColorPicker({ value, onChange }) {
  const [open, setOpen] = useState(false)
  const btnRef = useRef(null)

  return (
    <div ref={btnRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full h-11 flex items-center justify-between px-3 rounded-xl border border-zinc-300 bg-white text-sm text-zinc-900 outline-none focus:border-zinc-900"
      >
        <span className="flex items-center gap-2">
          <span className="w-5 h-5 rounded-md flex-shrink-0 border border-black/10" style={{ backgroundColor: value }} />
          <span className="text-zinc-500 font-mono text-xs">{value}</span>
        </span>
        <ChevronDown size={16} className={`text-zinc-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      <PortalDropdown anchorRef={btnRef} open={open} onClose={() => setOpen(false)}>
        <div className="p-3">
          <div className="flex flex-col gap-1">
            {COLOR_GRID.map((row, ri) => (
              <div key={ri} className="flex gap-1">
                {row.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => { onChange(color); setOpen(false) }}
                    title={color}
                    className="flex-1 h-6 rounded-md border-2 transition-transform hover:scale-110"
                    style={{
                      backgroundColor: color,
                      borderColor: value === color ? '#18181b' : 'transparent',
                    }}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </PortalDropdown>
    </div>
  )
}

export default function CategoryForm({ open, onClose, editing }) {
  const formId = useId()
  const groupId = useGroupStore((s) => s.activeGroupId)
  const { mutate: create, isPending: creating } = useCreateCategory()
  const { mutate: update, isPending: updating } = useUpdateCategory()

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm({
    defaultValues: { name: '', description: '', icon: '📦', color: '#18181b' },
  })

  useEffect(() => {
    if (editing) {
      reset({ name: editing.name, description: editing.description || '', icon: editing.icon || '📦', color: editing.color || '#18181b' })
    } else {
      reset({ name: '', description: '', icon: '📦', color: '#18181b' })
    }
  }, [editing, open])

  const onSubmit = (data) => {
    const payload = { ...data, groupId }
    if (editing) {
      update({ id: editing._id, data: payload }, { onSuccess: onClose })
    } else {
      create(payload, { onSuccess: onClose })
    }
  }

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={editing ? 'Edit Category' : 'New Category'}
      footer={
        <Button type="submit" form={formId} fullWidth loading={creating || updating}>
          {editing ? 'Save changes' : 'Create category'}
        </Button>
      }
    >
      <form id={formId} onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Input
          label="Name"
          placeholder="e.g. Dairy"
          error={errors.name?.message}
          {...register('name', { required: 'Name is required' })}
        />

        <Input
          label="Description (optional)"
          placeholder="Brief description of this category"
          {...register('description')}
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-zinc-700">Icon</label>
          <Controller
            name="icon"
            control={control}
            render={({ field }) => <IconPicker value={field.value} onChange={field.onChange} />}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-zinc-700">Color</label>
          <Controller
            name="color"
            control={control}
            render={({ field }) => <ColorPicker value={field.value} onChange={field.onChange} />}
          />
        </div>
      </form>
    </BottomSheet>
  )
}
