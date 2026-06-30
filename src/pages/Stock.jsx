import { useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Trash2, ShoppingBasket, Package, TrendingUp, TrendingDown, Plus, ChevronDown, Pencil, Check, X, Clock, Bell, Zap, History } from 'lucide-react'
import DataTable, { DataTableMobileFilters, DataTableFilterIcon } from '../components/ui/DataTable'
import BottomSheet from '../components/ui/BottomSheet'
import TopBar from '../components/layout/TopBar'
import PageActions from '../components/layout/PageActions'
import Tabs from '../components/ui/Tabs'
import Badge from '../components/ui/Badge'
import EmptyState from '../components/ui/EmptyState'
import Spinner from '../components/ui/Spinner'
import Button from '../components/ui/Button'
import { useInventory, useDeleteInventory, useUpdateInventory } from '../hooks/useInventory'
import { useStockMovements, useCreateAdjustment } from '../hooks/useStockMovements'
import { useRecurringLogs } from '../hooks/useRecurring'
import { useProducts } from '../hooks/useProducts'
import useCartStore from '../store/cartStore'
import useGroupStore from '../store/groupStore'
import { useGroup, useGroups } from '../hooks/useGroups'
import { useCurrencySymbol } from '../hooks/useCurrency'
import { usePermission } from '../hooks/usePermission'

// ── Constants ─────────────────────────────────────────────────────────────────
const LOW_STOCK_THRESHOLD = 5

const ALL_TABS = [
  { key: 'levels',      label: 'Levels'      },
  { key: 'movements',   label: 'Movements'   },
  { key: 'adjustments', label: 'Adjustments' },
  { key: 'activity',    label: 'Activity'    },
]

// Recurring notification action → label, colour, icon
const ACTION_META = {
  auto:      { label: 'Auto-deducted', variant: 'default', icon: Zap,   chip: 'bg-zinc-100 text-zinc-600' },
  notified:  { label: 'Deducted',      variant: 'success', icon: Check, chip: 'bg-emerald-50 text-emerald-600' },
  confirmed: { label: 'Confirmed',     variant: 'success', icon: Check, chip: 'bg-emerald-50 text-emerald-600' },
  asked:     { label: 'Asked',         variant: 'warning', icon: Bell,  chip: 'bg-blue-50 text-blue-600' },
  snoozed:   { label: 'Snoozed',       variant: 'warning', icon: Clock, chip: 'bg-amber-50 text-amber-600' },
  skipped:   { label: 'Skipped',       variant: 'danger',  icon: X,     chip: 'bg-red-50 text-red-500' },
  expired:   { label: 'Missed',        variant: 'danger',  icon: X,     chip: 'bg-red-50 text-red-500' },
}

function fmtWhen(d) {
  if (!d) return '—'
  return new Date(d).toLocaleString(undefined, { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

function ActivityTab() {
  const { data: logs = [], isLoading } = useRecurringLogs()

  if (isLoading) return <Spinner className="py-12" />
  if (!logs.length) return (
    <EmptyState icon={History} title="No activity yet"
      description="Actions on your recurring stock reminders — confirmed, snoozed or skipped — will show up here." />
  )

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Mobile */}
      <div className="flex flex-col gap-2 md:hidden pb-6">
        {logs.map((l) => {
          const m = ACTION_META[l.action] || ACTION_META.auto
          const Icon = m.icon
          return (
            <div key={l._id} className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.07)] px-3 py-3 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${m.chip}`}><Icon size={17} /></div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-zinc-900 truncate">{l.recurringName || 'Recurring'}</p>
                <p className="text-xs text-zinc-400 truncate">{l.summary || fmtWhen(l.scheduledFor)}</p>
              </div>
              <div className="text-right shrink-0">
                <Badge variant={m.variant}>{m.label}</Badge>
                <p className="text-[10px] text-zinc-400 mt-1">{fmtWhen(l.createdAt)}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Desktop */}
      <div className="hidden md:block bg-white rounded-2xl border border-zinc-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 text-zinc-500">
            <tr>
              <th className="text-left font-medium px-4 py-2.5">Recurring</th>
              <th className="text-left font-medium px-4 py-2.5">Action</th>
              <th className="text-left font-medium px-4 py-2.5">Detail</th>
              <th className="text-left font-medium px-4 py-2.5">When</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((l) => {
              const m = ACTION_META[l.action] || ACTION_META.auto
              return (
                <tr key={l._id} className="border-t border-zinc-100 hover:bg-zinc-50 transition-colors">
                  <td className="px-4 py-2.5 font-medium text-zinc-900">{l.recurringName || 'Recurring'}</td>
                  <td className="px-4 py-2.5"><Badge variant={m.variant}>{m.label}</Badge></td>
                  <td className="px-4 py-2.5 text-zinc-500">{l.summary || '—'}</td>
                  <td className="px-4 py-2.5 text-zinc-500">{fmtWhen(l.createdAt)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

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

function LevelMobileCard({ inv, sym, groupMembers, onDelete, onAddToCart, onAdjust }) {
  const [isOpen, setIsOpen] = useState(false)
  const { label, variant } = stockStatus(inv.quantityAvailable ?? 0)
  const stockVal = (inv.quantityAvailable ?? 0) * (inv.price || 0)
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.07)]">
      <div className="px-3 py-3 flex items-center gap-2.5">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-xl"
          style={{ backgroundColor: inv.product?.category?.color ? `${inv.product.category.color}22` : '#f4f4f5' }}>
          {inv.product?.category?.icon || '📦'}
        </div>
        <div className="flex-1 min-w-0" onClick={() => setIsOpen((v) => !v)}>
          <p className="text-sm font-semibold text-zinc-900 truncate">{inv.product?.name || '—'}</p>
          <p className="text-xs text-zinc-400 mt-0.5">{inv.product?.category?.name || 'Uncategorised'}&nbsp;·&nbsp;{sym}{stockVal.toFixed(2)}</p>
        </div>
        <div className="flex items-center gap-0 flex-shrink-0">
          <Badge variant={variant}>{label}</Badge>
          <button onClick={() => onAddToCart(inv)} className="px-1 py-2 rounded-xl text-zinc-400 active:bg-zinc-100 hover:text-zinc-700 ml-1">
            <ShoppingBasket size={17} />
          </button>
          {onAdjust && (
            <button onClick={() => onAdjust(inv)} className="px-1 py-2 rounded-xl text-zinc-400 active:bg-zinc-100 hover:text-zinc-700" title="Adjust stock">
              <Pencil size={17} />
            </button>
          )}
          <button onClick={() => onDelete(inv._id)} className="px-1 py-2 rounded-xl text-zinc-400 active:bg-zinc-100 hover:text-red-500">
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
            <span className="text-xs text-zinc-400 w-24 flex-shrink-0">Quantity</span>
            <span className={`text-sm font-bold ${inv.quantityAvailable <= 0 ? 'text-red-500' : inv.quantityAvailable <= LOW_STOCK_THRESHOLD ? 'text-amber-600' : 'text-zinc-900'}`}>
              {inv.quantityAvailable ?? 0} {inv.product?.unit || 'units'}
            </span>
          </div>
          <div className="flex items-center px-4 py-2.5">
            <span className="text-xs text-zinc-400 w-24 flex-shrink-0">Price</span>
            <span className="text-sm text-zinc-900">{sym}{(inv.price || 0).toFixed(2)}</span>
          </div>
          <div className="flex items-center px-4 py-2.5">
            <span className="text-xs text-zinc-400 w-24 flex-shrink-0">Stock Value</span>
            <span className="text-sm font-semibold text-zinc-900">{sym}{stockVal.toFixed(2)}</span>
          </div>
          {inv.lastUpdated && (
            <div className="flex items-center px-4 py-2.5">
              <span className="text-xs text-zinc-400 w-24 flex-shrink-0">Updated</span>
              <span className="text-sm text-zinc-900">{new Date(inv.lastUpdated).toLocaleDateString()}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function LevelsTab({ mobileFiltersOpen, onMobileFiltersOpenChange, groupMembers, allowAdjust = false }) {
  const sym = useCurrencySymbol()
  const { data: inventory = [], isLoading } = useInventory()
  const { mutate: deleteInventory } = useDeleteInventory()
  const updateInventory = useUpdateInventory()
  const { addItem } = useCartStore()

  const [filters, setFilters] = useState({ product: '', category: '', qty: '', status: '' })
  const [dropSel, setDropSel] = useState({})
  const [adjustSheet, setAdjustSheet] = useState(null) // { inv, draft }
  const openAdjust = (inv) => setAdjustSheet({ inv, draft: inv.quantityAvailable ?? 0 })
  const saveAdjust = async () => {
    await updateInventory.mutateAsync({ id: adjustSheet.inv._id, data: { quantityAvailable: Number(adjustSheet.draft) } })
    setAdjustSheet(null)
  }

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
        {filtered.map((inv) => (
          <LevelMobileCard key={inv._id} inv={inv} sym={sym} groupMembers={groupMembers}
            onDelete={(id) => { if (confirm('Delete this stock entry?')) deleteInventory(id) }}
            onAddToCart={(inv) => addItem({ ...inv.product, price: inv.price }, inv.product?.unit, 'equal', groupMembers, groupMembers)}
            onAdjust={allowAdjust ? openAdjust : undefined}
          />
        ))}
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
                  {allowAdjust && (
                    <button onClick={() => openAdjust(inv)}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 active:bg-zinc-100" title="Adjust stock">
                      <Pencil size={14} />
                    </button>
                  )}
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

      {/* Adjust stock sheet (personal) */}
      {adjustSheet && createPortal(
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setAdjustSheet(null)} />
          <div className="relative bg-white w-full max-w-sm rounded-2xl shadow-2xl p-5">
            <p className="text-base font-semibold text-zinc-900 mb-1">Adjust Stock</p>
            <p className="text-sm text-zinc-500 mb-4">{adjustSheet.inv.product?.name}</p>
            <div className="flex items-center gap-3 mb-5">
              <button onClick={() => setAdjustSheet((s) => ({ ...s, draft: Math.max(0, Number(s.draft) - 1) }))}
                className="w-10 h-10 rounded-xl bg-zinc-100 text-zinc-900 text-xl font-bold flex items-center justify-center active:bg-zinc-200">−</button>
              <input type="number" min="0" value={adjustSheet.draft}
                onChange={(e) => setAdjustSheet((s) => ({ ...s, draft: e.target.value }))}
                className="flex-1 h-10 text-center text-lg font-bold border border-zinc-300 rounded-xl outline-none focus:border-zinc-900" />
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

function MovementMobileCard({ m }) {
  const [isOpen, setIsOpen] = useState(false)
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.07)]">
      <div className="px-3 py-3 flex items-center gap-2.5">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${m.change > 0 ? 'bg-emerald-50' : 'bg-red-50'}`}>
          {m.change > 0 ? <TrendingUp size={18} className="text-emerald-500" /> : <TrendingDown size={18} className="text-red-500" />}
        </div>
        <div className="flex-1 min-w-0" onClick={() => setIsOpen((v) => !v)}>
          <p className="text-sm font-semibold text-zinc-900 truncate">{m.product?.name || '—'}</p>
          <p className="text-xs text-zinc-400 mt-0.5">{fmtDate(m.createdAt)}&nbsp;·&nbsp;
            <span className={`font-semibold ${m.change > 0 ? 'text-emerald-600' : 'text-red-600'}`}>{m.change > 0 ? '+' : ''}{m.change}</span>
          </p>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <Badge variant={SOURCE_VARIANT[m.sourceType] || 'default'}>{SOURCE_LABEL[m.sourceType] || m.sourceType}</Badge>
          <button onClick={() => setIsOpen((v) => !v)} className="px-1 py-2 rounded-xl text-zinc-400 active:bg-zinc-100">
            <ChevronDown size={17} className={`transition-transform ${isOpen ? '' : '-rotate-90'}`} />
          </button>
        </div>
      </div>
      {isOpen && (
        <div className="border-t border-zinc-100 divide-y divide-zinc-100">
          <div className="flex items-center px-4 py-2.5">
            <span className="text-xs text-zinc-400 w-24 flex-shrink-0">Change</span>
            <span className={`text-sm font-bold ${m.change > 0 ? 'text-emerald-600' : 'text-red-600'}`}>{m.change > 0 ? '+' : ''}{m.change}</span>
          </div>
          <div className="flex items-center px-4 py-2.5">
            <span className="text-xs text-zinc-400 w-24 flex-shrink-0">After</span>
            <span className="text-sm font-semibold text-zinc-900">{m.qtyAfter}</span>
          </div>
          {m.sourceRef && (
            <div className="flex items-center px-4 py-2.5">
              <span className="text-xs text-zinc-400 w-24 flex-shrink-0">Reference</span>
              <span className="text-sm font-mono text-zinc-900">{m.sourceRef}</span>
            </div>
          )}
          {m.reason && (
            <div className="flex items-center px-4 py-2.5">
              <span className="text-xs text-zinc-400 w-24 flex-shrink-0">Reason</span>
              <span className="text-sm text-zinc-900 capitalize">{m.reason}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

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
        {filtered.map((m) => <MovementMobileCard key={m._id} m={m} />)}
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

function AdjustmentMobileCard({ m }) {
  const [isOpen, setIsOpen] = useState(false)
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.07)]">
      <div className="px-3 py-3 flex items-center gap-2.5">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${m.change > 0 ? 'bg-emerald-50' : 'bg-red-50'}`}>
          {m.change > 0 ? <TrendingUp size={18} className="text-emerald-500" /> : <TrendingDown size={18} className="text-red-500" />}
        </div>
        <div className="flex-1 min-w-0" onClick={() => setIsOpen((v) => !v)}>
          <p className="text-sm font-semibold text-zinc-900 truncate">{m.product?.name || '—'}</p>
          <p className="text-xs text-zinc-400 mt-0.5">{fmtDate(m.createdAt)}&nbsp;·&nbsp;
            <span className={`font-semibold ${m.change > 0 ? 'text-emerald-600' : 'text-red-600'}`}>{m.change > 0 ? '+' : ''}{m.change}</span>
          </p>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <Badge variant={m.change > 0 ? 'success' : 'danger'}>{m.change > 0 ? 'Add' : 'Remove'}</Badge>
          <button onClick={() => setIsOpen((v) => !v)} className="px-1 py-2 rounded-xl text-zinc-400 active:bg-zinc-100">
            <ChevronDown size={17} className={`transition-transform ${isOpen ? '' : '-rotate-90'}`} />
          </button>
        </div>
      </div>
      {isOpen && (
        <div className="border-t border-zinc-100 divide-y divide-zinc-100">
          <div className="flex items-center px-4 py-2.5">
            <span className="text-xs text-zinc-400 w-24 flex-shrink-0">Change</span>
            <span className={`text-sm font-bold ${m.change > 0 ? 'text-emerald-600' : 'text-red-600'}`}>{m.change > 0 ? '+' : ''}{m.change}</span>
          </div>
          {m.reason && (
            <div className="flex items-center px-4 py-2.5">
              <span className="text-xs text-zinc-400 w-24 flex-shrink-0">Reason</span>
              <span className="text-sm text-zinc-900 capitalize">{m.reason}</span>
            </div>
          )}
          {m.notes && (
            <div className="flex items-center px-4 py-2.5">
              <span className="text-xs text-zinc-400 w-24 flex-shrink-0">Notes</span>
              <span className="text-sm text-zinc-900">{m.notes}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

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
        {filtered.map((m) => <AdjustmentMobileCard key={m._id} m={m} />)}
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

  const { data: groups = [] } = useGroups()
  const isBusiness = groups.find((g) => g._id === activeGroupId)?.type === 'business'

  const canSeeLevels      = usePermission('stock', 'levels',      'view')
  const canSeeMovements   = usePermission('stock', 'movements',   'view')
  const canSeeAdjustments = usePermission('stock', 'adjustment',  'view')
  const canAddAdjustment  = usePermission('stock', 'adjustment',  'add')

  // Activity (recurring action log) is a personal-group feature only
  const TABS = ALL_TABS.filter((t) => {
    if (t.key === 'activity')    return !isBusiness
    if (!isBusiness) return true
    if (t.key === 'levels')      return canSeeLevels
    if (t.key === 'movements')   return canSeeMovements
    if (t.key === 'adjustments') return canSeeAdjustments
    return true
  })

  const hasFilters = tab !== 'adjustments' && tab !== 'activity'
  const addBtn = tab === 'adjustments' && canAddAdjustment
    ? <Button size="sm" onClick={() => onAddRef.current?.()}><Plus size={16} /> New Adjustment</Button>
    : null

  return (
    <>
      <TopBar
        title="Stock"
        filterIcon={hasFilters && <DataTableFilterIcon open={mobileFiltersOpen} onChange={setMobileFiltersOpen} />}
        right={tab === 'adjustments' && canAddAdjustment && (
          <button onClick={() => onAddRef.current?.()} className="w-9 h-9 flex items-center justify-center rounded-full bg-zinc-900 text-white active:bg-zinc-700 transition-colors">
            <Plus size={20} />
          </button>
        )}
      />

      <div className="px-4 pt-0 pb-4 md:px-0 md:py-0 md:pb-4 md:flex md:flex-col md:flex-1 md:min-h-0">
        {(TABS.length > 1 || addBtn) && (
          <div className="flex items-center gap-3 flex-shrink-0 py-2 sticky z-20 -mx-4 px-4 bg-[#f5f5f5] md:static md:bg-transparent md:mx-0 md:px-0 md:py-0 md:mb-4 md:justify-between" style={{ top: "calc(3.5rem + env(safe-area-inset-top, 0px))" }}>
            {TABS.length > 1 ? <Tabs tabs={TABS} active={tab} onChange={setTab} /> : <span />}
            <PageActions add={addBtn} />
          </div>
        )}

        <div className="md:flex-1 md:min-h-0 md:flex md:flex-col">
          {tab === 'levels'      && <LevelsTab      mobileFiltersOpen={mobileFiltersOpen} onMobileFiltersOpenChange={setMobileFiltersOpen} groupMembers={groupMembers} />}
          {tab === 'movements'   && <MovementsTab   mobileFiltersOpen={mobileFiltersOpen} onMobileFiltersOpenChange={setMobileFiltersOpen} />}
          {tab === 'adjustments' && <AdjustmentsTab onAdd={onAddRef} />}
          {tab === 'activity'    && <ActivityTab />}
        </div>
      </div>
    </>
  )
}
