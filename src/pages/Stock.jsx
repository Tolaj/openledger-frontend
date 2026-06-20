import { useState, useRef } from 'react'
import { Trash2, ShoppingBasket, Package, TrendingUp, TrendingDown, Plus } from 'lucide-react'
import DataTable, { DataTableMobileFilters, DataTableFilterIcon } from '../components/ui/DataTable'
import BottomSheet from '../components/ui/BottomSheet'
import TopBar from '../components/layout/TopBar'
import PageActions from '../components/layout/PageActions'
import Tabs from '../components/ui/Tabs'
import Badge from '../components/ui/Badge'
import EmptyState from '../components/ui/EmptyState'
import Spinner from '../components/ui/Spinner'
import Button from '../components/ui/Button'
import { useInventory, useDeleteInventory } from '../hooks/useInventory'
import { useStockMovements, useCreateAdjustment } from '../hooks/useStockMovements'
import { useProducts } from '../hooks/useProducts'
import useCartStore from '../store/cartStore'
import useGroupStore from '../store/groupStore'
import { useGroup } from '../hooks/useGroups'
import { useCurrencySymbol } from '../hooks/useCurrency'

// ── Constants ─────────────────────────────────────────────────────────────────
const LOW_STOCK_THRESHOLD = 5

const TABS = [
  { key: 'levels',      label: 'Levels'      },
  { key: 'movements',   label: 'Movements'   },
  { key: 'adjustments', label: 'Adjustments' },
]

function stockStatus(qty) {
  if (qty <= 0)                   return { label: 'Out of Stock', variant: 'danger'  }
  if (qty <= LOW_STOCK_THRESHOLD) return { label: 'Low Stock',    variant: 'warning' }
  return                                  { label: 'In Stock',     variant: 'success' }
}

function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

// ── Levels Tab ────────────────────────────────────────────────────────────────
const LEVEL_COLS = [
  { key: 'product',  label: 'Product',   filterable: true },
  { key: 'category', label: 'Category',  filterable: true },
  { key: 'qty',      label: 'In Stock',  filterable: true, noDropdown: true },
  { key: 'unit',     label: 'Unit' },
  { key: 'status',   label: 'Status',    filterable: true },
  { key: 'value',    label: 'Stock Value' },
  { key: 'action',   label: 'action' },
]

function LevelsTab({ mobileFiltersOpen, onMobileFiltersOpenChange, groupMembers }) {
  const sym = useCurrencySymbol()
  const { data: inventory = [], isLoading } = useInventory()
  const { mutate: deleteInventory } = useDeleteInventory()
  const { addItem } = useCartStore()

  const [filters, setFilters] = useState({ product: '', category: '', qty: '', status: '' })
  const [dropSel, setDropSel] = useState({})

  const setFilter = (k, v) => setFilters((f) => ({ ...f, [k]: v }))
  const getDrop   = (key)   => dropSel[key] || []
  const setDrop   = (key, vals) => setDropSel((prev) => ({ ...prev, [key]: vals }))
  const inDrop    = (key, val)  => getDrop(key).length === 0 || getDrop(key).includes(val)

  const dropOpts = {
    product:  [...new Set(inventory.map((i) => i.product?.name).filter(Boolean))],
    category: [...new Set(inventory.map((i) => i.product?.category?.name).filter(Boolean))],
    status:   ['In Stock', 'Low Stock', 'Out of Stock'],
  }

  if (isLoading) return <Spinner className="py-12" />
  if (!inventory.length) return (
    <EmptyState icon={Package} title="No stock entries"
      description="Stock is updated automatically when purchase orders are received or sales are delivered" />
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

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <DataTableMobileFilters columns={LEVEL_COLS} filters={filters} onFilterChange={setFilter}
        dropOpts={dropOpts} dropSel={dropSel} onDropChange={setDrop} open={mobileFiltersOpen} />

      {/* Mobile cards */}
      <div className="flex flex-col gap-2 md:hidden pb-6">
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
                    <ShoppingBasket size={15} />
                  </button>
                  <button onClick={() => { if (confirm('Delete this stock entry?')) deleteInventory(inv._id) }}
                    className="p-2 rounded-xl text-zinc-400 hover:text-red-500 active:bg-zinc-100" title="Delete">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Desktop table */}
      <DataTable columns={LEVEL_COLS} data={filtered} filters={filters} onFilterChange={setFilter}
        dropOpts={dropOpts} dropSel={dropSel} onDropChange={setDrop} emptyMessage="No stock items match the filter"
        renderRow={(inv) => {
          const { label, variant } = stockStatus(inv.quantityAvailable ?? 0)
          const stockVal = (inv.quantityAvailable ?? 0) * (inv.price || 0)
          return (
            <tr key={inv._id} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50 transition-colors">
              <td className="px-4 py-3 border-r border-zinc-100 font-medium text-zinc-900">{inv.product?.name || '—'}</td>
              <td className="px-4 py-3 border-r border-zinc-100 text-sm text-zinc-500">
                {inv.product?.category ? (
                  <span className="flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-md flex items-center justify-center text-xs flex-shrink-0"
                      style={{ backgroundColor: inv.product.category.color ? `${inv.product.category.color}22` : '#f4f4f5' }}>
                      {inv.product.category.icon}
                    </span>
                    {inv.product.category.name}
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
                <div className="flex items-center gap-1.5">
                  <button onClick={() => addItem({ ...inv.product, price: inv.price }, inv.product?.unit, 'equal', groupMembers, groupMembers)}
                    className="p-1.5 rounded-lg bg-zinc-900 text-white active:bg-zinc-700" title="Add to cart">
                    <ShoppingBasket size={14} />
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
    </div>
  )
}

// ── Movements Tab ─────────────────────────────────────────────────────────────
const SOURCE_LABEL = { grn: 'GRN', delivery: 'Delivery', adjustment: 'Adjustment' }
const SOURCE_VARIANT = { grn: 'success', delivery: 'warning', adjustment: 'default' }

const MOVEMENT_COLS = [
  { key: 'date',      label: 'Date',      filterable: false },
  { key: 'product',   label: 'Product',   filterable: true  },
  { key: 'change',    label: 'Change',    filterable: false },
  { key: 'qtyAfter',  label: 'Qty After', filterable: false },
  { key: 'source',    label: 'Source',    filterable: true  },
  { key: 'ref',       label: 'Reference', filterable: false },
  { key: 'reason',    label: 'Reason',    filterable: false },
]

function MovementsTab({ mobileFiltersOpen, onMobileFiltersOpenChange }) {
  const { data: movements = [], isLoading } = useStockMovements()
  const [filters, setFilters] = useState({ product: '', source: '' })
  const [dropSel, setDropSel] = useState({})

  const setFilter = (k, v) => setFilters((f) => ({ ...f, [k]: v }))
  const getDrop   = (key)   => dropSel[key] || []
  const setDrop   = (key, vals) => setDropSel((prev) => ({ ...prev, [key]: vals }))
  const inDrop    = (key, val)  => getDrop(key).length === 0 || getDrop(key).includes(val)

  const dropOpts = {
    product: [...new Set(movements.map((m) => m.product?.name).filter(Boolean))],
    source:  ['grn', 'delivery', 'adjustment'],
  }

  if (isLoading) return <Spinner className="py-12" />
  if (!movements.length) return (
    <EmptyState icon={Package} title="No movements yet"
      description="Stock movements are recorded automatically when GRNs are created, deliveries are made, or adjustments are logged" />
  )

  const filtered = movements.filter((m) =>
    (m.product?.name || '').toLowerCase().includes(filters.product.toLowerCase()) &&
    inDrop('product', m.product?.name) &&
    (filters.source === '' || m.sourceType === filters.source) &&
    inDrop('source', m.sourceType)
  )

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <DataTableMobileFilters columns={MOVEMENT_COLS} filters={filters} onFilterChange={setFilter}
        dropOpts={dropOpts} dropSel={dropSel} onDropChange={setDrop} open={mobileFiltersOpen} />

      {/* Mobile cards */}
      <div className="flex flex-col gap-2 md:hidden pb-6">
        {filtered.map((m) => (
          <div key={m._id} className="bg-white rounded-2xl border border-zinc-200 p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-semibold text-zinc-900 truncate">{m.product?.name || '—'}</p>
                <p className="text-xs text-zinc-400 mt-0.5">{fmtDate(m.createdAt)}</p>
              </div>
              <Badge variant={SOURCE_VARIANT[m.sourceType] || 'default'}>{SOURCE_LABEL[m.sourceType] || m.sourceType}</Badge>
            </div>
            <div className="flex items-center gap-4 mt-3">
              <div className="flex items-center gap-1.5">
                {m.change > 0
                  ? <TrendingUp size={14} className="text-emerald-500" />
                  : <TrendingDown size={14} className="text-red-500" />}
                <span className={`text-sm font-bold ${m.change > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {m.change > 0 ? '+' : ''}{m.change}
                </span>
              </div>
              <span className="text-xs text-zinc-500">After: <strong className="text-zinc-800">{m.qtyAfter}</strong></span>
              {m.sourceRef && <span className="text-xs text-zinc-400 font-mono">{m.sourceRef}</span>}
            </div>
            {m.reason && <p className="text-xs text-zinc-400 mt-1">Reason: {m.reason}</p>}
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <DataTable columns={MOVEMENT_COLS} data={filtered} filters={filters} onFilterChange={setFilter}
        dropOpts={dropOpts} dropSel={dropSel} onDropChange={setDrop} emptyMessage="No movements match the filter"
        renderRow={(m) => (
          <tr key={m._id} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50 transition-colors">
            <td className="px-4 py-3 border-r border-zinc-100 text-sm text-zinc-500 whitespace-nowrap">{fmtDate(m.createdAt)}</td>
            <td className="px-4 py-3 border-r border-zinc-100 font-medium text-zinc-900">{m.product?.name || '—'}</td>
            <td className="px-4 py-3 border-r border-zinc-100">
              <span className={`flex items-center gap-1 text-sm font-bold ${m.change > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {m.change > 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                {m.change > 0 ? '+' : ''}{m.change}
              </span>
            </td>
            <td className="px-4 py-3 border-r border-zinc-100 text-sm font-semibold text-zinc-700">{m.qtyAfter}</td>
            <td className="px-4 py-3 border-r border-zinc-100">
              <Badge variant={SOURCE_VARIANT[m.sourceType] || 'default'}>{SOURCE_LABEL[m.sourceType] || m.sourceType}</Badge>
            </td>
            <td className="px-4 py-3 border-r border-zinc-100 font-mono text-xs text-zinc-500">{m.sourceRef || '—'}</td>
            <td className="px-4 py-3 text-sm text-zinc-500 capitalize">{m.reason || '—'}</td>
          </tr>
        )}
      />
    </div>
  )
}

// ── Adjustments Tab ───────────────────────────────────────────────────────────
const REASONS = ['damage', 'write-off', 'recount', 'return', 'other']

const ADJ_COLS = [
  { key: 'date',    label: 'Date',    filterable: false },
  { key: 'product', label: 'Product', filterable: true  },
  { key: 'type',    label: 'Type',    filterable: true  },
  { key: 'change',  label: 'Change',  filterable: false },
  { key: 'reason',  label: 'Reason',  filterable: true  },
  { key: 'notes',   label: 'Notes',   filterable: false },
]

function AdjustmentsTab({ onAdd }) {
  const { data: movements = [], isLoading } = useStockMovements()
  const { data: products = [], isLoading: loadingProducts } = useProducts()
  const createAdjustment = useCreateAdjustment()

  const [sheetOpen, setSheetOpen] = useState(false)
  const [product, setProduct] = useState('')
  const [type,    setType]    = useState('add')
  const [qty,     setQty]     = useState('')
  const [reason,  setReason]  = useState('recount')
  const [notes,   setNotes]   = useState('')
  const [error,   setError]   = useState('')

  const tracked = products.filter((p) => p.inventory)
  const adjustments = movements.filter((m) => m.sourceType === 'adjustment')

  const [filters, setFilters] = useState({ product: '', type: '', reason: '' })
  const [dropSel, setDropSel] = useState({})
  const setFilter = (k, v) => setFilters((f) => ({ ...f, [k]: v }))
  const getDrop   = (key)   => dropSel[key] || []
  const setDrop   = (key, vals) => setDropSel((p) => ({ ...p, [key]: vals }))
  const inDrop    = (key, val)  => getDrop(key).length === 0 || getDrop(key).includes(val)

  const dropOpts = {
    product: [...new Set(adjustments.map((m) => m.product?.name).filter(Boolean))],
    type:    ['Add', 'Remove'],
    reason:  REASONS,
  }

  const openCreate = () => {
    setProduct(''); setQty(''); setReason('recount'); setNotes(''); setError('')
    setSheetOpen(true)
  }
  onAdd.current = openCreate

  const handleSubmit = async () => {
    setError('')
    if (!product)         return setError('Select a product')
    if (!qty || qty <= 0) return setError('Enter a valid quantity')
    const change = type === 'add' ? Number(qty) : -Number(qty)
    try {
      await createAdjustment.mutateAsync({ product, change, reason, notes })
      setSheetOpen(false)
    } catch (err) {
      setError(err?.response?.data?.error || err.message || 'Failed to save adjustment')
    }
  }

  const filtered = adjustments.filter((m) => {
    const name   = m.product?.name || ''
    const typeLabel = m.change > 0 ? 'Add' : 'Remove'
    return (
      name.toLowerCase().includes(filters.product.toLowerCase()) && inDrop('product', name) &&
      (filters.type === '' || typeLabel === filters.type) && inDrop('type', typeLabel) &&
      (filters.reason === '' || m.reason === filters.reason) && inDrop('reason', m.reason)
    )
  })

  const sel = 'h-11 w-full px-3 rounded-xl border border-zinc-300 bg-white text-sm outline-none focus:border-zinc-900'

  if (isLoading) return <Spinner className="py-12" />
  if (!adjustments.length) return (
    <>
      <EmptyState icon={Package} title="No adjustments yet"
        description="Log damage, write-offs, recounts, or returns"
        action={<Button size="sm" onClick={openCreate}><Plus size={16} /> New Adjustment</Button>} />
      <AdjustmentSheet open={sheetOpen} onClose={() => setSheetOpen(false)} tracked={tracked}
        loadingProducts={loadingProducts} product={product} setProduct={setProduct}
        type={type} setType={setType} qty={qty} setQty={setQty}
        reason={reason} setReason={setReason} notes={notes} setNotes={setNotes}
        error={error} onSubmit={handleSubmit} isPending={createAdjustment.isPending} sel={sel} />
    </>
  )

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <DataTableMobileFilters columns={ADJ_COLS} filters={filters} onFilterChange={setFilter}
        dropOpts={dropOpts} dropSel={dropSel} onDropChange={setDrop} />

      {/* Mobile cards */}
      <div className="flex flex-col gap-2 md:hidden pb-6">
        {filtered.map((m) => (
          <div key={m._id} className="bg-white rounded-2xl border border-zinc-200 p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-semibold text-zinc-900 truncate">{m.product?.name || '—'}</p>
                <p className="text-xs text-zinc-400 mt-0.5">{fmtDate(m.createdAt)}</p>
              </div>
              <span className={`flex items-center gap-1 text-sm font-bold ${m.change > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {m.change > 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                {m.change > 0 ? '+' : ''}{m.change}
              </span>
            </div>
            {m.reason && <p className="text-xs text-zinc-400 mt-2 capitalize">Reason: {m.reason}</p>}
            {m.notes  && <p className="text-xs text-zinc-400 mt-0.5">{m.notes}</p>}
          </div>
        ))}
      </div>

      <DataTable columns={ADJ_COLS} data={filtered} filters={filters} onFilterChange={setFilter}
        dropOpts={dropOpts} dropSel={dropSel} onDropChange={setDrop} emptyMessage="No adjustments match the filter"
        renderRow={(m) => (
          <tr key={m._id} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50 transition-colors">
            <td className="px-4 py-3 border-r border-zinc-100 text-sm text-zinc-500 whitespace-nowrap">{fmtDate(m.createdAt)}</td>
            <td className="px-4 py-3 border-r border-zinc-100 font-medium text-zinc-900">{m.product?.name || '—'}</td>
            <td className="px-4 py-3 border-r border-zinc-100">
              <Badge variant={m.change > 0 ? 'success' : 'danger'}>{m.change > 0 ? 'Add' : 'Remove'}</Badge>
            </td>
            <td className={`px-4 py-3 border-r border-zinc-100 text-sm font-bold ${m.change > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {m.change > 0 ? '+' : ''}{m.change}
            </td>
            <td className="px-4 py-3 border-r border-zinc-100 text-sm text-zinc-500 capitalize">{m.reason || '—'}</td>
            <td className="px-4 py-3 text-sm text-zinc-400">{m.notes || '—'}</td>
          </tr>
        )}
      />

      <AdjustmentSheet open={sheetOpen} onClose={() => setSheetOpen(false)} tracked={tracked}
        loadingProducts={loadingProducts} product={product} setProduct={setProduct}
        type={type} setType={setType} qty={qty} setQty={setQty}
        reason={reason} setReason={setReason} notes={notes} setNotes={setNotes}
        error={error} onSubmit={handleSubmit} isPending={createAdjustment.isPending} sel={sel} />
    </div>
  )
}

function AdjustmentSheet({ open, onClose, tracked, loadingProducts, product, setProduct, type, setType, qty, setQty, reason, setReason, notes, setNotes, error, onSubmit, isPending, sel }) {
  return (
    <BottomSheet open={open} onClose={onClose} title="New Adjustment"
      footer={<Button fullWidth loading={isPending} onClick={onSubmit}>Save Adjustment</Button>}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-zinc-700">Product *</label>
          {loadingProducts ? <Spinner /> : (
            <select value={product} onChange={(e) => setProduct(e.target.value)} className={sel}>
              <option value="">— Select product —</option>
              {tracked.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
            </select>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700">Type</label>
            <select value={type} onChange={(e) => setType(e.target.value)} className={sel}>
              <option value="add">Add (stock in)</option>
              <option value="remove">Remove (stock out)</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700">Quantity *</label>
            <input type="number" min="1" step="1" value={qty} onChange={(e) => setQty(e.target.value)}
              placeholder="0" className={sel} />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-zinc-700">Reason</label>
          <select value={reason} onChange={(e) => setReason(e.target.value)} className={sel}>
            {REASONS.map((r) => <option key={r} value={r} className="capitalize">{r}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-zinc-700">Notes (optional)</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Additional context..."
            className="w-full px-3 py-2.5 rounded-xl border border-zinc-300 bg-white text-sm outline-none focus:border-zinc-900 resize-none" />
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>
    </BottomSheet>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function Stock() {
  const [tab, setTab] = useState('levels')
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const onAddRef = useRef(null)

  const activeGroupId = useGroupStore((s) => s.activeGroupId)
  const { data: group } = useGroup(activeGroupId)
  const groupMembers = (group?.members || []).map((m) => String(m._id || m))

  const hasFilters = tab !== 'adjustments'
  const addBtn = tab === 'adjustments'
    ? <Button size="sm" onClick={() => onAddRef.current?.()}><Plus size={16} /> New Adjustment</Button>
    : null

  return (
    <>
      <TopBar
        title="Stock"
        filterIcon={hasFilters && <DataTableFilterIcon open={mobileFiltersOpen} onChange={setMobileFiltersOpen} />}
        right={tab === 'adjustments' && (
          <button onClick={() => onAddRef.current?.()} className="p-2 rounded-xl active:bg-zinc-100">
            <Plus size={20} />
          </button>
        )}
      />

      <div className="px-4 pt-0 pb-5 md:px-0 md:py-0 md:pb-4 md:flex md:flex-col md:flex-1 md:min-h-0">
        <div className="flex items-center justify-between gap-4 flex-shrink-0 py-4 md:py-0 md:mb-4">
          <Tabs tabs={TABS} active={tab} onChange={setTab} />
          <PageActions add={addBtn} />
        </div>

        <div className="md:flex-1 md:min-h-0 md:flex md:flex-col">
          {tab === 'levels'      && <LevelsTab      mobileFiltersOpen={mobileFiltersOpen} onMobileFiltersOpenChange={setMobileFiltersOpen} groupMembers={groupMembers} />}
          {tab === 'movements'   && <MovementsTab   mobileFiltersOpen={mobileFiltersOpen} onMobileFiltersOpenChange={setMobileFiltersOpen} />}
          {tab === 'adjustments' && <AdjustmentsTab onAdd={onAddRef} />}
        </div>
      </div>
    </>
  )
}
