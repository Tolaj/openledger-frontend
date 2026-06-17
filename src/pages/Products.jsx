import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { Plus, Tag, Heart, Package, ShoppingCart, Pencil, Trash2, ShoppingBasket, ChevronDown, Check } from 'lucide-react'
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

  // ── Mobile: card list ──────────────────────────────────────────────────────
  return (
    <>
      {/* Mobile cards */}
      <div className="flex flex-col gap-2 md:hidden">
        {filtered.map((p) => (
          <div key={p._id} className="bg-white rounded-2xl border border-zinc-200 p-4 flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
              style={{ backgroundColor: p.category?.color ? `${p.category.color}22` : '#f4f4f5' }}
            >
              {p.category?.icon || '📦'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-zinc-900 truncate">{p.name}</p>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <span className="text-sm font-medium text-zinc-700">${parseFloat(p.price).toFixed(2)}</span>
                <span className="text-xs text-zinc-400">/ {p.unit}</span>
                {p.category?.name && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600">{p.category.name}</span>
                )}
              </div>
            </div>
            <div className="flex gap-1 flex-shrink-0">
              <button onClick={() => addItem({ ...p, price: getPrice(p) }, p.unit, 'equal', [], groupMembers)} className="p-2 rounded-xl text-zinc-400 active:bg-zinc-100 hover:text-zinc-700">
                <ShoppingBasket size={15} />
              </button>
              <button onClick={() => onEdit(p)} className="p-2 rounded-xl text-zinc-400 active:bg-zinc-100 hover:text-zinc-700">
                <Pencil size={15} />
              </button>
              <button onClick={() => { if (confirm(`Delete "${p.name}"?`)) onDelete(p._id) }} className="p-2 rounded-xl text-zinc-400 active:bg-zinc-100 hover:text-red-500">
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        ))}
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
  if (loading) return <Spinner className="py-12" />
  if (categories.length === 0) return (
    <EmptyState icon={Tag} title="No categories yet" description="Create a category to organise your products" />
  )
  return (
    <div className="flex flex-col gap-2 md:grid md:grid-cols-2 lg:grid-cols-3">
      {categories.map((c) => (
        <div key={c._id} className="bg-white rounded-2xl border border-zinc-200 p-4 flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
            style={{ backgroundColor: `${c.color}22` }}
          >
            {c.icon}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-zinc-900">{c.name}</p>
            <p className="text-xs text-zinc-400">
              {products.filter((p) => p.category?._id === c._id || p.category === c._id).length} products
            </p>
          </div>
          <div className="flex gap-1 flex-shrink-0">
            <button onClick={() => onEdit(c)} className="p-2 rounded-xl text-zinc-400 active:bg-zinc-100 hover:text-zinc-700">
              <Pencil size={15} />
            </button>
            <button onClick={() => { if (confirm(`Delete "${c.name}"?`)) onDelete(c._id) }} className="p-2 rounded-xl text-zinc-400 active:bg-zinc-100 hover:text-red-500">
              <Trash2 size={15} />
            </button>
          </div>
        </div>
      ))}
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
          <div key={w._id} className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
            <div className="flex items-start gap-3 p-4 cursor-pointer" onClick={() => toggle(w._id)}>
              <ChevronDown size={16} className={`mt-0.5 text-zinc-400 flex-shrink-0 transition-transform ${expanded[w._id] ? '' : '-rotate-90'}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-zinc-900">{w.name}</p>
                  <p className="text-sm font-bold text-zinc-900">Rs.{w.totalPrice}</p>
                </div>
                <p className="text-xs text-zinc-400 mt-0.5">{w.date} · {w.items?.length ?? 0} items</p>
              </div>
            </div>
            {expanded[w._id] && (
              <div className="border-t border-zinc-100 px-4 py-3 bg-zinc-50">
                {(w.items || []).map((item, idx) => (
                  <div key={idx} className="py-1 text-xs text-zinc-600 border-b border-zinc-100 last:border-0">
                    {item.product?.name || item.name} — {item.price} × {item.count} {item.unit}
                  </div>
                ))}
                <div className="flex gap-2 mt-3">
                  <button onClick={() => addAllToCart(w)} className="flex-1 text-xs font-semibold text-white bg-zinc-900 rounded-lg py-1.5">Add to Cart</button>
                  <button onClick={() => openEdit(w._id)} className="flex-1 text-xs font-semibold text-zinc-900 border border-zinc-200 rounded-lg py-1.5">Edit</button>
                  <button onClick={() => { if (confirm(`Delete "${w.name}"?`)) onDelete(w._id) }} className="flex-1 text-xs font-semibold text-red-500 border border-zinc-200 rounded-lg py-1.5">Delete</button>
                </div>
              </div>
            )}
          </div>
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
          <div key={o._id} className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
            <div
              className="flex items-start gap-3 p-4 cursor-pointer"
              onClick={() => toggle(o._id)}
            >
              <ChevronDown size={16} className={`mt-0.5 text-zinc-400 flex-shrink-0 transition-transform ${expanded[o._id] ? '' : '-rotate-90'}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-zinc-900">{o.name}</p>
                  <p className="text-sm font-bold text-zinc-900">Rs.{o.totalPrice}</p>
                </div>
                <p className="text-xs text-zinc-400 mt-0.5">{o.date} · {o.items?.length ?? 0} items · {o.paidBy?.name || o.paidBy?.email || '—'}</p>
              </div>
            </div>
            {expanded[o._id] && (
              <div className="border-t border-zinc-100 px-4 py-3 bg-zinc-50">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="text-zinc-400 font-medium">
                      {['product', 'price', 'count', 'unit', 'splitAmong'].map((h) => (
                        <td key={h} className="pb-2 pr-3">{h}</td>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(o.items || []).map((item, idx) => (
                      <tr key={idx} className="border-t border-zinc-200">
                        <td className="py-1.5 pr-3 font-medium text-zinc-800">{item.product?.name || '—'}</td>
                        <td className="py-1.5 pr-3 text-zinc-600">{item.price}</td>
                        <td className="py-1.5 pr-3 text-zinc-600">{item.count}</td>
                        <td className="py-1.5 pr-3 text-zinc-600">{item.unit}</td>
                        <td className="py-1.5 text-zinc-600">{(item.splitAmong || []).map((u) => u?.name || u?.email || String(u)).join(', ')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
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
          <EmptyState icon={Package} title="Nothing in stock" description="Stock levels will appear here" />
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
