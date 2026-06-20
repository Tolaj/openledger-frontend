import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, Search, X } from 'lucide-react'

/**
 * ProductPicker — custom dropdown showing category icon, name, price, unit.
 * Uses a portal so it's never clipped by BottomSheet overflow.
 * Props:
 *   products  — array of product objects (category must be populated: { icon, name })
 *   value     — currently selected product _id ('' = ad-hoc)
 *   onChange  — (productId) => void
 *   sym       — currency symbol string
 */
export default function ProductPicker({ products = [], value, onChange, sym = '₹', error }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [rect, setRect] = useState(null)
  const triggerRef = useRef(null)

  const selected = products.find((p) => p._id === value) || null

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (
        triggerRef.current && !triggerRef.current.contains(e.target) &&
        !document.getElementById('product-picker-portal')?.contains(e.target)
      ) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const openDropdown = () => {
    if (triggerRef.current) setRect(triggerRef.current.getBoundingClientRect())
    setOpen(true)
  }

  const filtered = products.filter((p) =>
    !query || p.name.toLowerCase().includes(query.toLowerCase()) ||
    (p.category?.name || '').toLowerCase().includes(query.toLowerCase())
  )

  const select = (id) => { onChange(id); setOpen(false); setQuery('') }

  const DROPDOWN_H = 300
  const posStyle = rect
    ? (rect.bottom + DROPDOWN_H > window.innerHeight
        ? { bottom: window.innerHeight - rect.top + 4 }
        : { top: rect.bottom + 4 })
    : {}

  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-zinc-500">From catalog</label>

      {/* Trigger */}
      <button
        ref={triggerRef}
        type="button"
        onClick={openDropdown}
        className={[
          'h-9 w-full flex items-center justify-between gap-2 rounded-xl border bg-white px-3 text-sm text-zinc-700 transition-colors',
          error ? 'border-red-400 bg-red-50' : open ? 'border-zinc-900' : 'border-zinc-200 hover:border-zinc-300',
        ].join(' ')}
      >
        {selected ? (
          <span className="flex items-center gap-2 min-w-0">
            {selected.category?.icon && <span className="text-base leading-none flex-shrink-0">{selected.category.icon}</span>}
            <span className="truncate font-medium text-zinc-900">{selected.name}</span>
            <span className="text-zinc-400 flex-shrink-0">{sym}{Number(selected.price || 0).toFixed(2)} / {selected.unit}</span>
          </span>
        ) : (
          <span className="text-zinc-400">— Ad-hoc item —</span>
        )}
        <ChevronDown size={14} className={`flex-shrink-0 text-zinc-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}

      {/* Portal dropdown */}
      {open && rect && createPortal(
        <div
          id="product-picker-portal"
          style={{ position: 'fixed', left: rect.left, width: rect.width, zIndex: 9999, maxHeight: DROPDOWN_H, ...posStyle }}
          className="bg-white border border-zinc-200 rounded-xl shadow-xl overflow-hidden flex flex-col"
        >
          {/* Search */}
          <div className="flex items-center gap-2 px-3 py-2 border-b border-zinc-100 flex-shrink-0">
            <Search size={13} className="text-zinc-400 flex-shrink-0" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products…"
              className="flex-1 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none bg-transparent"
            />
            {query && <button type="button" onClick={() => setQuery('')}><X size={13} className="text-zinc-400" /></button>}
          </div>

          {/* Ad-hoc option */}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => select('')}
            className={[
              'w-full flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-zinc-50 transition-colors border-b border-zinc-100 flex-shrink-0',
              !value ? 'bg-zinc-50 font-medium text-zinc-900' : 'text-zinc-500',
            ].join(' ')}
          >
            <span className="w-7 h-7 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-400 flex-shrink-0">—</span>
            <span>Ad-hoc item (free text)</span>
          </button>

          {/* Product list */}
          <div className="overflow-y-auto flex-1">
            {filtered.length === 0 ? (
              <p className="px-3 py-4 text-sm text-zinc-400 text-center">No products found</p>
            ) : filtered.map((p) => (
              <button
                key={p._id}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => select(p._id)}
                className={[
                  'w-full flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-zinc-50 transition-colors text-left border-b border-zinc-100 last:border-0',
                  value === p._id ? 'bg-zinc-50' : '',
                ].join(' ')}
              >
                <span
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-base flex-shrink-0"
                  style={{ backgroundColor: p.category?.color ? `${p.category.color}22` : '#f4f4f5' }}
                >
                  {p.category?.icon || '📦'}
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block font-medium text-zinc-900 truncate">{p.name}</span>
                  {p.category?.name && <span className="text-xs text-zinc-400">{p.category.name}</span>}
                </span>
                <span className="flex-shrink-0 text-right">
                  <span className="block text-sm font-semibold text-zinc-900">{sym}{Number(p.price || 0).toFixed(2)}</span>
                  <span className="text-xs text-zinc-400">{p.unit}</span>
                </span>
              </button>
            ))}
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
