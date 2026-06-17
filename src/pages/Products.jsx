import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { Plus, Tag, Heart, Package, ShoppingCart, Pencil, Trash2, ShoppingBasket, ChevronDown, Check, ClipboardList } from 'lucide-react'
import TopBar from '../components/layout/TopBar'
import PageHeader from '../components/layout/PageHeader'
import Button from '../components/ui/Button'
import EmptyState from '../components/ui/EmptyState'
import Spinner from '../components/ui/Spinner'
import ProductForm from '../components/features/ProductForm'
import CategoryForm from '../components/features/CategoryForm'
import PageActions from '../components/layout/PageActions'
import { useProducts, useDeleteProduct } from '../hooks/useProducts'
import { useCategories, useDeleteCategory } from '../hooks/useCategories'
import { useOrders, useDeleteOrder } from '../hooks/useOrders'
import { useWishlists, useDeleteWishlist, useUpdateWishlist } from '../hooks/useWishlists'
import { useInventory, useDeleteInventory } from '../hooks/useInventory'
import useCartStore from '../store/cartStore'
import useAuthStore from '../store/authStore'
import useGroupStore from '../store/groupStore'
import useWishlistStore from '../store/wishlistStore'
import { useGroup } from '../hooks/useGroups'

// ── InlineNumber — click to edit ─────────────────────────────────────────────
function InlineNumber({ value, onCommit, format = (v) => v }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const inputRef = useRef(null)

  const startEdit = () => {
    setDraft(String(value))
    setEditing(true)
    setTimeout(() => inputRef.current?.select(), 0)
  }

  const commit = () => {
    const n = parseFloat(draft)
    if (!isNaN(n) && n > 0) onCommit(n)
    setEditing(false)
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false) }}
        className="w-14 text-center text-sm font-semibold text-zinc-900 border border-zinc-900 rounded-lg px-1 py-0.5 outline-none"
      />
    )
  }

  return (
    <span
      onClick={startEdit}
      className="w-14 text-center text-sm font-semibold text-zinc-900 cursor-text select-none rounded-lg px-1 py-0.5 hover:bg-zinc-100 transition-colors inline-block"
    >
      {format(value)}
    </span>
  )
}

// ── SplitAmong dropdown ───────────────────────────────────────────────────────
function SplitDropdown({ members = [], splitAmong, onChange }) {
  const [open, setOpen] = useState(false)
  const btnRef = useRef(null)
  const dropRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (!btnRef.current?.contains(e.target) && !dropRef.current?.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const [rect, setRect] = useState(null)
  const toggle = () => {
    if (!open && btnRef.current) setRect(btnRef.current.getBoundingClientRect())
    setOpen((o) => !o)
  }

  const toggleMember = (id) => {
    const next = splitAmong.includes(id)
      ? splitAmong.filter((m) => m !== id)
      : [...splitAmong, id]
    if (next.length > 0) onChange(next)
  }

  const allSelected = members.length > 0 && members.every((m) => splitAmong.includes(String(m._id)))
  const label = allSelected ? 'Even' : 'Uneven'

  return (
    <>
      <button
        ref={btnRef}
        onClick={toggle}
        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-zinc-900 text-white text-xs font-semibold whitespace-nowrap"
      >
        {label} <ChevronDown size={12} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && rect && createPortal(
        <div
          ref={dropRef}
          style={{ position: 'fixed', top: rect.bottom + 4, left: rect.left, minWidth: 140, zIndex: 9999 }}
          className="bg-white border border-zinc-200 rounded-xl shadow-lg py-1"
        >
          {members.map((m) => (
            <button
              key={m._id}
              onClick={() => toggleMember(String(m._id))}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-zinc-700 hover:bg-zinc-50"
            >
              <span className={[
                'w-4 h-4 rounded flex items-center justify-center border flex-shrink-0',
                splitAmong.includes(String(m._id)) ? 'bg-zinc-900 border-zinc-900' : 'border-zinc-300',
              ].join(' ')}>
                {splitAmong.includes(String(m._id)) && <Check size={9} className="text-white" />}
              </span>
              {m.name || m.email}
            </button>
          ))}
        </div>,
        document.body
      )}
    </>
  )
}

// ── Products List tab ─────────────────────────────────────────────────────────
function ProductsListTab({ products, categories, loading, onEdit, onDelete, groupMembers, groupMemberObjects }) {
  const { addItem, items } = useCartStore()
  const [qty, setQty] = useState({})
  const [prices, setPrices] = useState({})
  const [splits, setSplits] = useState({})  // productId -> splitAmong array
  const [filters, setFilters] = useState({ name: '', description: '', category: '', price: '', unit: '', manufacturer: '' })
  const [expanded, setExpanded] = useState({})
  const [mobileUnits, setMobileUnits] = useState({})

  const getQty   = (id) => qty[id] ?? 1
  const setQ     = (id, val) => setQty((prev) => ({ ...prev, [id]: Math.max(1, val) }))
  const getPrice = (p) => prices[p._id] ?? parseFloat(p.price)
  const adjPrice = (p, delta) => setPrices((prev) => ({
    ...prev,
    [p._id]: Math.max(0, parseFloat((getPrice(p) + delta).toFixed(2))),
  }))
  const getSplit = (p) => splits[p._id] ?? groupMembers
  const setSplit = (p, arr) => setSplits((prev) => ({ ...prev, [p._id]: arr }))

  const setFilter = (key, val) => setFilters((f) => ({ ...f, [key]: val }))

  const filtered = products.filter((p) => {
    const catName = (p.category?.name || '').toLowerCase()
    return (
      p.name.toLowerCase().includes(filters.name.toLowerCase()) &&
      (p.description || '').toLowerCase().includes(filters.description.toLowerCase()) &&
      catName.includes(filters.category.toLowerCase()) &&
      String(p.price).includes(filters.price) &&
      (p.unit || '').toLowerCase().includes(filters.unit.toLowerCase()) &&
      (p.manufacturer || '').toLowerCase().includes(filters.manufacturer.toLowerCase())
    )
  })

  const cartCount = (id) => items.find((i) => i._id === id)?.quantity ?? 0

  if (loading) return <Spinner className="py-12" />
  if (products.length === 0) return (
    <EmptyState icon={Tag} title="No products yet" description="Add your first product" />
  )

  // ── Mobile: expandable cards ───────────────────────────────────────────────
  const toggleExpand = (id) => setExpanded((e) => ({ ...e, [id]: !e[id] }))

  const UNITS = ['kg', 'g', 'L', 'mL', 'pcs', 'pack', 'dozen', 'box']
  const getUnit = (p) => mobileUnits[p._id] ?? p.unit
  const cycleUnit = (p, dir) => {
    const cur = getUnit(p)
    const idx = UNITS.indexOf(cur)
    const next = UNITS[(idx + dir + UNITS.length) % UNITS.length]
    setMobileUnits((prev) => ({ ...prev, [p._id]: next }))
  }

  return (
    <>
      {/* Mobile cards */}
      <div className="flex flex-col gap-2 md:hidden">
        {filtered.map((p) => {
          const isOpen = !!expanded[p._id]
          const iconBg = p.category?.color ? p.category.color : '#f4f4f5'
          const unit = getUnit(p)
          const price = getPrice(p)
          const split = getSplit(p)

          return (
            <div key={p._id} className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
              {/* collapsed row */}
              <div className="p-4 flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                  style={{ backgroundColor: p.category?.color ? `${p.category.color}22` : '#f4f4f5' }}
                >
                  {p.category?.icon || '📦'}
                </div>
                <div className="flex-1 min-w-0" onClick={() => toggleExpand(p._id)}>
                  <p className="text-sm font-semibold text-zinc-900 truncate">{p.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-sm font-medium text-zinc-700">$ {parseFloat(p.price).toFixed(2)}</span>
                    <span className="text-xs text-zinc-400">| {p.unit}</span>
                  </div>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => addItem({ ...p, price }, unit, 'equal', split, groupMembers)} className="p-2 rounded-xl text-zinc-400 active:bg-zinc-100 hover:text-zinc-700">
                    <ShoppingBasket size={15} />
                  </button>
                  <button onClick={() => onEdit(p)} className="p-2 rounded-xl text-zinc-400 active:bg-zinc-100 hover:text-zinc-700">
                    <Pencil size={15} />
                  </button>
                  <button onClick={() => { if (confirm(`Delete "${p.name}"?`)) onDelete(p._id) }} className="p-2 rounded-xl text-zinc-400 active:bg-zinc-100 hover:text-red-500">
                    <Trash2 size={15} />
                  </button>
                  <button onClick={() => toggleExpand(p._id)} className="p-2 rounded-xl text-zinc-400 active:bg-zinc-100">
                    <ChevronDown size={15} className={`transition-transform ${isOpen ? '' : '-rotate-90'}`} />
                  </button>
                </div>
              </div>

              {/* expanded detail */}
              {isOpen && (
                <div className="border-t border-zinc-100 divide-y divide-zinc-100">
                  {/* name */}
                  <div className="flex items-center px-4 py-2.5">
                    <span className="text-xs text-zinc-400 w-24 flex-shrink-0">name</span>
                    <span className="text-sm font-medium text-zinc-900">{p.name}</span>
                  </div>
                  {/* price */}
                  <div className="flex items-center px-4 py-2.5">
                    <span className="text-xs text-zinc-400 w-24 flex-shrink-0">price</span>
                    <div className="flex items-center gap-2 flex-1">
                      <button onClick={() => adjPrice(p, -0.05)} className="w-7 h-7 rounded-full bg-zinc-900 text-white flex items-center justify-center text-base font-bold leading-none flex-shrink-0">−</button>
                      <InlineNumber value={price} onCommit={(v) => setPrices((prev) => ({ ...prev, [p._id]: v }))} format={(v) => v.toFixed(2)} />
                      <button onClick={() => adjPrice(p, 0.05)} className="w-7 h-7 rounded-full bg-zinc-900 text-white flex items-center justify-center text-base font-bold leading-none flex-shrink-0">+</button>
                    </div>
                  </div>
                  {/* unit */}
                  <div className="flex items-center px-4 py-2.5">
                    <span className="text-xs text-zinc-400 w-24 flex-shrink-0">unit</span>
                    <div className="flex items-center gap-2 flex-1">
                      <button onClick={() => cycleUnit(p, -1)} className="w-7 h-7 rounded-full bg-zinc-900 text-white flex items-center justify-center text-base font-bold leading-none flex-shrink-0">−</button>
                      <span className="w-14 text-center text-xs font-semibold text-zinc-900">{unit}</span>
                      <button onClick={() => cycleUnit(p, 1)} className="w-7 h-7 rounded-full bg-zinc-900 text-white flex items-center justify-center text-base font-bold leading-none flex-shrink-0">+</button>
                    </div>
                  </div>
                  {/* splitAmong */}
                  <div className="flex items-center px-4 py-2.5">
                    <span className="text-xs text-zinc-400 w-24 flex-shrink-0">splitAmong</span>
                    <SplitDropdown members={groupMemberObjects} splitAmong={split} onChange={(arr) => setSplit(p, arr)} />
                  </div>
                  {/* description */}
                  <div className="flex items-center px-4 py-2.5">
                    <span className="text-xs text-zinc-400 w-24 flex-shrink-0">description</span>
                    <span className="text-sm text-zinc-700">{p.description || '—'}</span>
                  </div>
                  {/* category */}
                  <div className="flex items-center px-4 py-2.5">
                    <span className="text-xs text-zinc-400 w-24 flex-shrink-0">category</span>
                    <span className="text-sm text-zinc-900">{p.category?.name || '—'}</span>
                  </div>
                  {/* manufacturer */}
                  <div className="flex items-center px-4 py-2.5">
                    <span className="text-xs text-zinc-400 w-24 flex-shrink-0">manufacturer</span>
                    <span className="text-sm text-zinc-500">{p.manufacturer || '—'}</span>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto rounded-2xl border border-zinc-200 bg-white">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-zinc-200">
              {[
                { key: 'name', label: 'name' },
                { key: 'description', label: 'description' },
                { key: 'category', label: 'category' },
                { key: 'price', label: 'price' },
                { key: 'unit', label: 'unit' },
                { key: null, label: 'splitAmong' },
                { key: 'manufacturer', label: 'manufacturer' },
                { key: null, label: 'Action' },
              ].map(({ label }, i, arr) => (
                <th
                  key={label}
                  className={`px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wide whitespace-nowrap ${i < arr.length - 1 ? 'border-r border-zinc-200' : ''}`}
                >
                  {label}
                </th>
              ))}
            </tr>
            {/* Filter row */}
            <tr className="border-b border-zinc-200 bg-zinc-50">
              {['name', 'description', 'category', 'price', 'unit', null, 'manufacturer', null].map((key, i, arr) => (
                <td key={i} className={`px-3 py-2 ${i < arr.length - 1 ? 'border-r border-zinc-200' : ''}`}>
                  {key && (
                    <input
                      value={filters[key]}
                      onChange={(e) => setFilter(key, e.target.value)}
                      placeholder="Filter…"
                      className="w-full text-xs bg-white border border-zinc-200 rounded-lg px-2 py-1.5 outline-none focus:border-zinc-900 placeholder-zinc-400"
                    />
                  )}
                </td>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-sm text-zinc-400">No products match the filter</td>
              </tr>
            ) : filtered.map((p) => (
              <tr key={p._id} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50 transition-colors">
                {/* name */}
                <td className="px-4 py-3 border-r border-zinc-100 font-medium text-zinc-900 max-w-[140px] truncate">{p.name}</td>
                {/* description */}
                <td className="px-4 py-3 border-r border-zinc-100 text-zinc-500 max-w-[160px] truncate">{p.description || '—'}</td>
                {/* category */}
                <td className="px-4 py-3 border-r border-zinc-100">
                  {p.category ? (
                    <span className="flex items-center gap-1.5 whitespace-nowrap">
                      <span
                        className="w-6 h-6 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
                        style={{ backgroundColor: p.category.color ? `${p.category.color}22` : '#f4f4f5' }}
                      >
                        {p.category.icon}
                      </span>
                      <span className="text-zinc-700 text-xs">{p.category.name}</span>
                    </span>
                  ) : '—'}
                </td>
                {/* price with temp stepper + inline edit */}
                <td className="px-4 py-3 border-r border-zinc-100">
                  <div className="flex items-center gap-1.5 whitespace-nowrap">
                    <button
                      onClick={() => adjPrice(p, -0.05)}
                      className="w-6 h-6 rounded-full bg-zinc-900 text-white flex items-center justify-center text-sm font-bold leading-none"
                    >−</button>
                    <InlineNumber
                      value={getPrice(p)}
                      onCommit={(v) => setPrices((prev) => ({ ...prev, [p._id]: v }))}
                      format={(v) => v.toFixed(2)}
                    />
                    <button
                      onClick={() => adjPrice(p, 0.05)}
                      className="w-6 h-6 rounded-full bg-zinc-900 text-white flex items-center justify-center text-sm font-bold leading-none"
                    >+</button>
                  </div>
                </td>
                {/* unit — plain text */}
                <td className="px-4 py-3 border-r border-zinc-100 text-sm text-zinc-700">{p.unit}</td>
                {/* splitAmong */}
                <td className="px-4 py-3 border-r border-zinc-100">
                  <SplitDropdown
                    members={groupMemberObjects}
                    splitAmong={getSplit(p)}
                    onChange={(arr) => setSplit(p, arr)}
                  />
                </td>
                {/* manufacturer */}
                <td className="px-4 py-3 border-r border-zinc-100 text-zinc-500 max-w-[120px] truncate">{p.manufacturer || '—'}</td>
                {/* actions */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5 whitespace-nowrap">
                    <button
                      onClick={() => addItem({ ...p, price: getPrice(p) }, p.unit, 'equal', getSplit(p), groupMembers)}
                      className="p-1.5 rounded-lg bg-zinc-900 text-white active:bg-zinc-700"
                      title="Add to cart"
                    >
                      <ShoppingBasket size={14} />
                    </button>
                    <button
                      onClick={() => onEdit(p)}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 active:bg-zinc-100"
                      title="Edit"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => { if (confirm(`Delete "${p.name}"?`)) onDelete(p._id) }}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 active:bg-zinc-100"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

// ── Category tab ──────────────────────────────────────────────────────────────
function CategoryTab({ categories, products, loading, onEdit, onDelete }) {
  const [filters, setFilters] = useState({ name: '' })
  const [expanded, setExpanded] = useState({})
  const setFilter = (k, v) => setFilters((f) => ({ ...f, [k]: v }))
  const toggleExpand = (id) => setExpanded((e) => ({ ...e, [id]: !e[id] }))

  if (loading) return <Spinner className="py-12" />
  if (categories.length === 0) return (
    <EmptyState icon={Tag} title="No categories yet" description="Create a category to organise your products" />
  )

  const filtered = categories.filter((c) =>
    c.name.toLowerCase().includes(filters.name.toLowerCase())
  )

  return (
    <>
      {/* Mobile cards */}
      <div className="flex flex-col gap-2 md:hidden">
        {filtered.map((c) => {
          const isOpen = !!expanded[c._id]
          const productCount = products.filter((p) => p.category?._id === c._id || p.category === c._id).length
          return (
            <div key={c._id} className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
              {/* collapsed row */}
              <div className="p-4 flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                  style={{ backgroundColor: c.color }}
                >
                  {c.icon}
                </div>
                <div className="flex-1 min-w-0" onClick={() => toggleExpand(c._id)}>
                  <p className="text-sm font-semibold text-zinc-900">{c.name}</p>
                  <p className="text-xs text-zinc-400 mt-0.5">{productCount} products</p>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => onEdit(c)} className="p-2 rounded-xl text-zinc-400 active:bg-zinc-100 hover:text-zinc-700">
                    <Pencil size={15} />
                  </button>
                  <button onClick={() => { if (confirm(`Delete "${c.name}"?`)) onDelete(c._id) }} className="p-2 rounded-xl text-zinc-400 active:bg-zinc-100 hover:text-red-500">
                    <Trash2 size={15} />
                  </button>
                  <button onClick={() => toggleExpand(c._id)} className="p-2 rounded-xl text-zinc-400 active:bg-zinc-100">
                    <ChevronDown size={15} className={`transition-transform ${isOpen ? '' : '-rotate-90'}`} />
                  </button>
                </div>
              </div>
              {/* expanded detail */}
              {isOpen && (
                <div className="border-t border-zinc-100 divide-y divide-zinc-100">
                  <div className="flex items-center px-4 py-2.5">
                    <span className="text-xs text-zinc-400 w-24 flex-shrink-0">name</span>
                    <span className="text-sm font-medium text-zinc-900">{c.name}</span>
                  </div>
                  <div className="flex items-center px-4 py-2.5">
                    <span className="text-xs text-zinc-400 w-24 flex-shrink-0">description</span>
                    <span className="text-sm text-zinc-700">{c.description || '—'}</span>
                  </div>
                  <div className="flex items-center px-4 py-2.5">
                    <span className="text-xs text-zinc-400 w-24 flex-shrink-0">color</span>
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-md border border-zinc-200 flex-shrink-0" style={{ backgroundColor: c.color }} />
                      <span className="text-sm font-mono text-zinc-500">{c.color}</span>
                    </div>
                  </div>
                  <div className="flex items-center px-4 py-2.5">
                    <span className="text-xs text-zinc-400 w-24 flex-shrink-0">icon</span>
                    <span className="text-2xl">{c.icon}</span>
                  </div>
                  <div className="flex items-center px-4 py-2.5">
                    <span className="text-xs text-zinc-400 w-24 flex-shrink-0">products</span>
                    <span className="text-sm text-zinc-900">{productCount}</span>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto rounded-2xl border border-zinc-200 bg-white">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-zinc-200">
            {['Icon', 'Name', 'Products', 'Action'].map((h, i, arr) => (
              <th key={h} className={`px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wide whitespace-nowrap ${i < arr.length - 1 ? 'border-r border-zinc-200' : ''}`}>{h}</th>
            ))}
          </tr>
          <tr className="border-b border-zinc-200 bg-zinc-50">
            {[null, 'name', null, null].map((key, i, arr) => (
              <td key={i} className={`px-3 py-2 ${i < arr.length - 1 ? 'border-r border-zinc-200' : ''}`}>
                {key && (
                  <input value={filters[key] ?? ''} onChange={(e) => setFilter(key, e.target.value)} placeholder="Filter…"
                    className="w-full text-xs bg-white border border-zinc-200 rounded-lg px-2 py-1.5 outline-none focus:border-zinc-900 placeholder-zinc-400" />
                )}
              </td>
            ))}
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0 ? (
            <tr><td colSpan={4} className="px-4 py-8 text-center text-sm text-zinc-400">No categories match the filter</td></tr>
          ) : filtered.map((c) => {
            const productCount = products.filter((p) => p.category?._id === c._id || p.category === c._id).length
            return (
              <tr key={c._id} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50 transition-colors">
                <td className="px-4 py-3 border-r border-zinc-100">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xl" style={{ backgroundColor: c.color }}>
                    {c.icon}
                  </div>
                </td>
                <td className="px-4 py-3 border-r border-zinc-100 font-semibold text-zinc-900">{c.name}</td>
                <td className="px-4 py-3 border-r border-zinc-100 text-zinc-700">{productCount}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => onEdit(c)} className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 active:bg-zinc-100" title="Edit">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => { if (confirm(`Delete "${c.name}"?`)) onDelete(c._id) }} className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 active:bg-zinc-100" title="Delete">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
    </>
  )
}

// ── WishlistMobileCard ────────────────────────────────────────────────────────
function WishlistMobileCard({ w, onAddToCart, onEdit, onDelete, memberName }) {
  const [isOpen, setIsOpen] = useState(false)
  const [itemsOpen, setItemsOpen] = useState(false)
  return (
    <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
      {/* collapsed row */}
      <div className="p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-zinc-900 flex items-center justify-center flex-shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-white">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25Z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0" onClick={() => setIsOpen((o) => !o)}>
          <p className="text-sm font-semibold text-zinc-900 truncate">{w.name}</p>
          <p className="text-xs text-zinc-400 mt-0.5">$ {w.totalPrice} &nbsp;|&nbsp; {w.date ? new Date(w.date).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }) : '—'}</p>
        </div>
        <div className="flex gap-1 flex-shrink-0">
          <button onClick={() => onAddToCart(w)} className="p-2 rounded-xl text-zinc-400 active:bg-zinc-100 hover:text-zinc-700">
            <ShoppingBasket size={15} />
          </button>
          <button onClick={() => onEdit(w._id)} className="p-2 rounded-xl text-zinc-400 active:bg-zinc-100 hover:text-zinc-700">
            <Pencil size={15} />
          </button>
          <button onClick={() => { if (confirm(`Delete "${w.name}"?`)) onDelete(w._id) }} className="p-2 rounded-xl text-zinc-400 active:bg-zinc-100 hover:text-red-500">
            <Trash2 size={15} />
          </button>
          <button onClick={() => setIsOpen((o) => !o)} className="p-2 rounded-xl text-zinc-400 active:bg-zinc-100">
            <ChevronDown size={15} className={`transition-transform ${isOpen ? '' : '-rotate-90'}`} />
          </button>
        </div>
      </div>
      {/* expanded detail */}
      {isOpen && (
        <div className="border-t border-zinc-100 divide-y divide-zinc-100">
          <div className="flex items-center px-4 py-2.5">
            <span className="text-xs text-zinc-400 w-24 flex-shrink-0">name</span>
            <span className="text-sm font-medium text-zinc-900">{w.name}</span>
          </div>
          <div className="flex items-center px-4 py-2.5">
            <span className="text-xs text-zinc-400 w-24 flex-shrink-0">totalPrice</span>
            <span className="text-sm font-semibold text-zinc-900">$ {w.totalPrice}</span>
          </div>
          {/* items accordion */}
          <div className="px-4 py-2.5">
            <button onClick={() => setItemsOpen((o) => !o)} className="w-full flex items-center justify-between">
              <span className="text-xs text-zinc-400">items</span>
              <ChevronDown size={14} className={`text-zinc-400 transition-transform ${itemsOpen ? '' : '-rotate-90'}`} />
            </button>
            {itemsOpen && (
              <div className="mt-2 rounded-xl border border-zinc-100 overflow-hidden">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-100 bg-zinc-50">
                      {['Product', 'Price', 'Unit', 'Count', 'Split'].map((h, i, arr) => (
                        <th key={h} className={`px-2 py-1.5 text-left font-semibold text-zinc-500 ${i < arr.length - 1 ? 'border-r border-zinc-100' : ''}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(w.items || []).map((item, idx, arr) => (
                      <tr key={idx} className={idx < arr.length - 1 ? 'border-b border-zinc-100' : ''}>
                        <td className="px-2 py-1.5 border-r border-zinc-100 text-zinc-800 font-medium">{item.product?.name || '—'}</td>
                        <td className="px-2 py-1.5 border-r border-zinc-100 text-zinc-600">{item.price}</td>
                        <td className="px-2 py-1.5 border-r border-zinc-100 text-zinc-600">{item.unit}</td>
                        <td className="px-2 py-1.5 border-r border-zinc-100 text-zinc-600">{item.count}</td>
                        <td className="px-2 py-1.5 text-zinc-600">
                          {(item.splitAmong || []).map((u) => {
                            const id = typeof u === 'object' ? u._id : u
                            return u?.name || u?.email || memberName(id)
                          }).join(', ')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <div className="flex items-center px-4 py-2.5">
            <span className="text-xs text-zinc-400 w-24 flex-shrink-0">date</span>
            <span className="text-sm text-zinc-900">{w.date}</span>
          </div>
          <div className="flex items-center px-4 py-2.5">
            <span className="text-xs text-zinc-400 w-24 flex-shrink-0">paidBy</span>
            <span className="text-sm text-zinc-900">{w.paidBy?.name || w.paidBy?.email || '—'}</span>
          </div>
          <div className="flex items-center px-4 py-2.5">
            <span className="text-xs text-zinc-400 w-24 flex-shrink-0">createdBy</span>
            <span className="text-sm text-zinc-900">{w.createdBy?.name || w.createdBy?.email || '—'}</span>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Wish List tab ─────────────────────────────────────────────────────────────
function WishlistTab({ wishlists, groupMembers, groupMemberObjects = [], onDelete }) {
  const { openEdit } = useWishlistStore()
  const { addItem } = useCartStore()

  const memberName = (id) => {
    const m = groupMemberObjects.find((m) => String(m._id) === String(id))
    return m?.name || m?.email || id
  }
  const [expanded, setExpanded] = useState({})
  const [filters, setFilters] = useState({ name: '', totalPrice: '', date: '', paidBy: '', createdBy: '' })
  const setFilter = (k, v) => setFilters((f) => ({ ...f, [k]: v }))
  const toggle = (id) => setExpanded((e) => ({ ...e, [id]: !e[id] }))

  if (!wishlists.length) return (
    <EmptyState icon={Heart} title="Wishlist is empty" description="Save items you want to buy later" />
  )

  const filtered = wishlists.filter((w) =>
    w.name.toLowerCase().includes(filters.name.toLowerCase()) &&
    String(w.totalPrice || '').includes(filters.totalPrice) &&
    (w.date || '').includes(filters.date) &&
    (w.paidBy?.name || w.paidBy?.email || '').toLowerCase().includes(filters.paidBy.toLowerCase()) &&
    (w.createdBy?.name || w.createdBy?.email || '').toLowerCase().includes(filters.createdBy.toLowerCase())
  )

  const addAllToCart = (entry) => {
    entry.items.forEach((item) => {
      const product = item.product && typeof item.product === 'object' ? item.product : { _id: item.product }
      const price = parseFloat(item._price ?? item.price)
      const qty = parseInt(item.quantity ?? item.count, 10) || 1
      const splitAmong = (item._splitAmong || item.splitAmong || []).map((u) =>
        typeof u === 'object' ? String(u._id) : String(u)
      )
      addItem({ ...product, price }, item.unit, item._splitType || item.splitType || 'equal', splitAmong, groupMembers, qty)
    })
  }

  return (
    <>
      {/* Mobile cards */}
      <div className="flex flex-col gap-2 md:hidden">
        {filtered.map((w) => (
          <WishlistMobileCard
            key={w._id}
            w={w}
            onAddToCart={addAllToCart}
            onEdit={openEdit}
            onDelete={onDelete}
            memberName={memberName}
          />
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto rounded-2xl border border-zinc-200 bg-white">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-zinc-200">
              <th className="w-8 px-3 py-3 border-r border-zinc-200" />
              {['name', 'items', 'totalPrice', 'date', 'paidBy', 'createdBy', 'Action'].map((h, i, arr) => (
                <th key={h} className={`px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wide whitespace-nowrap ${i < arr.length - 1 ? 'border-r border-zinc-200' : ''}`}>{h}</th>
              ))}
            </tr>
            <tr className="border-b border-zinc-200 bg-zinc-50">
              <td className="border-r border-zinc-200" />
              {['name', 'items', 'totalPrice', 'date', 'paidBy', 'createdBy', null].map((key, i, arr) => (
                <td key={i} className={`px-3 py-2 ${i < arr.length - 1 ? 'border-r border-zinc-200' : ''}`}>
                  {key && key !== 'items' && (
                    <input value={filters[key] ?? ''} onChange={(e) => setFilter(key, e.target.value)} placeholder="Filter…"
                      className="w-full text-xs bg-white border border-zinc-200 rounded-lg px-2 py-1.5 outline-none focus:border-zinc-900 placeholder-zinc-400" />
                  )}
                </td>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-sm text-zinc-400">No wishlists match the filter</td></tr>
            ) : filtered.map((w) => (
              <React.Fragment key={w._id}>
                <tr className="border-b border-zinc-100 hover:bg-zinc-50 transition-colors cursor-pointer" onClick={() => toggle(w._id)}>
                  <td className="px-3 py-3 border-r border-zinc-100 text-zinc-400">
                    <ChevronDown size={14} className={`transition-transform ${expanded[w._id] ? '' : '-rotate-90'}`} />
                  </td>
                  <td className="px-4 py-3 border-r border-zinc-100 font-medium text-zinc-900">{w.name}</td>
                  <td className="px-4 py-3 border-r border-zinc-100 text-zinc-700">{w.items?.length ?? 0}</td>
                  <td className="px-4 py-3 border-r border-zinc-100 font-semibold text-zinc-900">{w.totalPrice}</td>
                  <td className="px-4 py-3 border-r border-zinc-100 text-zinc-500">{w.date}</td>
                  <td className="px-4 py-3 border-r border-zinc-100 text-zinc-700">{w.paidBy?.name || w.paidBy?.email || '—'}</td>
                  <td className="px-4 py-3 border-r border-zinc-100 text-zinc-700">{w.createdBy?.name || w.createdBy?.email || '—'}</td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => addAllToCart(w)} className="p-1.5 rounded-lg bg-zinc-900 text-white active:bg-zinc-700" title="Add to cart">
                        <ShoppingBasket size={14} />
                      </button>
                      <button onClick={() => openEdit(w._id)} className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 active:bg-zinc-100" title="Edit">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => { if (confirm(`Delete "${w.name}"?`)) onDelete(w._id) }} className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 active:bg-zinc-100" title="Delete">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
                {expanded[w._id] && (
                  <tr key={`${w._id}-items`} className="border-b border-zinc-100 bg-zinc-50">
                    <td />
                    <td colSpan={7} className="px-4 py-3">
                      <table className="w-full text-xs border-collapse rounded-xl overflow-hidden border border-zinc-200">
                        <thead>
                          <tr className="border-b border-zinc-200">
                            {['product', 'price', 'count', 'unit', 'splitAmong'].map((h, i, arr) => (
                              <th key={h} className={`px-3 py-2 text-left text-xs font-semibold text-zinc-500 ${i < arr.length - 1 ? 'border-r border-zinc-200' : ''}`}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {(w.items || []).map((item, idx, arr) => (
                            <tr key={idx} className={idx < arr.length - 1 ? 'border-b border-zinc-100' : ''}>
                              <td className="px-3 py-2 border-r border-zinc-100 font-medium text-zinc-800">{item.product?.name || '—'}</td>
                              <td className="px-3 py-2 border-r border-zinc-100 text-zinc-600">{item.price}</td>
                              <td className="px-3 py-2 border-r border-zinc-100 text-zinc-600">{item.count}</td>
                              <td className="px-3 py-2 border-r border-zinc-100 text-zinc-600">{item.unit}</td>
                              <td className="px-3 py-2 text-zinc-600">
                                {(item.splitAmong || []).map((u) => {
                                  const id = typeof u === 'object' ? u._id : u
                                  return u?.name || u?.email || memberName(id)
                                }).join(', ')}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

// ── OrderMobileCard ───────────────────────────────────────────────────────────
function OrderMobileCard({ o, onDelete }) {
  const [isOpen, setIsOpen] = useState(false)
  const [itemsOpen, setItemsOpen] = useState(false)
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }) : '—'
  return (
    <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
      {/* collapsed row */}
      <div className="p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-zinc-900 flex items-center justify-center flex-shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-white">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.35 3.836c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m8.9-4.414c.376.023.75.05 1.124.08 1.131.094 1.976 1.057 1.976 2.192V16.5A2.25 2.25 0 0 1 18 18.75h-2.25m-7.5-10.5H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V18.75m-7.5-10.5h6.375c.621 0 1.125.504 1.125 1.125v9.375m-8.25-3 1.5 1.5 3-3.75" />
          </svg>
        </div>
        <div className="flex-1 min-w-0" onClick={() => setIsOpen((v) => !v)}>
          <p className="text-sm font-semibold text-zinc-900 truncate">{o.name}</p>
          <p className="text-xs text-zinc-400 mt-0.5">$ {o.totalPrice} &nbsp;|&nbsp; {fmtDate(o.date)}</p>
        </div>
        <div className="flex gap-1 flex-shrink-0">
          <button onClick={() => { if (confirm(`Delete "${o.name}"?`)) onDelete(o._id) }} className="p-2 rounded-xl text-zinc-400 active:bg-zinc-100 hover:text-red-500">
            <Trash2 size={15} />
          </button>
          <button onClick={() => setIsOpen((v) => !v)} className="p-2 rounded-xl text-zinc-400 active:bg-zinc-100">
            <ChevronDown size={15} className={`transition-transform ${isOpen ? '' : '-rotate-90'}`} />
          </button>
        </div>
      </div>
      {/* expanded detail */}
      {isOpen && (
        <div className="border-t border-zinc-100 divide-y divide-zinc-100">
          <div className="flex items-center px-4 py-2.5">
            <span className="text-xs text-zinc-400 w-24 flex-shrink-0">name</span>
            <span className="text-sm font-medium text-zinc-900">{o.name}</span>
          </div>
          <div className="flex items-center px-4 py-2.5">
            <span className="text-xs text-zinc-400 w-24 flex-shrink-0">totalPrice</span>
            <span className="text-sm font-semibold text-zinc-900">$ {o.totalPrice}</span>
          </div>
          {/* items accordion */}
          <div className="px-4 py-2.5">
            <button onClick={() => setItemsOpen((v) => !v)} className="w-full flex items-center justify-between">
              <span className="text-xs text-zinc-400">items</span>
              <ChevronDown size={14} className={`text-zinc-400 transition-transform ${itemsOpen ? '' : '-rotate-90'}`} />
            </button>
            {itemsOpen && (
              <div className="mt-2 rounded-xl border border-zinc-100 overflow-hidden">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-100 bg-zinc-50">
                      {['Product', 'Price', 'Unit', 'Count', 'Split'].map((h, i, arr) => (
                        <th key={h} className={`px-2 py-1.5 text-left font-semibold text-zinc-500 ${i < arr.length - 1 ? 'border-r border-zinc-100' : ''}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(o.items || []).map((item, idx, arr) => (
                      <tr key={idx} className={idx < arr.length - 1 ? 'border-b border-zinc-100' : ''}>
                        <td className="px-2 py-1.5 border-r border-zinc-100 text-zinc-800 font-medium">{item.product?.name || '—'}</td>
                        <td className="px-2 py-1.5 border-r border-zinc-100 text-zinc-600">{item.price}</td>
                        <td className="px-2 py-1.5 border-r border-zinc-100 text-zinc-600">{item.unit}</td>
                        <td className="px-2 py-1.5 border-r border-zinc-100 text-zinc-600">{item.count}</td>
                        <td className="px-2 py-1.5 text-zinc-600">{(item.splitAmong || []).map((u) => u?.name || u?.email || String(u)).join(', ')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <div className="flex items-center px-4 py-2.5">
            <span className="text-xs text-zinc-400 w-24 flex-shrink-0">date</span>
            <span className="text-sm text-zinc-900">{o.date}</span>
          </div>
          <div className="flex items-center px-4 py-2.5">
            <span className="text-xs text-zinc-400 w-24 flex-shrink-0">paidBy</span>
            <span className="text-sm text-zinc-900">{o.paidBy?.name || o.paidBy?.email || '—'}</span>
          </div>
          <div className="flex items-center px-4 py-2.5">
            <span className="text-xs text-zinc-400 w-24 flex-shrink-0">createdBy</span>
            <span className="text-sm text-zinc-900">{o.createdBy?.name || o.createdBy?.email || '—'}</span>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Orders tab ────────────────────────────────────────────────────────────────
function OrdersTab({ orders = [], loading, onDelete }) {
  const [expanded, setExpanded] = useState({})
  const [filters, setFilters] = useState({ name: '', totalPrice: '', date: '', paidBy: '', createdBy: '' })
  const setFilter = (k, v) => setFilters((f) => ({ ...f, [k]: v }))
  const toggle = (id) => setExpanded((e) => ({ ...e, [id]: !e[id] }))

  if (loading) return <Spinner className="py-12" />
  if (!orders.length) return (
    <EmptyState icon={ShoppingCart} title="No orders yet" description="Your shopping trips will appear here" />
  )

  const filtered = orders.filter((o) => {
    const paidName = (o.paidBy?.name || o.paidBy?.email || '').toLowerCase()
    const createdName = (o.createdBy?.name || o.createdBy?.email || '').toLowerCase()
    return (
      o.name.toLowerCase().includes(filters.name.toLowerCase()) &&
      String(o.totalPrice).includes(filters.totalPrice) &&
      (o.date || '').includes(filters.date) &&
      paidName.includes(filters.paidBy.toLowerCase()) &&
      createdName.includes(filters.createdBy.toLowerCase())
    )
  })

  const COLS = [
    { key: 'name',       label: 'name' },
    { key: 'items',      label: 'items' },
    { key: 'totalPrice', label: 'totalPrice' },
    { key: 'date',       label: 'date' },
    { key: 'paidBy',     label: 'paidBy' },
    { key: 'createdBy',  label: 'createdBy' },
  ]

  return (
    <>
      {/* Mobile cards */}
      <div className="flex flex-col gap-2 md:hidden">
        {filtered.map((o) => (
          <OrderMobileCard key={o._id} o={o} onDelete={onDelete} />
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto rounded-2xl border border-zinc-200 bg-white">
        <table className="w-full text-sm border-collapse">
          <thead>
            {/* Header */}
            <tr className="border-b border-zinc-200">
              <th className="w-8 px-3 py-3 border-r border-zinc-200" />
              {COLS.map((c, i) => (
                <th key={c.key} className={`px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wide whitespace-nowrap ${i < COLS.length - 1 ? 'border-r border-zinc-200' : ''}`}>
                  {c.label}
                </th>
              ))}
              <th className="px-4 py-3" />
            </tr>
            {/* Filter row */}
            <tr className="border-b border-zinc-200 bg-zinc-50">
              <td className="border-r border-zinc-200" />
              {['name', 'items', 'totalPrice', 'date', 'paidBy', 'createdBy'].map((key, i, arr) => (
                <td key={key} className={`px-3 py-2 ${i < arr.length - 1 ? 'border-r border-zinc-200' : ''}`}>
                  {key !== 'items' && (
                    <input
                      value={filters[key] ?? ''}
                      onChange={(e) => setFilter(key, e.target.value)}
                      placeholder="Filter…"
                      className="w-full text-xs bg-white border border-zinc-200 rounded-lg px-2 py-1.5 outline-none focus:border-zinc-900 placeholder-zinc-400"
                    />
                  )}
                </td>
              ))}
              <td />
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-sm text-zinc-400">No orders match the filter</td></tr>
            ) : filtered.map((o) => (
              <React.Fragment key={o._id}>
                <tr
                  className="border-b border-zinc-100 hover:bg-zinc-50 transition-colors cursor-pointer"
                  onClick={() => toggle(o._id)}
                >
                  <td className="px-3 py-3 border-r border-zinc-100 text-zinc-400">
                    <ChevronDown size={14} className={`transition-transform ${expanded[o._id] ? '' : '-rotate-90'}`} />
                  </td>
                  <td className="px-4 py-3 border-r border-zinc-100 font-medium text-zinc-900">{o.name}</td>
                  <td className="px-4 py-3 border-r border-zinc-100 text-zinc-700">{o.items?.length ?? 0}</td>
                  <td className="px-4 py-3 border-r border-zinc-100 font-semibold text-zinc-900">{o.totalPrice}</td>
                  <td className="px-4 py-3 border-r border-zinc-100 text-zinc-500">{o.date}</td>
                  <td className="px-4 py-3 border-r border-zinc-100 text-zinc-700">{o.paidBy?.name || o.paidBy?.email || '—'}</td>
                  <td className="px-4 py-3 text-zinc-700">{o.createdBy?.name || o.createdBy?.email || '—'}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={(e) => { e.stopPropagation(); if (confirm(`Delete "${o.name}"?`)) onDelete(o._id) }}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 active:bg-zinc-100"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
                {expanded[o._id] && (
                  <tr key={`${o._id}-items`} className="border-b border-zinc-100 bg-zinc-50">
                    <td />
                    <td colSpan={7} className="px-4 py-3">
                      <table className="w-full text-xs border-collapse rounded-xl overflow-hidden border border-zinc-200">
                        <thead>
                          <tr className="border-b border-zinc-200">
                            {['product', 'price', 'count', 'unit', 'splitAmong'].map((h, i, arr) => (
                              <th key={h} className={`px-3 py-2 text-left text-xs font-semibold text-zinc-500 ${i < arr.length - 1 ? 'border-r border-zinc-200' : ''}`}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {(o.items || []).map((item, idx, arr) => (
                            <tr key={idx} className={idx < arr.length - 1 ? 'border-b border-zinc-100' : ''}>
                              <td className="px-3 py-2 border-r border-zinc-100 font-medium text-zinc-800">{item.product?.name || '—'}</td>
                              <td className="px-3 py-2 border-r border-zinc-100 text-zinc-600">{item.price}</td>
                              <td className="px-3 py-2 border-r border-zinc-100 text-zinc-600">{item.count}</td>
                              <td className="px-3 py-2 border-r border-zinc-100 text-zinc-600">{item.unit}</td>
                              <td className="px-3 py-2 text-zinc-600">{(item.splitAmong || []).map((u) => u?.name || u?.email || String(u)).join(', ')}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

// ── InventoryMobileCard ───────────────────────────────────────────────────────
function InventoryMobileCard({ inv, p, iconBg, splitIds, memberName, onAddToCart, onDelete }) {
  const [isOpen, setIsOpen] = useState(false)
  return (
    <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
      {/* collapsed row */}
      <div className="p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 relative" style={{ backgroundColor: iconBg }}>
          {p.category?.icon || '📦'}
          <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-zinc-900 text-white text-[10px] font-bold flex items-center justify-center">
            {inv.quantityAvailable}
          </span>
        </div>
        <div className="flex-1 min-w-0" onClick={() => setIsOpen((o) => !o)}>
          <p className="text-sm font-semibold text-zinc-900 truncate">{p.name || '—'}</p>
          <p className="text-xs text-zinc-400 mt-0.5">$ {inv.price} &nbsp;|&nbsp; {p.unit || '—'}</p>
        </div>
        <div className="flex gap-1 flex-shrink-0">
          <button onClick={onAddToCart} className="p-2 rounded-xl text-zinc-400 active:bg-zinc-100 hover:text-zinc-700">
            <ShoppingBasket size={15} />
          </button>
          <button onClick={onDelete} className="p-2 rounded-xl text-zinc-400 active:bg-zinc-100 hover:text-red-500">
            <Trash2 size={15} />
          </button>
          <button onClick={() => setIsOpen((o) => !o)} className="p-2 rounded-xl text-zinc-400 active:bg-zinc-100">
            <ChevronDown size={15} className={`transition-transform ${isOpen ? '' : '-rotate-90'}`} />
          </button>
        </div>
      </div>
      {/* expanded detail */}
      {isOpen && (
        <div className="border-t border-zinc-100 divide-y divide-zinc-100">
          <div className="flex items-center px-4 py-2.5">
            <span className="text-xs text-zinc-400 w-28 flex-shrink-0">name</span>
            <span className="text-sm font-medium text-zinc-900">{p.name || '—'}</span>
          </div>
          <div className="flex items-center px-4 py-2.5">
            <span className="text-xs text-zinc-400 w-28 flex-shrink-0">quantity</span>
            <span className="text-sm font-semibold text-zinc-900">{inv.quantityAvailable}</span>
          </div>
          <div className="flex items-center px-4 py-2.5">
            <span className="text-xs text-zinc-400 w-28 flex-shrink-0">price</span>
            <span className="text-sm text-zinc-900">$ {inv.price}</span>
          </div>
          <div className="flex items-center px-4 py-2.5">
            <span className="text-xs text-zinc-400 w-28 flex-shrink-0">unit</span>
            <span className="text-sm text-zinc-900">{p.unit || '—'}</span>
          </div>
          <div className="flex items-center px-4 py-2.5">
            <span className="text-xs text-zinc-400 w-28 flex-shrink-0">category</span>
            {p.category ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium" style={{ backgroundColor: iconBg }}>
                {p.category.icon} {p.category.name}
              </span>
            ) : <span className="text-sm text-zinc-400">—</span>}
          </div>
          <div className="flex items-start px-4 py-2.5">
            <span className="text-xs text-zinc-400 w-28 flex-shrink-0 mt-0.5">splitAmong</span>
            <div className="flex flex-wrap gap-1">
              {(inv.splitAmong || []).map((u) => {
                const id = typeof u === 'object' ? u._id : u
                const name = u?.name || u?.email || memberName(id)
                return <span key={id} className="px-2 py-0.5 rounded-lg bg-zinc-900 text-white text-xs font-semibold">{name}</span>
              })}
            </div>
          </div>
          <div className="flex items-center px-4 py-2.5">
            <span className="text-xs text-zinc-400 w-28 flex-shrink-0">description</span>
            <span className="text-sm text-zinc-500">{p.description || '—'}</span>
          </div>
          <div className="flex items-center px-4 py-2.5">
            <span className="text-xs text-zinc-400 w-28 flex-shrink-0">manufacturer</span>
            <span className="text-sm text-zinc-500">{p.manufacturer || '—'}</span>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Inventory tab ─────────────────────────────────────────────────────────────
function InventoryTab({ inventory = [], loading, groupMemberObjects = [], onDelete }) {
  const { addItem } = useCartStore()
  const [filters, setFilters] = useState({ name: '', price: '', unit: '' })
  const setFilter = (k, v) => setFilters((f) => ({ ...f, [k]: v }))

  const memberName = (id) => {
    const m = groupMemberObjects.find((m) => String(m._id) === String(id))
    return m?.name || m?.email || String(id)
  }

  if (loading) return <div className="flex justify-center py-16"><Spinner /></div>
  if (!inventory.length) return (
    <EmptyState icon={Package} title="Nothing in stock" description="Items with 'Track In Inventory' will appear here after ordering" />
  )

  const filtered = inventory.filter((inv) => {
    const name = inv.product?.name || ''
    const unit = inv.product?.unit || ''
    return (
      name.toLowerCase().includes(filters.name.toLowerCase()) &&
      String(inv.price || '').includes(filters.price) &&
      unit.toLowerCase().includes(filters.unit.toLowerCase())
    )
  })

  const COLS = ['qty', 'name', 'description', 'category', 'price', 'unit', 'splitAmong', 'manufacturer', 'Action']
  const FILTER_KEYS = [null, 'name', null, null, 'price', 'unit', null, null, null]

  return (
    <>
      {/* Mobile cards */}
      <div className="flex flex-col gap-2 md:hidden">
        {filtered.map((inv) => {
          const p = inv.product || {}
          const catColor = p.category?.color
          const iconBg = catColor && catColor.startsWith('#') ? `${catColor}22` : '#f4f4f5'
          const splitIds = (inv.splitAmong || []).map((u) => typeof u === 'object' ? String(u._id) : String(u))
          return (
            <InventoryMobileCard
              key={inv._id}
              inv={inv}
              p={p}
              iconBg={iconBg}
              splitIds={splitIds}
              memberName={memberName}
              onAddToCart={() => addItem({ ...p, price: inv.price }, p.unit, 'equal', splitIds, splitIds)}
              onDelete={() => { if (confirm('Delete this inventory entry?')) onDelete(inv._id) }}
            />
          )
        })}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto rounded-2xl border border-zinc-200 bg-white">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-zinc-200">
            {COLS.map((h, i, arr) => (
              <th key={h} className={`px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wide whitespace-nowrap ${i < arr.length - 1 ? 'border-r border-zinc-200' : ''}`}>{h}</th>
            ))}
          </tr>
          <tr className="border-b border-zinc-200 bg-zinc-50">
            {FILTER_KEYS.map((key, i, arr) => (
              <td key={i} className={`px-3 py-2 ${i < arr.length - 1 ? 'border-r border-zinc-200' : ''}`}>
                {key && (
                  <input value={filters[key] ?? ''} onChange={(e) => setFilter(key, e.target.value)} placeholder="Filter…"
                    className="w-full text-xs bg-white border border-zinc-200 rounded-lg px-2 py-1.5 outline-none focus:border-zinc-900 placeholder-zinc-400" />
                )}
              </td>
            ))}
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0 ? (
            <tr><td colSpan={9} className="px-4 py-8 text-center text-sm text-zinc-400">No inventory items match the filter</td></tr>
          ) : filtered.map((inv) => {
            const p = inv.product || {}
            const catColor = p.category?.color
            const iconBg = catColor && catColor.startsWith('#') ? `${catColor}22` : '#f4f4f5'
            return (
              <tr key={inv._id} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50 transition-colors">
                <td className="px-4 py-3 border-r border-zinc-100">
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-zinc-900 text-white text-xs font-bold">{inv.quantityAvailable}</span>
                </td>
                <td className="px-4 py-3 border-r border-zinc-100 font-medium text-zinc-900">{p.name || '—'}</td>
                <td className="px-4 py-3 border-r border-zinc-100 text-zinc-500 text-xs max-w-[120px] truncate">{p.description || '—'}</td>
                <td className="px-4 py-3 border-r border-zinc-100">
                  {p.category ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium" style={{ backgroundColor: iconBg }}>
                      {p.category.icon} {p.category.name}
                    </span>
                  ) : <span className="text-zinc-400">—</span>}
                </td>
                <td className="px-4 py-3 border-r border-zinc-100 font-semibold text-zinc-900">{inv.price}</td>
                <td className="px-4 py-3 border-r border-zinc-100 text-zinc-700">{p.unit || '—'}</td>
                <td className="px-4 py-3 border-r border-zinc-100">
                  <div className="flex flex-wrap gap-1">
                    {(inv.splitAmong || []).map((u) => {
                      const id = typeof u === 'object' ? u._id : u
                      const name = u?.name || u?.email || memberName(id)
                      return (
                        <span key={id} className="inline-block px-2 py-0.5 rounded-lg bg-zinc-900 text-white text-xs font-semibold">{name}</span>
                      )
                    })}
                  </div>
                </td>
                <td className="px-4 py-3 border-r border-zinc-100 text-zinc-500 text-xs">{p.manufacturer || '—'}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => addItem({ ...p, price: inv.price }, p.unit, 'equal',
                        (inv.splitAmong || []).map((u) => typeof u === 'object' ? String(u._id) : String(u)),
                        (inv.splitAmong || []).map((u) => typeof u === 'object' ? String(u._id) : String(u))
                      )}
                      className="p-1.5 rounded-lg bg-zinc-900 text-white active:bg-zinc-700" title="Add to cart"
                    >
                      <ShoppingBasket size={14} />
                    </button>
                    <button
                      onClick={() => { if (confirm(`Delete this inventory entry?`)) onDelete(inv._id) }}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 active:bg-zinc-100" title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      </div>
    </>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
const TABS = [
  { key: 'products',   label: 'Products List' },
  { key: 'category',   label: 'Category'      },
  { key: 'wishlist',   label: 'Wish List'     },
  { key: 'inventory',  label: 'Inventory'     },
  { key: 'orders',     label: 'Orders'        },
]

export default function Products() {
  const { data: products = [], isLoading: loadingProducts } = useProducts()
  const { data: categories = [], isLoading: loadingCats } = useCategories()
  const { data: orders = [], isLoading: loadingOrders } = useOrders()
  const { mutate: deleteProduct } = useDeleteProduct()
  const { mutate: deleteCategory } = useDeleteCategory()
  const { mutate: deleteOrder } = useDeleteOrder()
  const { mutate: deleteWishlist } = useDeleteWishlist()
  const activeGroupId = useGroupStore((s) => s.activeGroupId)
  const { data: group } = useGroup(activeGroupId)
  const groupMembers = (group?.members || []).map((m) => String(m._id || m))
  const groupMemberObjects = (group?.members || []).filter((m) => m._id)
  const { data: wishlists = [], isLoading: loadingWishlists } = useWishlists()
  const { data: inventory = [], isLoading: loadingInventory } = useInventory()
  const { mutate: deleteInventoryItem } = useDeleteInventory()

  const [tab, setTab] = useState('products')
  const [productSheet, setProductSheet] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [categorySheet, setCategorySheet] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)

  const openAddProduct   = useCallback(() => { setEditingProduct(null);  setProductSheet(true) }, [])
  const openEditProduct  = (p) => { setEditingProduct(p);    setProductSheet(true) }
  const openAddCategory  = useCallback(() => { setEditingCategory(null);  setCategorySheet(true) }, [])
  const openEditCategory = (c) => { setEditingCategory(c);    setCategorySheet(true) }

  const addBtn = tab === 'products'
    ? <Button size="sm" onClick={openAddProduct}><Plus size={16} /> Add product</Button>
    : tab === 'category'
    ? <Button size="sm" onClick={openAddCategory}><Plus size={16} /> Add category</Button>
    : null

  const mobileAddFn = tab === 'products' ? openAddProduct : tab === 'category' ? openAddCategory : null

  return (
    <>
      <TopBar title="Products" right={
        mobileAddFn && (
          <button onClick={mobileAddFn} className="p-2 rounded-xl active:bg-zinc-100">
            <Plus size={20} />
          </button>
        )
      } />

      <div className="px-4 py-5 md:px-0 md:py-0">
        <PageHeader title="Products" subtitle="Your catalogue" />

        {/* Tab bar row — tabs left, GROUP + ADD + CART right */}
        <div className="flex items-end justify-between border-b border-zinc-200 mb-5">
          <div className="flex flex-wrap gap-x-6">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={[
                  'pb-3 text-sm font-medium transition-colors whitespace-nowrap',
                  tab === t.key
                    ? 'text-zinc-900 border-b-2 border-zinc-900 -mb-px'
                    : 'text-zinc-400 hover:text-zinc-600',
                ].join(' ')}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="pb-3">
            <PageActions add={addBtn} />
          </div>
        </div>

        {tab === 'products' && (
          <ProductsListTab
            products={products}
            categories={categories}
            loading={loadingProducts}
            onEdit={openEditProduct}
            onDelete={(id) => deleteProduct(id)}
            groupMembers={groupMembers}
            groupMemberObjects={groupMemberObjects}
          />
        )}

        {tab === 'category' && (
          <CategoryTab
            categories={categories}
            products={products}
            loading={loadingCats}
            onEdit={openEditCategory}
            onDelete={(id) => deleteCategory(id)}
          />
        )}

        {tab === 'wishlist' && (
          <WishlistTab
            wishlists={wishlists}
            groupMembers={groupMembers}
            groupMemberObjects={groupMemberObjects}
            onDelete={(id) => deleteWishlist(id)}
          />
        )}

        {tab === 'inventory' && (
          <InventoryTab
            inventory={inventory}
            loading={loadingInventory}
            groupMemberObjects={groupMemberObjects}
            onDelete={(id) => deleteInventoryItem(id)}
          />
        )}

        {tab === 'orders' && (
          <OrdersTab
            orders={orders}
            loading={loadingOrders}
            onDelete={(id) => deleteOrder(id)}
          />
        )}
      </div>

      <ProductForm
        open={productSheet}
        onClose={() => setProductSheet(false)}
        editing={editingProduct}
      />
      <CategoryForm
        open={categorySheet}
        onClose={() => setCategorySheet(false)}
        editing={editingCategory}
      />
    </>
  )
}
