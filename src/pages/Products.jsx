import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { createPortal } from 'react-dom'
import { Plus, Tag, Heart, Package, ShoppingCart, Pencil, Trash2, ShoppingBasket, ChevronDown, Check, ClipboardList, Filter, RefreshCw, Minus, Repeat } from 'lucide-react'
import DataTable, { DataTableFilterIcon, DataTableMobileFilters } from '../components/ui/DataTable'
import Tabs from '../components/ui/Tabs'
import TopBar from '../components/layout/TopBar'
import PageHeader from '../components/layout/PageHeader'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import EmptyState from '../components/ui/EmptyState'
import Spinner from '../components/ui/Spinner'
import ProductForm from '../components/features/ProductForm'
import CategoryForm from '../components/features/CategoryForm'
import BottomSheet from '../components/ui/BottomSheet'
import PageActions from '../components/layout/PageActions'
import { useProducts, useDeleteProduct } from '../hooks/useProducts'
import { useCategories, useDeleteCategory } from '../hooks/useCategories'
import { useOrders, useDeleteOrder } from '../hooks/useOrders'
import { useGeneralOrders, useDeleteGeneralOrder } from '../hooks/useGeneralOrders'
import { usePurchaseOrders, useDeletePurchaseOrder } from '../hooks/usePurchaseOrders'
import { useSalesOrders, useDeleteSalesOrder } from '../hooks/useSalesOrders'
import { usePurchaseInvoices } from '../hooks/usePurchaseInvoices'
import { useSalesInvoices } from '../hooks/useSalesInvoices'
import { useWishlists, useDeleteWishlist, useUpdateWishlist } from '../hooks/useWishlists'
import { useInventory, useUpdateInventory, useDeleteInventory } from '../hooks/useInventory'
import { useRecurring, useCreateRecurring, useUpdateRecurring, useDeleteRecurring } from '../hooks/useRecurring'
import ProductPicker from '../components/features/ProductPicker'
import useCartStore from '../store/cartStore'
import { useCurrencySymbol } from '../hooks/useCurrency'
import useAuthStore from '../store/authStore'
import useGroupStore from '../store/groupStore'
import useWishlistStore from '../store/wishlistStore'
import { useGroup, useGroups } from '../hooks/useGroups'
import { usePermission } from '../hooks/usePermission'

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
function ProductsListTab({ products, categories, loading, onEdit, onDelete, groupMembers, groupMemberObjects, mobileFiltersOpen, onMobileFiltersOpenChange, isBusiness, canEdit = true, canDelete = true, canCart = true }) {
  const { addItem, items } = useCartStore()
  const sym = useCurrencySymbol()
  const [qty, setQty] = useState({})
  const [prices, setPrices] = useState({})
  const [splits, setSplits] = useState({})  // productId -> splitAmong array
  const [filters, setFilters] = useState({ name: '', category: '', price: '', unit: '', manufacturer: '' })
  const [dropSel, setDropSel] = useState({})
  const [expanded, setExpanded] = useState({})
  const [mobileUnits, setMobileUnits] = useState({})
  const [detailProduct, setDetailProduct] = useState(null)

  const getQty = (id) => qty[id] ?? 1
  const setQ = (id, val) => setQty((prev) => ({ ...prev, [id]: Math.max(1, val) }))
  const getPrice = (p) => prices[p._id] ?? parseFloat(p.price)
  const adjPrice = (p, delta) => setPrices((prev) => ({
    ...prev,
    [p._id]: Math.max(0, parseFloat((getPrice(p) + delta).toFixed(2))),
  }))
  const getSplit = (p) => splits[p._id] ?? groupMembers
  const setSplit = (p, arr) => setSplits((prev) => ({ ...prev, [p._id]: arr }))

  const setFilter = (key, val) => setFilters((f) => ({ ...f, [key]: val }))
  const getDrop = (key) => dropSel[key] || []
  const setDrop = (key, vals) => setDropSel((prev) => ({ ...prev, [key]: vals }))

  const dropOpts = {
    name: [...new Set(products.map((p) => p.name).filter(Boolean))],
    category: [...new Set(products.map((p) => p.category?.name).filter(Boolean))],
    price: [...new Set(products.map((p) => String(p.price)).filter(Boolean))],
    unit: [...new Set(products.map((p) => p.unit).filter(Boolean))],
    manufacturer: [...new Set(products.map((p) => p.manufacturer).filter(Boolean))],
  }

  const inDrop = (key, val) => getDrop(key).length === 0 || getDrop(key).includes(val)

  const filtered = products.filter((p) => {
    const catName = p.category?.name || ''
    return (
      p.name.toLowerCase().includes(filters.name.toLowerCase()) && inDrop('name', p.name) &&
      catName.toLowerCase().includes(filters.category.toLowerCase()) && inDrop('category', catName) &&
      String(p.price).includes(filters.price) && inDrop('price', String(p.price)) &&
      (p.unit || '').toLowerCase().includes(filters.unit.toLowerCase()) && inDrop('unit', p.unit) &&
      (p.manufacturer || '').toLowerCase().includes(filters.manufacturer.toLowerCase()) && inDrop('manufacturer', p.manufacturer || '')
    )
  })

  const cartCount = (id) => items.find((i) => i._id === id)?.quantity ?? 0

  if (loading) return <Spinner className="py-12" />
  if (products.length === 0) return (
    <EmptyState icon={Tag} title="No products yet" description="Add your first product" />
  )

  // ── Mobile: expandable cards ───────────────────────────────────────────────
  const toggleExpand = (id) => setExpanded((e) => ({ ...e, [id]: !e[id] }))

  const UNITS = [
    'pcs', 'pair', 'set', 'pack', 'box', 'carton', 'dozen', 'tray', 'roll', 'ream', 'bag', 'bundle', 'bunch', 'loaf', 'jar', 'tube', 'bottle', 'can', 'cylinder', 'sheet', 'pad',
    'kg', 'g', 'mg', 'mt',
    'ltr', 'mL',
    'mtr', 'cm', 'ft', 'cft',
    'hr', 'min', 'day', 'month', 'year',
    'project', 'shipment', 'trip', 'night',
    'unit',
  ]
  const getUnit = (p) => mobileUnits[p._id] ?? p.unit
  const cycleUnit = (p, dir) => {
    const cur = getUnit(p)
    const idx = UNITS.indexOf(cur)
    const next = UNITS[(idx + dir + UNITS.length) % UNITS.length]
    setMobileUnits((prev) => ({ ...prev, [p._id]: next }))
  }

  const PRODUCTS_COLS = [
    { key: 'name', label: 'name', filterable: true },
    { key: 'category', label: 'category', filterable: true },
    { key: 'price', label: `price (${sym})`, filterable: true },
    { key: 'unit', label: 'unit', filterable: true },
    { key: 'manufacturer', label: 'manufacturer', filterable: true },
  ]

  return (
    <>
      <DataTableMobileFilters columns={PRODUCTS_COLS} filters={filters} onFilterChange={setFilter} dropOpts={dropOpts} dropSel={dropSel} onDropChange={setDrop} open={mobileFiltersOpen} />
      {/* Mobile cards */}
      <div className="flex flex-col gap-2 md:hidden">
        {filtered.map((p) => {
          const isOpen = !!expanded[p._id]
          const iconBg = p.category?.color ? p.category.color : '#f4f4f5'
          const unit = getUnit(p)
          const price = getPrice(p)
          const split = getSplit(p)

          return (
            <div key={p._id} className="bg-white rounded-2xl overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.07)]">
              {/* collapsed row */}
              <div className="px-3 py-3 flex items-center gap-2.5">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                  style={{ backgroundColor: p.category?.color ? `${p.category.color}22` : '#f4f4f5' }}
                >
                  {p.category?.icon || '📦'}
                </div>
                <div className="flex-1 min-w-0" onClick={() => toggleExpand(p._id)}>
                  <p className="text-sm font-semibold text-zinc-900 truncate">{p.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs font-medium text-zinc-700">{sym}{parseFloat(p.price).toFixed(2)}</span>
                    <span className="text-xs text-zinc-400">| {p.unit}</span>
                  </div>
                </div>
                <div className="flex gap-0 flex-shrink-0" >
                  {canCart && <button onClick={() => addItem({ ...p, price }, unit, 'equal', split, groupMembers)} className="px-1 py-2 rounded-xl text-zinc-400 active:bg-zinc-100 hover:text-zinc-700">
                    <ShoppingBasket size={17} />
                  </button>}
                  {canEdit && <button onClick={() => onEdit(p)} className="px-1 py-2 rounded-xl text-zinc-400 active:bg-zinc-100 hover:text-zinc-700">
                    <Pencil size={17} />
                  </button>}
                  {canDelete && <button onClick={() => { if (confirm(`Delete "${p.name}"?`)) onDelete(p._id) }} className="px-1 py-2 rounded-xl text-zinc-400 active:bg-zinc-100 hover:text-red-500">
                    <Trash2 size={17} />
                  </button>}
                  <button onClick={() => toggleExpand(p._id)} className="px-1 py-2 rounded-xl text-zinc-400 active:bg-zinc-100">
                    <ChevronDown size={17} className={`transition-transform ${isOpen ? '' : '-rotate-90'}`} />
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
                      <button onClick={() => adjPrice(p, -0.05)} className="w-5 h-5 rounded-full bg-zinc-900 text-white flex items-center justify-center text-xs font-bold leading-none flex-shrink-0">−</button>
                      <InlineNumber value={price} onCommit={(v) => setPrices((prev) => ({ ...prev, [p._id]: v }))} format={(v) => v.toFixed(2)} />
                      <button onClick={() => adjPrice(p, 0.05)} className="w-5 h-5 rounded-full bg-zinc-900 text-white flex items-center justify-center text-xs font-bold leading-none flex-shrink-0">+</button>
                    </div>
                  </div>
                  {/* unit */}
                  <div className="flex items-center px-4 py-2.5">
                    <span className="text-xs text-zinc-400 w-24 flex-shrink-0">unit</span>
                    <div className="flex items-center gap-2 flex-1">
                      <button onClick={() => cycleUnit(p, -1)} className="w-5 h-5 rounded-full bg-zinc-900 text-white flex items-center justify-center text-xs font-bold leading-none flex-shrink-0">−</button>
                      <span className="w-14 text-center text-xs font-semibold text-zinc-900">{unit}</span>
                      <button onClick={() => cycleUnit(p, 1)} className="w-5 h-5 rounded-full bg-zinc-900 text-white flex items-center justify-center text-xs font-bold leading-none flex-shrink-0">+</button>
                    </div>
                  </div>
                  {/* splitAmong */}
                  {!isBusiness && (
                    <div className="flex items-center px-4 py-2.5">
                      <span className="text-xs text-zinc-400 w-24 flex-shrink-0">splitAmong</span>
                      <SplitDropdown members={groupMemberObjects} splitAmong={split} onChange={(arr) => setSplit(p, arr)} />
                    </div>
                  )}
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

      <DataTable
        columns={[
          { key: 'name', label: 'name', filterable: true },
          { key: 'category', label: 'category', filterable: true },
          { key: 'price', label: `price (${sym})`, filterable: true },
          { key: 'unit', label: 'unit', filterable: true },
          ...(!isBusiness ? [{ key: 'splitAmong', label: 'splitAmong' }] : []),
          { key: 'manufacturer', label: 'manufacturer', filterable: true },
          { key: 'action', label: 'action' },
        ]}
        data={filtered}
        filters={filters}
        onFilterChange={setFilter}
        dropOpts={dropOpts}
        dropSel={dropSel}
        onDropChange={(key, vals) => setDrop(key, vals)}
        renderRow={(p) => (
          <tr key={p._id} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50 transition-colors">
            {/* name */}
            <td className="px-4 py-3 border-r border-zinc-100 font-medium text-zinc-900 max-w-[140px] truncate">{p.name}</td>
            {/* category */}
            <td className="px-4 py-3 border-r border-zinc-100 max-w-[140px]">
              {p.category ? (
                <span className="flex items-center gap-1.5 min-w-0">
                  <span
                    className="w-6 h-6 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
                    style={{ backgroundColor: p.category.color ? `${p.category.color}22` : '#f4f4f5' }}
                  >
                    {p.category.icon}
                  </span>
                  <span className="text-zinc-700 text-xs truncate">{p.category.name}</span>
                </span>
              ) : '—'}
            </td>
            {/* price with temp stepper + inline edit */}
            <td className="px-4 py-3 border-r border-zinc-100">
              <div className="flex items-center gap-1.5 whitespace-nowrap">
                <button
                  onClick={() => adjPrice(p, -0.05)}
                  className="w-5 h-5 rounded-full bg-zinc-900 text-white flex items-center justify-center text-xs font-bold leading-none"
                >−</button>
                <InlineNumber
                  value={getPrice(p)}
                  onCommit={(v) => setPrices((prev) => ({ ...prev, [p._id]: v }))}
                  format={(v) => v.toFixed(2)}
                />
                <button
                  onClick={() => adjPrice(p, 0.05)}
                  className="w-5 h-5 rounded-full bg-zinc-900 text-white flex items-center justify-center text-xs font-bold leading-none"
                >+</button>
              </div>
            </td>
            {/* unit — plain text */}
            <td className="px-4 py-3 border-r border-zinc-100 text-sm text-zinc-700">{p.unit}</td>
            {/* splitAmong */}
            {!isBusiness && (
              <td className="px-4 py-3 border-r border-zinc-100">
                <SplitDropdown
                  members={groupMemberObjects}
                  splitAmong={getSplit(p)}
                  onChange={(arr) => setSplit(p, arr)}
                />
              </td>
            )}
            {/* manufacturer */}
            <td className="px-4 py-3 border-r border-zinc-100 text-zinc-500 max-w-[120px] truncate">{p.manufacturer || '—'}</td>
            {/* actions */}
            <td className="px-4 py-3">
              <div className="flex items-center gap-1.5 whitespace-nowrap">
                {canCart && (
                  <button
                    onClick={() => addItem({ ...p, price: getPrice(p) }, p.unit, 'equal', getSplit(p), groupMembers)}
                    className="p-1.5 rounded-lg bg-zinc-900 text-white active:bg-zinc-700"
                    title="Add to cart"
                  >
                    <ShoppingBasket size={14} />
                  </button>
                )}
                <button
                  onClick={() => setDetailProduct(p)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 active:bg-zinc-100"
                  title="Details"
                >
                  <ClipboardList size={14} />
                </button>
                {canEdit && (
                  <button
                    onClick={() => onEdit(p)}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 active:bg-zinc-100"
                    title="Edit"
                  >
                    <Pencil size={14} />
                  </button>
                )}
                {canDelete && (
                  <button
                    onClick={() => { if (confirm(`Delete "${p.name}"?`)) onDelete(p._id) }}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 active:bg-zinc-100"
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </td>
          </tr>
        )}
        emptyMessage="No products yet"
        mobileFiltersOpen={mobileFiltersOpen}
        onMobileFiltersOpenChange={onMobileFiltersOpenChange}
      />

      {/* Product Detail Sheet — always mounted */}
      <BottomSheet
        open={!!detailProduct}
        onClose={() => setDetailProduct(null)}
        title="Product Details"
      >
        {detailProduct && (
          <div className="space-y-0 divide-y divide-zinc-100">
            {/* Header */}
            <div className="flex items-center gap-4 pb-4">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                style={{ backgroundColor: detailProduct.category?.color ? `${detailProduct.category.color}22` : '#f4f4f5' }}
              >
                {detailProduct.category?.icon || '📦'}
              </div>
              <div className="min-w-0">
                <p className="text-lg font-bold text-zinc-900 truncate">{detailProduct.name}</p>
                <p className="text-sm text-zinc-400">{detailProduct.category?.name || 'Uncategorised'}</p>
              </div>
            </div>

            {/* Fields */}
            {[
              { label: 'Price',        value: `${sym}${parseFloat(detailProduct.price || 0).toFixed(2)}` },
              { label: 'Unit',         value: detailProduct.unit || '—' },
              { label: 'Manufacturer', value: detailProduct.manufacturer || '—' },
              { label: 'Description',  value: detailProduct.description || '—' },
              { label: 'Stock',        value: detailProduct.inventory ? 'Tracked' : 'Not tracked' },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-start justify-between gap-4 py-3">
                <span className="text-sm text-zinc-400 flex-shrink-0 w-28">{label}</span>
                <span className="text-sm font-medium text-zinc-900 text-right">{value}</span>
              </div>
            ))}
          </div>
        )}
      </BottomSheet>
    </>
  )
}

// ── Category tab ──────────────────────────────────────────────────────────────
function CategoryTab({ categories, products, loading, onEdit, onDelete, mobileFiltersOpen, onMobileFiltersOpenChange, canEdit = true, canDelete = true }) {
  const [filters, setFilters] = useState({ name: '' })
  const [dropSel, setDropSel] = useState({})
  const [expanded, setExpanded] = useState({})
  const setFilter = (k, v) => setFilters((f) => ({ ...f, [k]: v }))
  const toggleExpand = (id) => setExpanded((e) => ({ ...e, [id]: !e[id] }))
  const getDrop = (key) => dropSel[key] || []
  const setDrop = (key, vals) => setDropSel((prev) => ({ ...prev, [key]: vals }))

  if (loading) return <Spinner className="py-12" />
  if (categories.length === 0) return (
    <EmptyState icon={Tag} title="No categories yet" description="Create a category to organise your products" />
  )

  const dropOpts = { name: [...new Set(categories.map((c) => c.name).filter(Boolean))] }
  const inDrop = (key, val) => getDrop(key).length === 0 || getDrop(key).includes(val)

  const filtered = categories.filter((c) =>
    c.name.toLowerCase().includes(filters.name.toLowerCase()) && inDrop('name', c.name)
  )

  const CAT_COLS = [{ key: 'name', label: 'name', filterable: true }]

  return (
    <>
      <DataTableMobileFilters columns={CAT_COLS} filters={filters} onFilterChange={setFilter} dropOpts={dropOpts} dropSel={dropSel} onDropChange={setDrop} open={mobileFiltersOpen} />
      {/* Mobile cards */}
      <div className="flex flex-col gap-2 md:hidden">
        {filtered.map((c) => {
          const isOpen = !!expanded[c._id]
          const productCount = products.filter((p) => p.category?._id === c._id || p.category === c._id).length
          return (
            <div key={c._id} className="bg-white rounded-2xl overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.07)]">
              {/* collapsed row */}
              <div className="px-3 py-3 flex items-center gap-2.5">
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
                <div className="flex gap-0 flex-shrink-0" >
                  {canEdit && <button onClick={() => onEdit(c)} className="px-1 py-2 rounded-xl text-zinc-400 active:bg-zinc-100 hover:text-zinc-700">
                    <Pencil size={17} />
                  </button>}
                  {canDelete && <button onClick={() => { if (confirm(`Delete "${c.name}"?`)) onDelete(c._id) }} className="px-1 py-2 rounded-xl text-zinc-400 active:bg-zinc-100 hover:text-red-500">
                    <Trash2 size={17} />
                  </button>}
                  <button onClick={() => toggleExpand(c._id)} className="px-1 py-2 rounded-xl text-zinc-400 active:bg-zinc-100">
                    <ChevronDown size={17} className={`transition-transform ${isOpen ? '' : '-rotate-90'}`} />
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

      <DataTable
        columns={[
          { key: 'icon', label: 'Icon' },
          { key: 'name', label: 'Name', filterable: true },
          { key: 'products', label: 'Products' },
          { key: 'action', label: 'Action' },
        ]}
        data={filtered}
        filters={filters}
        onFilterChange={setFilter}
        dropOpts={{ name: dropOpts.name }}
        dropSel={dropSel}
        onDropChange={(key, vals) => setDrop(key, vals)}
        renderRow={(c) => {
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
                  {canEdit && <button onClick={() => onEdit(c)} className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 active:bg-zinc-100" title="Edit">
                    <Pencil size={14} />
                  </button>}
                  {canDelete && <button onClick={() => { if (confirm(`Delete "${c.name}"?`)) onDelete(c._id) }} className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 active:bg-zinc-100" title="Delete">
                    <Trash2 size={14} />
                  </button>}
                </div>
              </td>
            </tr>
          )
        }}
        emptyMessage="No categories yet"
        mobileFiltersOpen={mobileFiltersOpen}
        onMobileFiltersOpenChange={onMobileFiltersOpenChange}
      />
    </>
  )
}

// ── WishlistMobileCard ────────────────────────────────────────────────────────
function WishlistMobileCard({ w, onAddToCart, onEdit, onDelete, memberName }) {
  const sym = useCurrencySymbol()
  const [isOpen, setIsOpen] = useState(false)
  const [itemsOpen, setItemsOpen] = useState(false)
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.07)]">
      {/* collapsed row */}
      <div className="px-3 py-3 flex items-center gap-2.5">
        <div className="w-10 h-10 rounded-xl bg-zinc-900 flex items-center justify-center flex-shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-white">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25Z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0" onClick={() => setIsOpen((o) => !o)}>
          <p className="text-sm font-semibold text-zinc-900 truncate">{w.name}</p>
          <p className="text-xs text-zinc-400 mt-0.5">{sym}{w.totalPrice} &nbsp;|&nbsp; {w.date ? new Date(w.date).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }) : '—'}</p>
        </div>
        <div className="flex gap-0 flex-shrink-0" >
          <button onClick={() => onAddToCart(w)} className="px-1 py-2 rounded-xl text-zinc-400 active:bg-zinc-100 hover:text-zinc-700">
            <ShoppingBasket size={17} />
          </button>
          <button onClick={() => onEdit(w._id)} className="px-1 py-2 rounded-xl text-zinc-400 active:bg-zinc-100 hover:text-zinc-700">
            <Pencil size={17} />
          </button>
          <button onClick={() => { if (confirm(`Delete "${w.name}"?`)) onDelete(w._id) }} className="px-1 py-2 rounded-xl text-zinc-400 active:bg-zinc-100 hover:text-red-500">
            <Trash2 size={17} />
          </button>
          <button onClick={() => setIsOpen((o) => !o)} className="px-1 py-2 rounded-xl text-zinc-400 active:bg-zinc-100">
            <ChevronDown size={17} className={`transition-transform ${isOpen ? '' : '-rotate-90'}`} />
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
            <span className="text-sm font-semibold text-zinc-900">{sym}{w.totalPrice}</span>
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
                        <td className="px-2 py-1.5 border-r border-zinc-100 text-zinc-600">{sym}{item.price}</td>
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
function WishlistTab({ wishlists, groupMembers, groupMemberObjects = [], onDelete, mobileFiltersOpen, onMobileFiltersOpenChange, isBusiness }) {
  const { openEdit } = useWishlistStore()
  const { addItem } = useCartStore()
  const sym = useCurrencySymbol()

  const memberName = (id) => {
    const m = groupMemberObjects.find((m) => String(m._id) === String(id))
    return m?.name || m?.email || id
  }
  const [expanded, setExpanded] = useState({})
  const [filters, setFilters] = useState({ name: '', totalPrice: '', date: '', paidBy: '', createdBy: '' })
  const [dropSel, setDropSel] = useState({})
  const setFilter = (k, v) => setFilters((f) => ({ ...f, [k]: v }))
  const toggle = (id) => setExpanded((e) => ({ ...e, [id]: !e[id] }))
  const getDrop = (key) => dropSel[key] || []
  const setDrop = (key, vals) => setDropSel((prev) => ({ ...prev, [key]: vals }))

  if (!wishlists.length) return (
    <EmptyState icon={Heart} title="Wishlist is empty" description="Save items you want to buy later" />
  )

  const dropOpts = {
    name: [...new Set(wishlists.map((w) => w.name).filter(Boolean))],
    totalPrice: [...new Set(wishlists.map((w) => String(w.totalPrice || '')).filter(Boolean))],
    date: [...new Set(wishlists.map((w) => w.date).filter(Boolean))],
    paidBy: [...new Set(wishlists.map((w) => w.paidBy?.name || w.paidBy?.email).filter(Boolean))],
    createdBy: [...new Set(wishlists.map((w) => w.createdBy?.name || w.createdBy?.email).filter(Boolean))],
  }
  const inDrop = (key, val) => getDrop(key).length === 0 || getDrop(key).includes(val)

  const filtered = wishlists.filter((w) => {
    const paidName = w.paidBy?.name || w.paidBy?.email || ''
    const createdName = w.createdBy?.name || w.createdBy?.email || ''
    return (
      w.name.toLowerCase().includes(filters.name.toLowerCase()) && inDrop('name', w.name) &&
      String(w.totalPrice || '').includes(filters.totalPrice) && inDrop('totalPrice', String(w.totalPrice || '')) &&
      (w.date || '').includes(filters.date) && inDrop('date', w.date || '') &&
      paidName.toLowerCase().includes(filters.paidBy.toLowerCase()) && inDrop('paidBy', paidName) &&
      createdName.toLowerCase().includes(filters.createdBy.toLowerCase()) && inDrop('createdBy', createdName)
    )
  })

  const addAllToCart = (entry) => {
    entry.items.forEach((item) => {
      const product = item.product && typeof item.product === 'object' ? item.product : { _id: item.product }
      const price = parseFloat(item._price ?? item.price)
      const qty = parseInt(item.quantity ?? item.count, 10) || 1
      const splitAmong = (item._splitAmong || item.splitAmong || []).map((u) =>
        typeof u === 'object' ? String(u._id) : String(u)
      )
      addItem({ ...product, price, taxRate: item.taxRate ?? item._taxRate ?? 0 }, item.unit, item._splitType || item.splitType || 'equal', splitAmong, groupMembers, qty)
    })
  }

  const WISH_COLS = [
    { key: 'name', label: 'name', filterable: true },
    { key: 'totalPrice', label: `total price (${sym})`, filterable: true },
    { key: 'date', label: 'date', filterable: true },
    { key: 'paidBy', label: 'paid by', filterable: true },
    { key: 'createdBy', label: 'created by', filterable: true },
  ]

  return (
    <>
      <DataTableMobileFilters columns={WISH_COLS} filters={filters} onFilterChange={setFilter} dropOpts={dropOpts} dropSel={dropSel} onDropChange={setDrop} open={mobileFiltersOpen} />
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

      <DataTable
        columns={[
          { key: 'name', label: 'name', filterable: true },
          { key: 'items', label: 'items' },
          { key: 'totalPrice', label: `total price (${sym})`, filterable: true },
          { key: 'date', label: 'date', filterable: true },
          { key: 'paidBy', label: 'paidBy', filterable: true },
          { key: 'createdBy', label: 'createdBy', filterable: true },
          { key: 'action', label: 'Action' },
        ]}
        data={filtered}
        filters={filters}
        onFilterChange={setFilter}
        dropOpts={dropOpts}
        dropSel={dropSel}
        onDropChange={(key, vals) => setDrop(key, vals)}
        leadingCol={true}
        renderRow={(w) => (
          <React.Fragment key={w._id}>
            <tr className="border-b border-zinc-100 hover:bg-zinc-50 transition-colors cursor-pointer" onClick={() => toggle(w._id)}>
              <td className="px-3 py-3 border-r border-zinc-100 text-zinc-400">
                <ChevronDown size={14} className={`transition-transform ${expanded[w._id] ? '' : '-rotate-90'}`} />
              </td>
              <td className="px-4 py-3 border-r border-zinc-100 font-medium text-zinc-900">{w.name}</td>
              <td className="px-4 py-3 border-r border-zinc-100 text-zinc-700">{w.items?.length ?? 0}</td>
              <td className="px-4 py-3 border-r border-zinc-100 font-semibold text-zinc-900">{sym}{w.totalPrice}</td>
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
                        {['product', 'price', 'count', 'unit', ...(!isBusiness ? ['splitAmong'] : [])].map((h, i, arr) => (
                          <th key={h} className={`px-3 py-2 text-left text-xs font-semibold text-zinc-500 ${i < arr.length - 1 ? 'border-r border-zinc-200' : ''}`}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(w.items || []).map((item, idx, arr) => (
                        <tr key={idx} className={idx < arr.length - 1 ? 'border-b border-zinc-100' : ''}>
                          <td className="px-3 py-2 border-r border-zinc-100 font-medium text-zinc-800">{item.product?.name || '—'}</td>
                          <td className="px-3 py-2 border-r border-zinc-100 text-zinc-600">{sym}{item.price}</td>
                          <td className="px-3 py-2 border-r border-zinc-100 text-zinc-600">{item.count}</td>
                          <td className={`px-3 py-2 text-zinc-600 ${!isBusiness ? 'border-r border-zinc-100' : ''}`}>{item.unit}</td>
                          {!isBusiness && (
                            <td className="px-3 py-2 text-zinc-600">
                              {(item.splitAmong || []).map((u) => {
                                const id = typeof u === 'object' ? u._id : u
                                return u?.name || u?.email || memberName(id)
                              }).join(', ')}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </td>
              </tr>
            )}
          </React.Fragment>
        )}
        emptyMessage="Wishlist is empty"
        mobileFiltersOpen={mobileFiltersOpen}
        onMobileFiltersOpenChange={onMobileFiltersOpenChange}
      />
    </>
  )
}

// ── PersonalOrderMobileCard ───────────────────────────────────────────────────
function PersonalOrderMobileCard({ o, onDelete, isBusiness }) {
  const sym = useCurrencySymbol()
  const [isOpen, setIsOpen] = useState(false)
  const [itemsOpen, setItemsOpen] = useState(false)
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }) : '—'
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.07)]">
      {/* collapsed row */}
      <div className="px-3 py-3 flex items-center gap-2.5">
        <div className="w-10 h-10 rounded-xl bg-zinc-900 flex items-center justify-center flex-shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-white">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.35 3.836c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m8.9-4.414c.376.023.75.05 1.124.08 1.131.094 1.976 1.057 1.976 2.192V16.5A2.25 2.25 0 0 1 18 18.75h-2.25m-7.5-10.5H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V18.75m-7.5-10.5h6.375c.621 0 1.125.504 1.125 1.125v9.375m-8.25-3 1.5 1.5 3-3.75" />
          </svg>
        </div>
        <div className="flex-1 min-w-0" onClick={() => setIsOpen((v) => !v)}>
          <p className="text-sm font-semibold text-zinc-900 truncate">{o.name}</p>
          <p className="text-xs text-zinc-400 mt-0.5">{sym}{o.totalPrice} &nbsp;|&nbsp; {fmtDate(o.date)}</p>
        </div>
        <div className="flex gap-0 flex-shrink-0" >
          <button onClick={() => { if (confirm(`Delete "${o.name}"?`)) onDelete(o._id) }} className="px-1 py-2 rounded-xl text-zinc-400 active:bg-zinc-100 hover:text-red-500">
            <Trash2 size={17} />
          </button>
          <button onClick={() => setIsOpen((v) => !v)} className="px-1 py-2 rounded-xl text-zinc-400 active:bg-zinc-100">
            <ChevronDown size={17} className={`transition-transform ${isOpen ? '' : '-rotate-90'}`} />
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
            <span className="text-sm font-semibold text-zinc-900">{sym}{o.totalPrice}</span>
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
                      {['Product', 'Price', 'Unit', 'Count', ...(!isBusiness ? ['Split'] : [])].map((h, i, arr) => (
                        <th key={h} className={`px-2 py-1.5 text-left font-semibold text-zinc-500 ${i < arr.length - 1 ? 'border-r border-zinc-100' : ''}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(o.items || []).map((item, idx, arr) => (
                      <tr key={idx} className={idx < arr.length - 1 ? 'border-b border-zinc-100' : ''}>
                        <td className="px-2 py-1.5 border-r border-zinc-100 text-zinc-800 font-medium">{item.product?.name || '—'}</td>
                        <td className="px-2 py-1.5 border-r border-zinc-100 text-zinc-600">{sym}{item.price}</td>
                        <td className="px-2 py-1.5 border-r border-zinc-100 text-zinc-600">{item.unit}</td>
                        <td className={`px-2 py-1.5 text-zinc-600 ${!isBusiness ? 'border-r border-zinc-100' : ''}`}>{item.count}</td>
                        {!isBusiness && <td className="px-2 py-1.5 text-zinc-600">{(item.splitAmong || []).map((u) => u?.name || u?.email || String(u)).join(', ')}</td>}
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
const ORDER_TYPE_LABELS  = { general: 'General', go: 'General Order', po: 'Purchase Order', so: 'Sales Order' }
const ORDER_TYPE_COLORS  = { general: 'bg-zinc-100 text-zinc-600', go: 'bg-violet-50 text-violet-600', po: 'bg-blue-50 text-blue-600', so: 'bg-emerald-50 text-emerald-600' }
const ORDER_STATUS_VARIANT = {
  draft: 'default', sent: 'warning', confirmed: 'warning',
  partial: 'warning', received: 'success', delivered: 'success', cancelled: 'danger',
}
const SETTLEMENT_VARIANT = {
  paid:       'success',
  overdue:    'danger',
  sent:       'warning',
  draft:      'default',
  cancelled:  'default',
  uninvoiced: 'default',
}

// ── OrderMobileCard ───────────────────────────────────────────────────────────
function OrderMobileCard({ o, sym, isBusiness, onDelete }) {
  const [isOpen, setIsOpen] = useState(false)
  const [itemsOpen, setItemsOpen] = useState(false)
  const typeColor = ORDER_TYPE_COLORS[o._type] || 'bg-zinc-100 text-zinc-600'
  const typeLabel = ORDER_TYPE_LABELS[o._type] || o._type
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.07)]">
      <div className="px-3 py-3 flex items-center gap-2.5">
        <div className="w-10 h-10 rounded-xl bg-zinc-900 flex items-center justify-center flex-shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-white">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.35 3.836c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m8.9-4.414c.376.023.75.05 1.124.08 1.131.094 1.976 1.057 1.976 2.192V16.5A2.25 2.25 0 0 1 18 18.75h-2.25m-7.5-10.5H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V18.75m-7.5-10.5h6.375c.621 0 1.125.504 1.125 1.125v9.375m-8.25-3 1.5 1.5 3-3.75" />
          </svg>
        </div>
        <div className="flex-1 min-w-0" onClick={() => setIsOpen((v) => !v)}>
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="text-sm font-semibold text-zinc-900 font-mono">{o._label || '—'}</p>
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${typeColor}`}>{typeLabel}</span>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            {sym}{Number(o._total || 0).toFixed(2)}&nbsp;|&nbsp;{o._party && o._party !== '—' ? o._party : (o._date ? new Date(o._date).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }) : '—')}
          </p>
        </div>
        <div className="flex gap-0 flex-shrink-0">
          <button onClick={() => onDelete(o)} className="px-1 py-2 rounded-xl text-zinc-400 active:bg-zinc-100 hover:text-red-500">
            <Trash2 size={17} />
          </button>
          <button onClick={() => setIsOpen((v) => !v)} className="px-1 py-2 rounded-xl text-zinc-400 active:bg-zinc-100">
            <ChevronDown size={17} className={`transition-transform ${isOpen ? '' : '-rotate-90'}`} />
          </button>
        </div>
      </div>
      {isOpen && (
        <div className="border-t border-zinc-100 divide-y divide-zinc-100">
          <div className="flex items-center px-4 py-2.5">
            <span className="text-xs text-zinc-400 w-24 flex-shrink-0">Status</span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {o._status && o._status !== '—' && <Badge variant={ORDER_STATUS_VARIANT[o._status] || 'default'}>{o._status}</Badge>}
              <Badge variant={SETTLEMENT_VARIANT[o._settlement] || 'default'}>{o._settlement}</Badge>
            </div>
          </div>
          {o._party && o._party !== '—' && (
            <div className="flex items-center px-4 py-2.5">
              <span className="text-xs text-zinc-400 w-24 flex-shrink-0">{isBusiness ? 'Party' : 'Paid By'}</span>
              <span className="text-sm text-zinc-900">{o._party}</span>
            </div>
          )}
          <div className="flex items-center px-4 py-2.5">
            <span className="text-xs text-zinc-400 w-24 flex-shrink-0">Total</span>
            <span className="text-sm font-semibold text-zinc-900">{sym}{Number(o._total || 0).toFixed(2)}</span>
          </div>
          {o._date && (
            <div className="flex items-center px-4 py-2.5">
              <span className="text-xs text-zinc-400 w-24 flex-shrink-0">Date</span>
              <span className="text-sm text-zinc-900">{new Date(o._date).toLocaleDateString()}</span>
            </div>
          )}
          <div className="px-4 py-2.5">
            <button onClick={() => setItemsOpen((v) => !v)} className="w-full flex items-center justify-between">
              <span className="text-xs text-zinc-400">items ({o.items?.length ?? 0})</span>
              <ChevronDown size={14} className={`text-zinc-400 transition-transform ${itemsOpen ? '' : '-rotate-90'}`} />
            </button>
            {itemsOpen && (
              <div className="mt-2 rounded-xl border border-zinc-100 overflow-hidden">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-100 bg-zinc-50">
                      {['Product', 'Qty', 'Price', 'Unit', ...(!isBusiness ? ['Split'] : [])].map((h, i, arr) => (
                        <th key={h} className={`px-2 py-1.5 text-left font-semibold text-zinc-500 ${i < arr.length - 1 ? 'border-r border-zinc-100' : ''}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(o.items || []).map((item, idx, arr) => (
                      <tr key={idx} className={idx < arr.length - 1 ? 'border-b border-zinc-100' : ''}>
                        <td className="px-2 py-1.5 border-r border-zinc-100 text-zinc-800 font-medium">{item.product?.name || item.description || '—'}</td>
                        <td className="px-2 py-1.5 border-r border-zinc-100 text-zinc-600">{item.qty ?? item.count ?? '—'}</td>
                        <td className="px-2 py-1.5 border-r border-zinc-100 text-zinc-600">{sym}{item.unitPrice ?? item.price ?? '—'}</td>
                        <td className={`px-2 py-1.5 text-zinc-600 ${!isBusiness ? 'border-r border-zinc-100' : ''}`}>{item.unit || '—'}</td>
                        {!isBusiness && <td className="px-2 py-1.5 text-zinc-600">{(item.splitAmong || []).map((u) => u?.name || u?.email || String(u)).join(', ')}</td>}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function OrdersTab({ mobileFiltersOpen, onMobileFiltersOpenChange, isBusiness }) {
  const sym = useCurrencySymbol()

  const { data: generalOrders = [], isLoading: loadingGeneral } = useOrders()
  const { data: goOrders = [], isLoading: loadingGO } = useGeneralOrders()
  const { data: purchaseOrders = [], isLoading: loadingPO } = usePurchaseOrders()
  const { data: salesOrders = [], isLoading: loadingSO } = useSalesOrders()
  const { data: purchaseInvoices = [] } = usePurchaseInvoices()
  const { data: salesInvoices = [] } = useSalesInvoices()
  const { mutate: deleteGeneral } = useDeleteOrder()
  const { mutate: deleteGO } = useDeleteGeneralOrder()
  const { mutate: deletePO } = useDeletePurchaseOrder()
  const { mutate: deleteSO } = useDeleteSalesOrder()

  const loading = loadingGeneral || loadingGO || loadingPO || loadingSO

  // Settlement lookup: poId → latest invoice status, soId → latest invoice status
  const poSettlement = {}
  purchaseInvoices.forEach((inv) => {
    const poId = inv.purchaseOrder?._id || inv.purchaseOrder
    if (!poId) return
    const key = String(poId)
    const prev = poSettlement[key]
    // prefer paid > overdue > sent > draft; last-created wins if same status
    if (!prev || new Date(inv.createdAt) > new Date(prev.createdAt)) poSettlement[key] = inv
  })
  const soSettlement = {}
  salesInvoices.forEach((inv) => {
    const soId = inv.salesOrder?._id || inv.salesOrder
    if (!soId) return
    const key = String(soId)
    const prev = soSettlement[key]
    if (!prev || new Date(inv.createdAt) > new Date(prev.createdAt)) soSettlement[key] = inv
  })

  // Normalise all into one shape
  const orders = [
    ...generalOrders.map((o) => ({ ...o, _type: 'general', _label: o.name,     _date: o.date,         _total: o.totalPrice, _party: o.paidBy?.name || o.paidBy?.email || '—', _status: o.status || 'received', _settlement: 'paid' })),
    ...goOrders.map((o)       => ({ ...o, _type: 'go',     _label: o.goNumber, _date: o.orderDate,    _total: o.grandTotal, _party: o.recipient?.name || '—',                   _status: o.status || 'draft',   _settlement: 'uninvoiced' })),
    ...purchaseOrders.map((o) => ({ ...o, _type: 'po',     _label: o.poNumber, _date: o.expectedDate, _total: o.grandTotal, _party: o.vendor?.name || '—',                      _status: o.status || '—',       _settlement: poSettlement[String(o._id)]?.status || 'uninvoiced' })),
    ...salesOrders.map((o)    => ({ ...o, _type: 'so',     _label: o.soNumber, _date: o.deliveryDate, _total: o.grandTotal, _party: o.customer?.name || '—',                    _status: o.status || '—',       _settlement: soSettlement[String(o._id)]?.status || 'uninvoiced' })),
  ].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))

  const handleDelete = (o) => {
    const label = o._label || 'this order'
    if (!confirm(`Delete "${label}"?`)) return
    if (o._type === 'general') deleteGeneral(o._id)
    else if (o._type === 'go') deleteGO(o._id)
    else if (o._type === 'po') deletePO(o._id)
    else deleteSO(o._id)
  }

  const [expanded, setExpanded] = useState({})
  const [filters, setFilters] = useState({ _label: '', _type: '', _party: '' })
  const setFilter = (k, v) => setFilters((f) => ({ ...f, [k]: v }))
  const toggle = (id) => setExpanded((e) => ({ ...e, [id]: !e[id] }))
  const [dropSel, setDropSel] = useState({})
  const getDrop = (key) => dropSel[key] || []
  const setDrop = (key, vals) => setDropSel((prev) => ({ ...prev, [key]: vals }))
  const inDrop = (key, val) => getDrop(key).length === 0 || getDrop(key).includes(val)

  const dropOpts = {
    _type:       ['general', 'go', 'po', 'so'],
    _status:     ['draft', 'sent', 'confirmed', 'partial', 'received', 'delivered', 'cancelled'],
    _settlement: ['paid', 'overdue', 'sent', 'draft', 'uninvoiced', 'cancelled'],
  }

  if (loading) return <Spinner className="py-12" />
  if (!orders.length) return (
    <EmptyState icon={ShoppingCart} title="No orders yet" description="General, purchase and sales orders will appear here" />
  )

  const filtered = orders.filter((o) =>
    (o._label || '').toLowerCase().includes(filters._label.toLowerCase()) &&
    (filters._type === '' || o._type === filters._type) && inDrop('_type', o._type) &&
    inDrop('_status', o._status) &&
    inDrop('_settlement', o._settlement) &&
    (o._party || '').toLowerCase().includes(filters._party.toLowerCase())
  )

  const ORDER_COLS = [
    { key: '_label',      label: 'Order #',    filterable: true, noDropdown: true },
    { key: '_type',       label: 'Type',       filterable: true },
    { key: '_status',     label: 'Status',     filterable: true },
    { key: '_settlement', label: 'Settlement', filterable: true },
    { key: '_party',      label: isBusiness ? 'Party' : 'Paid By', filterable: true, noDropdown: true },
    { key: '_total',      label: `Total (${sym})` },
    { key: '_date',       label: 'Date' },
  ]

  return (
    <>
      <DataTableMobileFilters columns={ORDER_COLS} filters={filters} onFilterChange={setFilter} dropOpts={dropOpts} dropSel={dropSel} onDropChange={setDrop} open={mobileFiltersOpen} />

      {/* Mobile cards */}
      <div className="flex flex-col gap-2 md:hidden">
        {filtered.map((o) => (
          <OrderMobileCard key={o._id} o={o} sym={sym} isBusiness={isBusiness} onDelete={handleDelete} />
        ))}
      </div>

      <DataTable
        columns={[
          { key: '_label',      label: 'Order #',    filterable: true, noDropdown: true },
          { key: '_type',       label: 'Type',       filterable: true },
          { key: '_status',     label: 'Status',     filterable: true },
          { key: '_settlement', label: 'Settlement', filterable: true },
          { key: '_party',      label: isBusiness ? 'Party' : 'Paid By', filterable: true, noDropdown: true },
          { key: 'items',       label: 'Items' },
          { key: '_total',      label: `Total (${sym})` },
          { key: '_date',       label: 'Date' },
          { key: 'action',      label: 'action' },
        ]}
        data={filtered}
        filters={filters}
        onFilterChange={setFilter}
        dropOpts={dropOpts}
        dropSel={dropSel}
        onDropChange={(key, vals) => setDrop(key, vals)}
        leadingCol={true}
        renderRow={(o) => (
          <React.Fragment key={o._id}>
            <tr className="border-b border-zinc-100 hover:bg-zinc-50 transition-colors cursor-pointer" onClick={() => toggle(o._id)}>
              <td className="px-3 py-3 border-r border-zinc-100 text-zinc-400">
                <ChevronDown size={14} className={`transition-transform ${expanded[o._id] ? '' : '-rotate-90'}`} />
              </td>
              <td className="px-4 py-3 border-r border-zinc-100 font-mono text-sm font-semibold text-zinc-900">{o._label || '—'}</td>
              <td className="px-4 py-3 border-r border-zinc-100">
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${ORDER_TYPE_COLORS[o._type]}`}>{ORDER_TYPE_LABELS[o._type]}</span>
              </td>
              <td className="px-4 py-3 border-r border-zinc-100">
                {o._status && o._status !== '—' ? <Badge variant={ORDER_STATUS_VARIANT[o._status] || 'default'}>{o._status}</Badge> : <span className="text-zinc-400">—</span>}
              </td>
              <td className="px-4 py-3 border-r border-zinc-100">
                <Badge variant={SETTLEMENT_VARIANT[o._settlement] || 'default'}>{o._settlement}</Badge>
              </td>
              <td className="px-4 py-3 border-r border-zinc-100 text-sm text-zinc-600">{o._party}</td>
              <td className="px-4 py-3 border-r border-zinc-100 text-sm text-zinc-500 text-center">{o.items?.length ?? 0}</td>
              <td className="px-4 py-3 border-r border-zinc-100 text-sm font-semibold text-zinc-900">{sym}{Number(o._total || 0).toFixed(2)}</td>
              <td className="px-4 py-3 border-r border-zinc-100 text-sm text-zinc-500">{o._date ? new Date(o._date).toLocaleDateString() : '—'}</td>
              <td className="px-4 py-3">
                <button onClick={(e) => { e.stopPropagation(); handleDelete(o) }} className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 active:bg-zinc-100"><Trash2 size={14} /></button>
              </td>
            </tr>
            {expanded[o._id] && (
              <tr key={`${o._id}-exp`} className="border-b border-zinc-100 bg-zinc-50">
                <td /><td colSpan={9} className="px-4 py-3">
                  <table className="w-full text-xs border-collapse rounded-xl overflow-hidden border border-zinc-200">
                    <thead>
                      <tr className="border-b border-zinc-200">
                        {['Product / Description', 'Qty / Count', 'Unit Price', 'Unit', ...(!isBusiness ? ['Split Among'] : [])].map((h, i, arr) => (
                          <th key={h} className={`px-3 py-2 text-left text-xs font-semibold text-zinc-500 ${i < arr.length - 1 ? 'border-r border-zinc-200' : ''}`}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(o.items || []).map((item, idx, arr) => (
                        <tr key={idx} className={idx < arr.length - 1 ? 'border-b border-zinc-100' : ''}>
                          <td className="px-3 py-2 border-r border-zinc-100 font-medium text-zinc-800">{item.product?.name || item.description || '—'}</td>
                          <td className="px-3 py-2 border-r border-zinc-100 text-zinc-600">{item.qty ?? item.count ?? '—'}</td>
                          <td className="px-3 py-2 border-r border-zinc-100 text-zinc-600">{sym}{item.unitPrice ?? item.price ?? '—'}</td>
                          <td className={`px-3 py-2 text-zinc-600 ${!isBusiness ? 'border-r border-zinc-100' : ''}`}>{item.unit}</td>
                          {!isBusiness && <td className="px-3 py-2 text-zinc-600">{(item.splitAmong || []).map((u) => u?.name || u?.email || String(u)).join(', ')}</td>}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </td>
              </tr>
            )}
          </React.Fragment>
        )}
        emptyMessage="No orders match the filter"
        mobileFiltersOpen={mobileFiltersOpen}
        onMobileFiltersOpenChange={onMobileFiltersOpenChange}
      />
    </>
  )
}

// ── InventoryMobileCard ───────────────────────────────────────────────────────
function InventoryMobileCard({ inv, p, iconBg, splitIds, memberName, onAddToCart, onDelete }) {
  const sym = useCurrencySymbol()
  const [isOpen, setIsOpen] = useState(false)
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.07)]">
      {/* collapsed row */}
      <div className="px-3 py-3 flex items-center gap-2.5">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 relative" style={{ backgroundColor: iconBg }}>
          {p.category?.icon || '📦'}
          <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-zinc-900 text-white text-[10px] font-bold flex items-center justify-center">
            {inv.quantityAvailable}
          </span>
        </div>
        <div className="flex-1 min-w-0" onClick={() => setIsOpen((o) => !o)}>
          <p className="text-sm font-semibold text-zinc-900 truncate">{p.name || '—'}</p>
          <p className="text-xs text-zinc-400 mt-0.5">{sym}{inv.price} &nbsp;|&nbsp; {p.unit || '—'}</p>
        </div>
        <div className="flex gap-0 flex-shrink-0" >
          <button onClick={onAddToCart} className="px-1 py-2 rounded-xl text-zinc-400 active:bg-zinc-100 hover:text-zinc-700">
            <ShoppingBasket size={17} />
          </button>
          <button onClick={onDelete} className="px-1 py-2 rounded-xl text-zinc-400 active:bg-zinc-100 hover:text-red-500">
            <Trash2 size={17} />
          </button>
          <button onClick={() => setIsOpen((o) => !o)} className="px-1 py-2 rounded-xl text-zinc-400 active:bg-zinc-100">
            <ChevronDown size={17} className={`transition-transform ${isOpen ? '' : '-rotate-90'}`} />
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
            <span className="text-sm text-zinc-900">{sym}{inv.price}</span>
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
function InventoryTab({ inventory = [], loading, groupMemberObjects = [], onDelete, mobileFiltersOpen, onMobileFiltersOpenChange }) {
  const { addItem } = useCartStore()
  const sym = useCurrencySymbol()
  const [filters, setFilters] = useState({ name: '', description: '', category: '', price: '', unit: '', manufacturer: '' })
  const setFilter = (k, v) => setFilters((f) => ({ ...f, [k]: v }))
  const [dropSel, setDropSel] = useState({})
  const getDrop = (key) => dropSel[key] || []
  const setDrop = (key, vals) => setDropSel((prev) => ({ ...prev, [key]: vals }))
  const dropOpts = {
    name:         [...new Set(inventory.map((inv) => inv.product?.name).filter(Boolean))],
    description:  [...new Set(inventory.map((inv) => inv.product?.description).filter(Boolean))],
    category:     [...new Set(inventory.map((inv) => inv.product?.category?.name).filter(Boolean))],
    price:        [...new Set(inventory.map((inv) => String(inv.price)).filter(Boolean))],
    unit:         [...new Set(inventory.map((inv) => inv.product?.unit).filter(Boolean))],
    manufacturer: [...new Set(inventory.map((inv) => inv.product?.manufacturer).filter(Boolean))],
  }
  const inDrop = (key, val) => getDrop(key).length === 0 || getDrop(key).includes(val)

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
    const description = inv.product?.description || ''
    const category = inv.product?.category?.name || ''
    const unit = inv.product?.unit || ''
    const manufacturer = inv.product?.manufacturer || ''
    return (
      name.toLowerCase().includes(filters.name.toLowerCase()) &&
      description.toLowerCase().includes(filters.description.toLowerCase()) &&
      category.toLowerCase().includes(filters.category.toLowerCase()) &&
      String(inv.price || '').includes(filters.price) &&
      unit.toLowerCase().includes(filters.unit.toLowerCase()) &&
      manufacturer.toLowerCase().includes(filters.manufacturer.toLowerCase()) &&
      inDrop('name', name) &&
      inDrop('description', description) &&
      inDrop('category', category) &&
      inDrop('price', String(inv.price)) &&
      inDrop('unit', unit) &&
      inDrop('manufacturer', manufacturer)
    )
  })

  const INV_COLS = [
    { key: 'name', label: 'name', filterable: true },
    { key: 'description', label: 'description', filterable: true, noDropdown: true },
    { key: 'category', label: 'category', filterable: true },
    { key: 'price', label: `price (${sym})`, filterable: true },
    { key: 'unit', label: 'unit', filterable: true },
    { key: 'manufacturer', label: 'manufacturer', filterable: true },
  ]

  return (
    <>
      <DataTableMobileFilters columns={INV_COLS} filters={filters} onFilterChange={setFilter} dropOpts={dropOpts} dropSel={dropSel} onDropChange={setDrop} open={mobileFiltersOpen} />
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

      <DataTable
        columns={[
          { key: 'qty', label: 'qty' },
          { key: 'name', label: 'name', filterable: true },
          { key: 'description', label: 'description', filterable: true, noDropdown: true },
          { key: 'category', label: 'category', filterable: true },
          { key: 'price', label: `price (${sym})`, filterable: true },
          { key: 'unit', label: 'unit', filterable: true },
          { key: 'splitAmong', label: 'splitAmong' },
          { key: 'manufacturer', label: 'manufacturer', filterable: true },
          { key: 'action', label: 'Action' },
        ]}
        data={filtered}
        filters={filters}
        onFilterChange={setFilter}
        dropOpts={dropOpts}
        dropSel={dropSel}
        onDropChange={(key, vals) => setDrop(key, vals)}
        renderRow={(inv) => {
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
                  <span className="flex items-center gap-1.5 whitespace-nowrap">
                    <span className="w-6 h-6 rounded-lg flex items-center justify-center text-sm flex-shrink-0" style={{ backgroundColor: iconBg }}>
                      {p.category.icon}
                    </span>
                    <span className="text-zinc-700 text-xs">{p.category.name}</span>
                  </span>
                ) : <span className="text-zinc-400">—</span>}
              </td>
              <td className="px-4 py-3 border-r border-zinc-100 font-semibold text-zinc-900">{sym}{inv.price}</td>
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
        }}
        emptyMessage="Nothing in stock"
        mobileFiltersOpen={mobileFiltersOpen}
        onMobileFiltersOpenChange={onMobileFiltersOpenChange}
      />
    </>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
const PERSONAL_TABS = [
  { key: 'products',  label: 'Products',  mobileLabel: 'Items'     },
  { key: 'category',  label: 'Category',  mobileLabel: 'Category'  },
  { key: 'wishlist',  label: 'Wish List', mobileLabel: 'Wishlist'  },
  { key: 'stock',     label: 'Stock',     mobileLabel: 'Stock'     },
  { key: 'recurring', label: 'Recurring', mobileLabel: 'Recurring' },
  { key: 'orders',    label: 'Orders',    mobileLabel: 'Orders'    },
]

// ── Recurring Tab (personal groups) ──────────────────────────────────────────
const REC_FREQ_LABELS = { daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly', quarterly: 'Quarterly', yearly: 'Yearly' }
const REC_STATUS_VARIANT = { active: 'success', paused: 'warning', cancelled: 'danger' }
const fmtRecDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

const RECURRING_COLS = [
  { key: 'name',        label: 'Name',      filterable: true  },
  { key: 'frequency',   label: 'Frequency', filterable: true  },
  { key: 'nextRunDate', label: 'Next Run',  filterable: false },
  { key: 'status',      label: 'Status',    filterable: true  },
  { key: 'items',       label: 'Items',     filterable: false },
  { key: 'grandTotal',  label: 'Total',     filterable: false },
  { key: 'action',      label: 'Action'                       },
]

function PersonalRecurringTab({ products = [], mobileFiltersOpen, onMobileFiltersOpenChange, onAdd }) {
  const sym = useCurrencySymbol()
  const { data: recurrings = [], isLoading } = useRecurring()
  const createRecurring = useCreateRecurring()
  const updateRecurring = useUpdateRecurring()
  const { mutate: deleteRecurring } = useDeleteRecurring()

  const [sheetOpen, setSheetOpen]     = useState(false)
  const [editing, setEditing]         = useState(null)
  const [statusSheet, setStatusSheet] = useState(null)
  const [filters, setFilters]         = useState({ name: '', frequency: '', status: '' })
  const [dropSel, setDropSel]         = useState({})

  const { register, handleSubmit, reset, control, watch, setValue, formState: { errors } } = useForm({
    defaultValues: { frequency: 'monthly', status: 'active', autoCreate: false, items: [] },
  })
  const { fields, append, remove } = useFieldArray({ control, name: 'items' })
  const watchedItems = watch('items') || []
  const calcAmount = (idx) => {
    const it = watchedItems[idx] || {}
    return (parseFloat(it.qty) || 0) * (parseFloat(it.unitPrice) || 0)
  }
  const grandTotal = watchedItems.reduce((s, _, i) => s + calcAmount(i), 0)

  const handleProductSelect = (idx, productId) => {
    const p = products.find((pr) => pr._id === productId)
    setValue(`items.${idx}.product`, productId)
    if (p) {
      setValue(`items.${idx}.description`, p.name)
      setValue(`items.${idx}.unitPrice`, p.price ?? 0)
      setValue(`items.${idx}.unit`, p.unit || '')
    }
  }

  const openCreate = () => {
    setEditing(null)
    reset({ frequency: 'monthly', status: 'active', autoCreate: false, items: [] })
    setSheetOpen(true)
  }
  if (onAdd) onAdd.current = openCreate
  const openEdit = (r) => {
    setEditing(r)
    reset({
      ...r,
      nextRunDate: r.nextRunDate ? new Date(r.nextRunDate).toISOString().slice(0, 10) : '',
      items: r.items || [],
    })
    setSheetOpen(true)
  }
  const close = () => { setSheetOpen(false); setEditing(null) }

  const setFilter = (k, v) => setFilters((f) => ({ ...f, [k]: v }))
  const getDrop = (key) => dropSel[key] || []
  const setDrop = (key, vals) => setDropSel((p) => ({ ...p, [key]: vals }))
  const inDrop = (key, val) => getDrop(key).length === 0 || getDrop(key).includes(val)

  const onSubmit = async (data) => {
    try {
      const items = (data.items || []).map((it) => ({
        product:     it.product || undefined,
        description: it.description || '',
        qty:         parseFloat(it.qty) || 0,
        unit:        it.unit || '',
        unitPrice:   parseFloat(it.unitPrice) || 0,
        taxRate:     parseFloat(it.taxRate) || 0,
        amount:      (parseFloat(it.qty) || 0) * (parseFloat(it.unitPrice) || 0),
      }))
      const payload = { ...data, items, grandTotal: items.reduce((s, it) => s + it.amount, 0) }
      delete payload.recipient
      if (editing) await updateRecurring.mutateAsync({ id: editing._id, data: payload })
      else         await createRecurring.mutateAsync(payload)
      close()
    } catch (e) { console.error(e) }
  }

  const dropOpts = {
    frequency: Object.keys(REC_FREQ_LABELS),
    status: ['active', 'paused', 'cancelled'],
  }

  const filtered = recurrings.filter((r) =>
    (r.name || '').toLowerCase().includes(filters.name.toLowerCase()) &&
    inDrop('frequency', r.frequency) &&
    inDrop('status', r.status)
  )

  if (isLoading) return <Spinner className="py-12" />

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <DataTableMobileFilters columns={RECURRING_COLS} filters={filters} onFilterChange={setFilter}
        dropOpts={dropOpts} dropSel={dropSel} onDropChange={setDrop} open={mobileFiltersOpen} />

      {/* Mobile cards */}
      <div className="flex flex-col gap-2 md:hidden pb-6">
        {recurrings.length === 0 ? (
          <EmptyState icon={Repeat} title="No recurring entries" description="Set up subscriptions, memberships or regular purchases"
            action={<Button size="sm" onClick={openCreate}><Plus size={16} /> Add Recurring</Button>} />
        ) : filtered.map((r) => (
          <div key={r._id} className="bg-white rounded-2xl border border-zinc-200 p-4">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="min-w-0">
                <p className="font-semibold text-zinc-900 truncate">{r.name}</p>
                <p className="text-xs text-zinc-400 mt-0.5">Next: {fmtRecDate(r.nextRunDate)}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <Badge variant={REC_STATUS_VARIANT[r.status] || 'default'}>{r.status}</Badge>
                <Badge variant="default">{REC_FREQ_LABELS[r.frequency] || r.frequency}</Badge>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-zinc-900">₹{(r.grandTotal || 0).toFixed(2)}</p>
              <div className="flex items-center gap-1">
                <button onClick={() => setStatusSheet(r)} className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 active:bg-zinc-100"><RefreshCw size={14} /></button>
                <button onClick={() => openEdit(r)} className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 active:bg-zinc-100"><Pencil size={14} /></button>
                <button onClick={() => { if (confirm('Delete this recurring entry?')) deleteRecurring(r._id) }} className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 active:bg-zinc-100"><Trash2 size={14} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block">
        {recurrings.length === 0 ? (
          <EmptyState icon={Repeat} title="No recurring entries" description="Set up subscriptions, memberships or regular purchases"
            action={<Button size="sm" onClick={openCreate}><Plus size={16} /> Add Recurring</Button>} />
        ) : (
          <DataTable columns={RECURRING_COLS} data={filtered} filters={filters} onFilterChange={setFilter}
            dropOpts={dropOpts} dropSel={dropSel} onDropChange={setDrop} emptyMessage="No recurring entries match filters"
            renderRow={(r) => (
              <tr key={r._id} className="border-b border-zinc-100 hover:bg-zinc-50 transition-colors">
                <td className="px-4 py-3 font-medium text-zinc-900">{r.name}</td>
                <td className="px-4 py-3"><Badge variant="default">{REC_FREQ_LABELS[r.frequency] || r.frequency}</Badge></td>
                <td className="px-4 py-3 text-sm text-zinc-500">{fmtRecDate(r.nextRunDate)}</td>
                <td className="px-4 py-3"><Badge variant={REC_STATUS_VARIANT[r.status] || 'default'}>{r.status}</Badge></td>
                <td className="px-4 py-3 text-sm text-zinc-500">{(r.items || []).length || '—'}</td>
                <td className="px-4 py-3 font-semibold text-zinc-900">{sym}{(r.grandTotal || 0).toFixed(2)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button onClick={() => setStatusSheet(r)} title="Update status" className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 active:bg-zinc-100"><RefreshCw size={14} /></button>
                    <button onClick={() => openEdit(r)} className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 active:bg-zinc-100"><Pencil size={14} /></button>
                    <button onClick={() => { if (confirm('Delete this recurring entry?')) deleteRecurring(r._id) }} className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 active:bg-zinc-100"><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            )}
          />
        )}
      </div>

      {/* Status sheet */}
      <BottomSheet open={!!statusSheet} onClose={() => setStatusSheet(null)} title="Update Status">
        <div className="grid grid-cols-3 gap-2 pb-2">
          {['active', 'paused', 'cancelled'].map((s) => (
            <button key={s} onClick={async () => { await updateRecurring.mutateAsync({ id: statusSheet._id, data: { status: s } }); setStatusSheet(null) }}
              className={['py-3 rounded-xl text-sm font-medium capitalize border transition-colors', statusSheet?.status === s ? 'bg-zinc-900 text-white border-zinc-900' : 'border-zinc-200 text-zinc-700 hover:bg-zinc-50'].join(' ')}>
              {s}
            </button>
          ))}
        </div>
      </BottomSheet>

      {/* Create / Edit sheet */}
      <BottomSheet open={sheetOpen} onClose={close} title={editing ? 'Edit Recurring' : 'New Recurring'}>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700">Name *</label>
            <input {...register('name', { required: true })} placeholder="e.g. Netflix subscription"
              className="h-11 px-3 rounded-xl border border-zinc-300 bg-white text-sm outline-none focus:border-zinc-900" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-zinc-700">Frequency</label>
              <select {...register('frequency', { required: true })} className="h-11 px-3 rounded-xl border border-zinc-300 bg-white text-sm outline-none focus:border-zinc-900">
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-zinc-700">Next Run Date *</label>
              <input type="date" {...register('nextRunDate', { required: true })}
                className="h-11 px-3 rounded-xl border border-zinc-300 bg-white text-sm outline-none focus:border-zinc-900" />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700">Status</label>
            <select {...register('status')} className="h-11 px-3 rounded-xl border border-zinc-300 bg-white text-sm outline-none focus:border-zinc-900">
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Items */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-zinc-700">Items</label>
              <button type="button" onClick={() => append({ product: '', description: '', qty: 1, unit: '', unitPrice: 0, taxRate: 0 })}
                className="text-xs text-zinc-500 hover:text-zinc-900 flex items-center gap-1">
                <Plus size={13} /> Add Item
              </button>
            </div>
            {fields.length === 0 && (
              <p className="text-xs text-zinc-400 text-center py-3 border border-dashed border-zinc-200 rounded-xl">No items — click Add Item</p>
            )}
            {fields.map((field, idx) => (
              <div key={field.id} className="border border-zinc-200 rounded-xl p-3 space-y-2 relative">
                <button type="button" onClick={() => remove(idx)} className="absolute top-2 right-2 p-1 rounded text-zinc-300 hover:text-red-500">
                  <Minus size={13} />
                </button>
                <div className="pr-6">
                  <ProductPicker
                    products={products}
                    value={watchedItems?.[idx]?.product || ''}
                    onChange={(id) => handleProductSelect(idx, id)}
                    sym={sym}
                  />
                </div>
                <input type="hidden" {...register(`items.${idx}.product`)} />
                <input {...register(`items.${idx}.description`)} placeholder="Description"
                  className="w-full h-9 rounded-lg border border-zinc-300 bg-white px-3 text-sm outline-none focus:border-zinc-900" />
                <div className="grid grid-cols-4 gap-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-zinc-500">Qty</label>
                    <input type="number" min="0" step="any" {...register(`items.${idx}.qty`)}
                      className="h-9 rounded-lg border border-zinc-300 bg-white px-3 text-sm outline-none focus:border-zinc-900" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-zinc-500">Unit</label>
                    <input placeholder="pcs" {...register(`items.${idx}.unit`)}
                      className="h-9 rounded-lg border border-zinc-300 bg-white px-3 text-sm outline-none focus:border-zinc-900" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-zinc-500">Price</label>
                    <input type="number" min="0" step="any" {...register(`items.${idx}.unitPrice`)}
                      className="h-9 rounded-lg border border-zinc-300 bg-white px-3 text-sm outline-none focus:border-zinc-900" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-zinc-500">Tax %</label>
                    <input type="number" min="0" step="any" {...register(`items.${idx}.taxRate`)}
                      className="h-9 rounded-lg border border-zinc-300 bg-white px-3 text-sm outline-none focus:border-zinc-900" />
                  </div>
                </div>
                <p className="text-xs text-zinc-400 text-right">Amount: <span className="font-semibold text-zinc-800">{sym}{calcAmount(idx).toFixed(2)}</span></p>
              </div>
            ))}
            {fields.length > 0 && (
              <p className="text-xs text-zinc-500 text-right pr-1">Total: <span className="font-semibold text-zinc-900">{sym}{grandTotal.toFixed(2)}</span></p>
            )}
          </div>

          <div className="flex items-center gap-3 py-1">
            <input type="checkbox" id="recAutoCreate" {...register('autoCreate')} className="w-4 h-4 rounded border-zinc-300 accent-zinc-900" />
            <label htmlFor="recAutoCreate" className="text-sm text-zinc-700">Auto-create order on schedule</label>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700">Notes</label>
            <input {...register('notes')} placeholder="Optional notes"
              className="h-11 px-3 rounded-xl border border-zinc-300 bg-white text-sm outline-none focus:border-zinc-900" />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={close}>Cancel</Button>
            <Button type="submit" className="flex-1" loading={createRecurring.isPending || updateRecurring.isPending}>
              {editing ? 'Save' : 'Create'}
            </Button>
          </div>
        </form>
      </BottomSheet>
    </div>
  )
}

// ── Stock tab (business only) ─────────────────────────────────────────────────
const STOCK_COLS = [
  { key: 'product',  label: 'Product',   filterable: true },
  { key: 'category', label: 'Category',  filterable: true },
  { key: 'qty',      label: 'In Stock',  filterable: true, noDropdown: true },
  { key: 'unit',     label: 'Unit' },
  { key: 'status',   label: 'Status',    filterable: true },
  { key: 'value',    label: 'Stock Value' },
  { key: 'action',   label: 'action' },
]

const LOW_STOCK_THRESHOLD = 5

function stockStatus(qty) {
  if (qty <= 0)                  return { label: 'Out of Stock', variant: 'danger' }
  if (qty <= LOW_STOCK_THRESHOLD) return { label: 'Low Stock',    variant: 'warning' }
  return                                  { label: 'In Stock',     variant: 'success' }
}

function StockTab({ inventory = [], loading, mobileFiltersOpen, onMobileFiltersOpenChange, groupMembers = [] }) {
  const sym = useCurrencySymbol()
  const updateInventory = useUpdateInventory()
  const { mutate: deleteInventory } = useDeleteInventory()
  const { addItem } = useCartStore()

  const [filters, setFilters] = useState({ product: '', category: '', qty: '', status: '' })
  const [dropSel, setDropSel] = useState({})
  const [adjustSheet, setAdjustSheet] = useState(null) // { inv, draft }

  const setFilter = (k, v) => setFilters((f) => ({ ...f, [k]: v }))
  const getDrop = (key) => dropSel[key] || []
  const setDrop = (key, vals) => setDropSel((prev) => ({ ...prev, [key]: vals }))
  const inDrop  = (key, val) => getDrop(key).length === 0 || getDrop(key).includes(val)

  const dropOpts = {
    product:  [...new Set(inventory.map((i) => i.product?.name).filter(Boolean))],
    category: [...new Set(inventory.map((i) => i.product?.category?.name).filter(Boolean))],
    status:   ['In Stock', 'Low Stock', 'Out of Stock'],
  }

  if (loading) return <div className="flex justify-center py-16"><Spinner /></div>
  if (!inventory.length) return (
    <EmptyState icon={Package} title="No stock entries" description="Stock is updated when purchase orders are received or adjusted manually" />
  )

  const filtered = inventory.filter((inv) => {
    const name     = inv.product?.name || ''
    const category = inv.product?.category?.name || ''
    const qty      = String(inv.quantityAvailable ?? 0)
    const status   = stockStatus(inv.quantityAvailable ?? 0).label
    return (
      name.toLowerCase().includes(filters.product.toLowerCase()) && inDrop('product', name) &&
      category.toLowerCase().includes(filters.category.toLowerCase()) && inDrop('category', category) &&
      qty.includes(filters.qty) &&
      (filters.status === '' || status === filters.status) && inDrop('status', status)
    )
  })

  const openAdjust = (inv) => setAdjustSheet({ inv, draft: inv.quantityAvailable ?? 0 })

  const saveAdjust = async () => {
    await updateInventory.mutateAsync({ id: adjustSheet.inv._id, data: { quantityAvailable: Number(adjustSheet.draft) } })
    setAdjustSheet(null)
  }

  return (
    <>
      <DataTableMobileFilters columns={STOCK_COLS} filters={filters} onFilterChange={setFilter} dropOpts={dropOpts} dropSel={dropSel} onDropChange={setDrop} open={mobileFiltersOpen} />

      {/* Mobile cards */}
      <div className="flex flex-col gap-2 md:hidden">
        {filtered.map((inv) => {
          const { label, variant } = stockStatus(inv.quantityAvailable ?? 0)
          const stockVal = (inv.quantityAvailable ?? 0) * (inv.price || 0)
          return (
            <div key={inv._id} className="bg-white rounded-2xl border border-zinc-200 p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold text-zinc-900 truncate">{inv.product?.name || '—'}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">{inv.product?.category?.name || 'Uncategorised'}</p>
                </div>
                <Badge variant={variant}>{label}</Badge>
              </div>
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-3">
                  <div className="text-center">
                    <p className="text-xs text-zinc-400">Qty</p>
                    <p className={`text-lg font-bold ${inv.quantityAvailable <= 0 ? 'text-red-500' : inv.quantityAvailable <= LOW_STOCK_THRESHOLD ? 'text-amber-600' : 'text-zinc-900'}`}>
                      {inv.quantityAvailable ?? 0}
                    </p>
                    <p className="text-xs text-zinc-400">{inv.product?.unit || 'units'}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-zinc-400">Value</p>
                    <p className="text-sm font-semibold text-zinc-700">{sym}{stockVal.toFixed(2)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => addItem({ ...inv.product, price: inv.price }, inv.product?.unit, 'equal', groupMembers, groupMembers)}
                    className="p-2 rounded-xl bg-zinc-900 text-white active:bg-zinc-700" title="Add to cart">
                    <ShoppingBasket size={17} />
                  </button>
                  <button onClick={() => openAdjust(inv)}
                    className="p-2 rounded-xl text-zinc-400 hover:text-zinc-700 active:bg-zinc-100" title="Adjust stock">
                    <Pencil size={17} />
                  </button>
                  <button onClick={() => { if (confirm('Delete this stock entry?')) deleteInventory(inv._id) }}
                    className="p-2 rounded-xl text-zinc-400 hover:text-red-500 active:bg-zinc-100" title="Delete">
                    <Trash2 size={17} />
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Desktop DataTable */}
      <DataTable
        columns={STOCK_COLS}
        data={filtered}
        filters={filters}
        onFilterChange={setFilter}
        dropOpts={dropOpts}
        dropSel={dropSel}
        onDropChange={setDrop}
        emptyMessage="No stock items match the filter"
        renderRow={(inv) => {
          const { label, variant } = stockStatus(inv.quantityAvailable ?? 0)
          const stockVal = (inv.quantityAvailable ?? 0) * (inv.price || 0)
          return (
            <tr key={inv._id} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50 transition-colors">
              <td className="px-4 py-3 border-r border-zinc-100 font-medium text-zinc-900">{inv.product?.name || '—'}</td>
              <td className="px-4 py-3 border-r border-zinc-100 text-sm text-zinc-500 max-w-[140px]">
                {inv.product?.category ? (
                  <span className="flex items-center gap-1.5 min-w-0">
                    <span className="w-5 h-5 rounded-md flex items-center justify-center text-xs flex-shrink-0" style={{ backgroundColor: inv.product.category.color ? `${inv.product.category.color}22` : '#f4f4f5' }}>
                      {inv.product.category.icon}
                    </span>
                    <span className="truncate">{inv.product.category.name}</span>
                  </span>
                ) : '—'}
              </td>
              <td className={`px-4 py-3 border-r border-zinc-100 text-sm font-bold ${inv.quantityAvailable <= 0 ? 'text-red-500' : inv.quantityAvailable <= LOW_STOCK_THRESHOLD ? 'text-amber-600' : 'text-zinc-900'}`}>
                {inv.quantityAvailable ?? 0}
              </td>
              <td className="px-4 py-3 border-r border-zinc-100 text-sm text-zinc-500">{inv.product?.unit || '—'}</td>
              <td className="px-4 py-3 border-r border-zinc-100"><Badge variant={variant}>{label}</Badge></td>
              <td className="px-4 py-3 border-r border-zinc-100 text-sm text-zinc-700">{sym}{stockVal.toFixed(2)}</td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-1.5 whitespace-nowrap">
                  <button onClick={() => addItem({ ...inv.product, price: inv.price }, inv.product?.unit, 'equal', groupMembers, groupMembers)}
                    className="p-1.5 rounded-lg bg-zinc-900 text-white active:bg-zinc-700" title="Add to cart">
                    <ShoppingBasket size={14} />
                  </button>
                  <button onClick={() => openAdjust(inv)}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 active:bg-zinc-100" title="Adjust stock">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => { if (confirm('Delete this stock entry?')) deleteInventory(inv._id) }}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 active:bg-zinc-100" title="Delete">
                    <Trash2 size={14} />
                  </button>
                </div>
              </td>
            </tr>
          )
        }}
      />

      {/* Adjust stock sheet */}
      {adjustSheet && createPortal(
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setAdjustSheet(null)} />
          <div className="relative bg-white w-full max-w-sm rounded-2xl shadow-2xl p-5">
            <p className="text-base font-semibold text-zinc-900 mb-1">Adjust Stock</p>
            <p className="text-sm text-zinc-500 mb-4">{adjustSheet.inv.product?.name}</p>
            <div className="flex items-center gap-3 mb-5">
              <button onClick={() => setAdjustSheet((s) => ({ ...s, draft: Math.max(0, Number(s.draft) - 1) }))}
                className="w-10 h-10 rounded-xl bg-zinc-100 text-zinc-900 text-xl font-bold flex items-center justify-center active:bg-zinc-200">−</button>
              <input
                type="number" min="0"
                value={adjustSheet.draft}
                onChange={(e) => setAdjustSheet((s) => ({ ...s, draft: e.target.value }))}
                className="flex-1 h-10 text-center text-lg font-bold border border-zinc-300 rounded-xl outline-none focus:border-zinc-900"
              />
              <button onClick={() => setAdjustSheet((s) => ({ ...s, draft: Number(s.draft) + 1 }))}
                className="w-10 h-10 rounded-xl bg-zinc-100 text-zinc-900 text-xl font-bold flex items-center justify-center active:bg-zinc-200">+</button>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setAdjustSheet(null)}
                className="flex-1 h-11 rounded-xl border border-zinc-200 text-sm font-medium text-zinc-700">Cancel</button>
              <button onClick={saveAdjust} disabled={updateInventory.isPending}
                className="flex-1 h-11 rounded-xl bg-zinc-900 text-white text-sm font-medium disabled:opacity-50 flex items-center justify-center">
                {updateInventory.isPending ? <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Save'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}

const BUSINESS_TABS = [
  { key: 'products',  label: 'Products',  mobileLabel: 'Products'  },
  { key: 'category',  label: 'Category',  mobileLabel: 'Category'  },
  { key: 'wishlist',  label: 'Wish List', mobileLabel: 'Wishlist'  },
  { key: 'orders',    label: 'Orders',    mobileLabel: 'Orders'    },
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

  const { data: groups = [] } = useGroups()
  const activeGroup = groups.find(g => g._id === activeGroupId)
  const isBusiness = activeGroup?.type === 'business'

  // Tab-level permissions
  const canSeeProducts = usePermission('products', 'products', 'view')
  const canSeeCategory = usePermission('products', 'category', 'view')
  const canSeeWishlist = usePermission('products', 'wishlist', 'view')
  const canSeeOrders   = usePermission('products', 'orders',   'view')

  const canAddProduct  = usePermission('products', 'products', 'add')
  const canEditProduct = usePermission('products', 'products', 'edit')
  const canDelProduct  = usePermission('products', 'products', 'delete')
  const canCartProduct = usePermission('products', 'products', 'cart')

  const canAddCategory = usePermission('products', 'category', 'add')
  const canEditCategory = usePermission('products', 'category', 'edit')
  const canDelCategory  = usePermission('products', 'category', 'delete')

  const TABS = (isBusiness ? BUSINESS_TABS : PERSONAL_TABS).filter((t) => {
    if (!isBusiness) return true
    if (t.key === 'products') return canSeeProducts
    if (t.key === 'category') return canSeeCategory
    if (t.key === 'wishlist') return canSeeWishlist
    if (t.key === 'orders')   return canSeeOrders
    return true
  })

  const [tab, setTab] = useState('products')
  // Reset to first visible tab when switching group type or permissions change
  useEffect(() => {
    if (TABS.length > 0 && !TABS.find((t) => t.key === tab)) {
      setTab(TABS[0].key)
    }
  }, [isBusiness, canSeeProducts, canSeeCategory, canSeeWishlist, canSeeOrders])
  const [productSheet, setProductSheet] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [categorySheet, setCategorySheet] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)

  const openAddProduct = useCallback(() => { setEditingProduct(null); setProductSheet(true) }, [])
  const openEditProduct = (p) => { setEditingProduct(p); setProductSheet(true) }
  const openAddCategory = useCallback(() => { setEditingCategory(null); setCategorySheet(true) }, [])
  const openEditCategory = (c) => { setEditingCategory(c); setCategorySheet(true) }
  const recurringAddRef = useRef(null)

  const addBtn = tab === 'products' && canAddProduct
    ? <Button size="sm" onClick={openAddProduct}><Plus size={16} /> Add product</Button>
    : tab === 'category' && canAddCategory
      ? <Button size="sm" onClick={openAddCategory}><Plus size={16} /> Add category</Button>
      : tab === 'recurring' && !isBusiness
        ? <Button size="sm" onClick={() => recurringAddRef.current?.()}><Plus size={16} /> Add Recurring</Button>
        : null

  const mobileAddFn = (tab === 'products' && canAddProduct) ? openAddProduct
    : (tab === 'category' && canAddCategory) ? openAddCategory
    : (tab === 'recurring' && !isBusiness) ? () => recurringAddRef.current?.()
    : null
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

  return (
    <>
      <TopBar
        title="Products"
        filterIcon={<DataTableFilterIcon open={mobileFiltersOpen} onChange={setMobileFiltersOpen} />}
        right={mobileAddFn && (
          <button onClick={mobileAddFn} className="w-9 h-9 flex items-center justify-center rounded-full bg-zinc-900 text-white active:bg-zinc-700 transition-colors">
            <Plus size={20} />
          </button>
        )}
      />

      <div className="px-4 pt-0 pb-4 md:px-0 md:py-0 md:pb-4 md:flex md:flex-col md:flex-1 md:min-h-0">
        <div className="flex items-center gap-3 flex-shrink-0 py-2 sticky z-20 -mx-4 px-4 bg-[#f5f5f5] md:static md:bg-transparent md:mx-0 md:px-0 md:py-0 md:mb-4 md:justify-between" style={{ top: 'calc(3.5rem + env(safe-area-inset-top, 0px))' }}>
          <Tabs tabs={TABS} active={tab} onChange={setTab} />
          <PageActions add={addBtn} />
        </div>

        <div className="md:flex-1 md:min-h-0 md:flex md:flex-col">
          {tab === 'products' && (
            <ProductsListTab
              products={products}
              categories={categories}
              loading={loadingProducts}
              onEdit={openEditProduct}
              onDelete={(id) => deleteProduct(id)}
              groupMembers={groupMembers}
              groupMemberObjects={groupMemberObjects}
              mobileFiltersOpen={mobileFiltersOpen}
              onMobileFiltersOpenChange={setMobileFiltersOpen}
              isBusiness={isBusiness}
              canEdit={canEditProduct}
              canDelete={canDelProduct}
              canCart={canCartProduct}
            />
          )}

          {tab === 'category' && (
            <CategoryTab
              categories={categories}
              products={products}
              loading={loadingCats}
              onEdit={openEditCategory}
              onDelete={(id) => deleteCategory(id)}
              mobileFiltersOpen={mobileFiltersOpen}
              onMobileFiltersOpenChange={setMobileFiltersOpen}
              canEdit={canEditCategory}
              canDelete={canDelCategory}
            />
          )}

          {tab === 'wishlist' && (
            <WishlistTab
              wishlists={wishlists}
              groupMembers={groupMembers}
              groupMemberObjects={groupMemberObjects}
              onDelete={(id) => deleteWishlist(id)}
              mobileFiltersOpen={mobileFiltersOpen}
              onMobileFiltersOpenChange={setMobileFiltersOpen}
              isBusiness={isBusiness}
            />
          )}

          {tab === 'stock' && (
            <StockTab
              inventory={inventory}
              loading={loadingInventory}
              groupMembers={groupMembers}
              mobileFiltersOpen={mobileFiltersOpen}
              onMobileFiltersOpenChange={setMobileFiltersOpen}
            />
          )}

          {tab === 'recurring' && (
            <PersonalRecurringTab
              products={products}
              mobileFiltersOpen={mobileFiltersOpen}
              onMobileFiltersOpenChange={setMobileFiltersOpen}
              onAdd={recurringAddRef}
            />
          )}

          {tab === 'orders' && (
            <OrdersTab
              mobileFiltersOpen={mobileFiltersOpen}
              onMobileFiltersOpenChange={setMobileFiltersOpen}
              isBusiness={isBusiness}
            />
          )}

        </div>
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
