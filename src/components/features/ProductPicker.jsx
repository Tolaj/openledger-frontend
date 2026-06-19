import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Search, X } from 'lucide-react'

/**
 * ProductPicker — custom dropdown showing category icon, name, price, unit.
 * Props:
 *   products  — array of product objects (category must be populated: { icon, name })
 *   value     — currently selected product _id ('' = ad-hoc)
 *   onChange  — (productId) => void
 *   sym       — currency symbol string
 */
export default function ProductPicker({ products = [], value, onChange, sym = '₹' }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const ref = useRef(null)

  const selected = products.find((p) => p._id === value) || null

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filtered = products.filter((p) =>
    !query || p.name.toLowerCase().includes(query.toLowerCase()) ||
    (p.category?.name || '').toLowerCase().includes(query.toLowerCase())
  )

  const select = (id) => { onChange(id); setOpen(false); setQuery('') }

  return (
    <div className="flex flex-col gap-1" ref={ref}>
      <label className="text-xs font-medium text-zinc-500">From catalog</label>

      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="h-9 w-full flex items-center justify-between gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 text-sm text-zinc-700 hover:border-zinc-300 transition-colors"
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

      {/* Dropdown panel */}
      {open && (
        <div className="absolute z-50 mt-1 w-full min-w-[260px] rounded-xl border border-zinc-200 bg-white shadow-lg overflow-hidden"
          style={{ maxHeight: 280 }}>
          {/* Search */}
          <div className="flex items-center gap-2 px-3 py-2 border-b border-zinc-100">
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
            onClick={() => select('')}
            className={[
              'w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-zinc-50 transition-colors border-b border-zinc-100',
              !value ? 'bg-zinc-50 font-medium text-zinc-900' : 'text-zinc-500',
            ].join(' ')}
          >
            <span className="w-6 text-center">—</span>
            <span>Ad-hoc item (free text)</span>
          </button>

          {/* Product list */}
          <div className="overflow-y-auto" style={{ maxHeight: 200 }}>
            {filtered.length === 0 ? (
              <p className="px-3 py-4 text-sm text-zinc-400 text-center">No products found</p>
            ) : (
              filtered.map((p) => (
                <button
                  key={p._id}
                  type="button"
                  onClick={() => select(p._id)}
                  className={[
                    'w-full flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-zinc-50 transition-colors text-left',
                    value === p._id ? 'bg-zinc-50' : '',
                  ].join(' ')}
                >
                  <span className="w-6 text-center text-base leading-none flex-shrink-0">
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
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
