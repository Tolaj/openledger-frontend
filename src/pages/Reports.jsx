import { useState, useMemo } from 'react'
import {
  TrendingUp, TrendingDown, Package, BarChart3,
  FileText, ReceiptText, ChevronDown, ChevronUp,
  Landmark, ShoppingCart, AlertTriangle,
} from 'lucide-react'
import TopBar from '../components/layout/TopBar'
import PageHeader from '../components/layout/PageHeader'
import PageActions from '../components/layout/PageActions'
import { useSalesInvoices } from '../hooks/useSalesInvoices'
import { usePurchaseInvoices } from '../hooks/usePurchaseInvoices'
import { useSalesOrders } from '../hooks/useSalesOrders'
import { usePurchaseOrders } from '../hooks/usePurchaseOrders'
import { useInventory } from '../hooks/useInventory'
import { useFinance } from '../hooks/useFinance'
import { useProducts } from '../hooks/useProducts'
import { useOrders } from '../hooks/useOrders'
import { useIsBusiness } from '../hooks/useActiveGroupType'
import { useCurrencySymbol } from '../hooks/useCurrency'
import useGroupStore from '../store/groupStore'
import {
  format, startOfMonth, endOfMonth, subMonths, isWithinInterval,
  parseISO, differenceInDays, startOfYear, endOfYear,
} from 'date-fns'

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmt(amount, symbol) {
  return `${symbol}${Number(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}
function pct(part, total) {
  if (!total) return '0%'
  return `${Math.round((part / total) * 100)}%`
}
function inRange(dateStr, range) {
  if (!dateStr) return false
  try { return isWithinInterval(parseISO(dateStr), range) } catch { return false }
}

// ── Period selector ───────────────────────────────────────────────────────────
const PERIODS = [
  { key: '1m',  label: '1M'  },
  { key: '3m',  label: '3M'  },
  { key: '6m',  label: '6M'  },
  { key: '1y',  label: '1Y'  },
  { key: 'all', label: 'All' },
]
function periodRange(key) {
  const now = new Date()
  if (key === '1m')  return { start: startOfMonth(now), end: endOfMonth(now) }
  if (key === '3m')  return { start: startOfMonth(subMonths(now, 2)), end: endOfMonth(now) }
  if (key === '6m')  return { start: startOfMonth(subMonths(now, 5)), end: endOfMonth(now) }
  if (key === '1y')  return { start: startOfYear(now), end: endOfYear(now) }
  return { start: new Date(0), end: now }
}

// ── Shared UI ─────────────────────────────────────────────────────────────────
function SectionCard({ title, children, className = '' }) {
  return (
    <div className={`bg-white rounded-2xl border border-zinc-200 p-4 ${className}`}>
      {title && <p className="text-sm font-semibold text-zinc-900 mb-3">{title}</p>}
      {children}
    </div>
  )
}

function StatRow({ label, value, sub, color = 'text-zinc-900', bold = false }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-zinc-50 last:border-0">
      <p className="text-sm text-zinc-600">{label}</p>
      <div className="text-right">
        <p className={`text-sm font-${bold ? 'bold' : 'semibold'} ${color}`}>{value}</p>
        {sub && <p className="text-xs text-zinc-400">{sub}</p>}
      </div>
    </div>
  )
}

function ProgressBar({ value, max, color = 'bg-zinc-900' }) {
  const w = max > 0 ? Math.min(100, (value / max) * 100) : 0
  return (
    <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden">
      <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${w}%` }} />
    </div>
  )
}

function AgingBadge({ days }) {
  if (days <= 0)  return <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-zinc-100 text-zinc-500">Not due</span>
  if (days <= 30) return <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-600">{days}d</span>
  if (days <= 60) return <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-orange-50 text-orange-600">{days}d</span>
  return <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-red-50 text-red-600">{days}d overdue</span>
}

function PeriodSelector({ period, setPeriod }) {
  return (
    <div className="flex gap-2 flex-wrap">
      {PERIODS.map((p) => (
        <button key={p.key} onClick={() => setPeriod(p.key)}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
            period === p.key ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-500 active:bg-zinc-200'
          }`}>
          {p.label}
        </button>
      ))}
    </div>
  )
}

// ── Monthly bar chart builder ─────────────────────────────────────────────────
function buildMonthly(items, getDate, getValue, months = 6) {
  const now = new Date()
  return Array.from({ length: months }, (_, i) => {
    const d     = subMonths(now, months - 1 - i)
    const key   = format(d, 'MMM yy')
    const start = startOfMonth(d)
    const end   = endOfMonth(d)
    const total = items
      .filter((item) => { try { return isWithinInterval(parseISO(getDate(item)), { start, end }) } catch { return false } })
      .reduce((s, item) => s + (getValue(item) || 0), 0)
    return { key, total }
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// BUSINESS REPORTS
// ─────────────────────────────────────────────────────────────────────────────
function BusinessReports({ symbol, period }) {
  const [showAllAR, setShowAllAR]     = useState(false)
  const [showAllAP, setShowAllAP]     = useState(false)
  const [showAllCust, setShowAllCust] = useState(false)
  const [showAllVend, setShowAllVend] = useState(false)

  const { data: salesInvoices    = [] } = useSalesInvoices()
  const { data: purchaseInvoices = [] } = usePurchaseInvoices()
  const { data: salesOrders      = [] } = useSalesOrders()
  const { data: purchaseOrders   = [] } = usePurchaseOrders()
  const { data: inventory        = [] } = useInventory()

  const range = useMemo(() => periodRange(period), [period])

  // P&L
  const paidSInv = useMemo(() =>
    salesInvoices.filter((i) => i.status === 'paid' && inRange(i.invoiceDate || i.createdAt, range)),
    [salesInvoices, range])
  const paidPInv = useMemo(() =>
    purchaseInvoices.filter((i) => i.status === 'paid' && inRange(i.invoiceDate || i.createdAt, range)),
    [purchaseInvoices, range])

  const revenue     = paidSInv.reduce((s, i) => s + (i.grandTotal || 0), 0)
  const cogs        = paidPInv.reduce((s, i) => s + (i.grandTotal || 0), 0)
  const grossProfit = revenue - cogs
  const taxCollected = paidSInv.reduce((s, i) => s + (i.taxAmount || 0), 0)
  const taxPaid      = paidPInv.reduce((s, i) => s + (i.taxAmount || 0), 0)
  const netTax       = taxCollected - taxPaid

  // AR aging
  const arItems = useMemo(() =>
    salesInvoices
      .filter((i) => ['draft', 'sent', 'overdue'].includes(i.status))
      .map((i) => ({ ...i, daysOverdue: i.dueDate ? Math.max(0, differenceInDays(new Date(), parseISO(i.dueDate))) : 0 }))
      .sort((a, b) => b.daysOverdue - a.daysOverdue),
    [salesInvoices])
  const totalAR = arItems.reduce((s, i) => s + (i.grandTotal || 0), 0)

  // AP aging
  const apItems = useMemo(() =>
    purchaseInvoices
      .filter((i) => ['draft', 'sent', 'overdue'].includes(i.status))
      .map((i) => ({ ...i, daysOverdue: i.dueDate ? Math.max(0, differenceInDays(new Date(), parseISO(i.dueDate))) : 0 }))
      .sort((a, b) => b.daysOverdue - a.daysOverdue),
    [purchaseInvoices])
  const totalAP = apItems.reduce((s, i) => s + (i.grandTotal || 0), 0)

  // Top customers
  const topCustomers = useMemo(() => {
    const map = {}
    salesInvoices.forEach((inv) => {
      const name = inv.customer?.name || 'Unknown'
      const id   = inv.customer?._id || name
      if (!map[id]) map[id] = { name, revenue: 0, count: 0 }
      map[id].revenue += inv.grandTotal || 0
      map[id].count   += 1
    })
    return Object.values(map).sort((a, b) => b.revenue - a.revenue)
  }, [salesInvoices])

  // Top vendors
  const topVendors = useMemo(() => {
    const map = {}
    purchaseInvoices.forEach((inv) => {
      const name = inv.vendor?.name || 'Unknown'
      const id   = inv.vendor?._id || name
      if (!map[id]) map[id] = { name, spend: 0, count: 0 }
      map[id].spend += inv.grandTotal || 0
      map[id].count += 1
    })
    return Object.values(map).sort((a, b) => b.spend - a.spend)
  }, [purchaseInvoices])

  // Inventory by category
  const invByCat = useMemo(() => {
    const map = {}
    inventory.forEach((inv) => {
      const cat   = inv.product?.category?.name || 'Uncategorised'
      const icon  = inv.product?.category?.icon || '📦'
      const val   = (inv.quantityAvailable || 0) * (inv.price || 0)
      if (!map[cat]) map[cat] = { cat, icon, value: 0, count: 0 }
      map[cat].value += val
      map[cat].count += 1
    })
    return Object.values(map).sort((a, b) => b.value - a.value)
  }, [inventory])
  const totalInvValue = invByCat.reduce((s, c) => s + c.value, 0)
  const lowStock = inventory.filter((inv) => inv.quantityAvailable <= 2)

  // Monthly bars
  const revMonths  = useMemo(() => buildMonthly(salesInvoices,    (i) => i.invoiceDate || i.createdAt, (i) => i.grandTotal, 6), [salesInvoices])
  const cogsMonths = useMemo(() => buildMonthly(purchaseInvoices, (i) => i.invoiceDate || i.createdAt, (i) => i.grandTotal, 6), [purchaseInvoices])
  const maxBar = Math.max(...revMonths.map((m) => m.total), ...cogsMonths.map((m) => m.total), 1)

  // Invoice status
  const siByStatus = useMemo(() => {
    const s = { draft: 0, sent: 0, paid: 0, overdue: 0, cancelled: 0 }
    salesInvoices.forEach((i) => { s[i.status] = (s[i.status] || 0) + 1 })
    return s
  }, [salesInvoices])
  const piByStatus = useMemo(() => {
    const s = { draft: 0, sent: 0, paid: 0, overdue: 0, cancelled: 0 }
    purchaseInvoices.forEach((i) => { s[i.status] = (s[i.status] || 0) + 1 })
    return s
  }, [purchaseInvoices])

  const STATUS_BAR = { paid: 'bg-emerald-400', overdue: 'bg-red-400', sent: 'bg-amber-400' }
  const STATUS_TXT = { paid: 'text-emerald-600', overdue: 'text-red-500', sent: 'text-amber-600', draft: 'text-zinc-500', cancelled: 'text-zinc-300' }

  return (
    <>
      {/* P&L */}
      <SectionCard title="Profit & Loss">
        <StatRow label="Revenue (paid invoices)" value={fmt(revenue, symbol)} color="text-emerald-600" bold />
        <StatRow label="Cost of Goods Sold" value={`− ${fmt(cogs, symbol)}`} color="text-red-500" />
        <div className="my-1 border-t border-zinc-200" />
        <StatRow label="Gross Profit"
          value={fmt(Math.abs(grossProfit), symbol)}
          sub={grossProfit < 0 ? 'Loss' : undefined}
          color={grossProfit >= 0 ? 'text-emerald-600' : 'text-red-500'} bold />
        <StatRow label="Tax Collected"     value={fmt(taxCollected, symbol)} />
        <StatRow label="Tax Paid"          value={`− ${fmt(taxPaid, symbol)}`} />
        <StatRow label="Net Tax Liability" value={fmt(Math.abs(netTax), symbol)}
          color={netTax >= 0 ? 'text-amber-600' : 'text-emerald-600'} />
      </SectionCard>

      {/* Monthly bars */}
      <SectionCard title="Revenue vs Cost — Last 6 Months">
        <div className="flex items-end gap-2 mt-2" style={{ height: 80 }}>
          {revMonths.map((m, i) => {
            const revH  = (m.total / maxBar) * 72
            const cogH  = (cogsMonths[i].total / maxBar) * 72
            return (
              <div key={m.key} className="flex-1 flex flex-col items-center gap-0.5">
                <div className="w-full flex items-end justify-center gap-0.5" style={{ height: 64 }}>
                  <div className="flex-1 bg-emerald-400 rounded-t-md" style={{ height: revH || 2 }} />
                  <div className="flex-1 bg-red-300 rounded-t-md"    style={{ height: cogH || 2 }} />
                </div>
                <p className="text-[9px] text-zinc-400 text-center leading-tight">{m.key}</p>
              </div>
            )
          })}
        </div>
        <div className="flex items-center gap-4 mt-3">
          <span className="flex items-center gap-1.5 text-xs text-zinc-500"><span className="w-3 h-3 rounded-sm bg-emerald-400 inline-block" />Revenue</span>
          <span className="flex items-center gap-1.5 text-xs text-zinc-500"><span className="w-3 h-3 rounded-sm bg-red-300 inline-block" />Cost</span>
        </div>
      </SectionCard>

      {/* AR + AP */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SectionCard title={`Receivable — ${fmt(totalAR, symbol)}`}>
          {arItems.length === 0 ? <p className="text-sm text-zinc-400">No outstanding invoices</p> : (
            <>
              <div className="flex flex-col divide-y divide-zinc-50">
                {(showAllAR ? arItems : arItems.slice(0, 4)).map((inv) => (
                  <div key={inv._id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-zinc-900 truncate">{inv.invoiceNumber}</p>
                      <p className="text-xs text-zinc-400 truncate">{inv.customer?.name || '—'}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs font-semibold text-zinc-900">{fmt(inv.grandTotal, symbol)}</p>
                      <AgingBadge days={inv.daysOverdue} />
                    </div>
                  </div>
                ))}
              </div>
              {arItems.length > 4 && (
                <button onClick={() => setShowAllAR((v) => !v)} className="mt-2 flex items-center gap-1 text-xs text-zinc-400">
                  {showAllAR ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  {showAllAR ? 'Show less' : `+${arItems.length - 4} more`}
                </button>
              )}
            </>
          )}
        </SectionCard>

        <SectionCard title={`Payable — ${fmt(totalAP, symbol)}`}>
          {apItems.length === 0 ? <p className="text-sm text-zinc-400">No outstanding invoices</p> : (
            <>
              <div className="flex flex-col divide-y divide-zinc-50">
                {(showAllAP ? apItems : apItems.slice(0, 4)).map((inv) => (
                  <div key={inv._id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-zinc-900 truncate">{inv.invoiceNumber}</p>
                      <p className="text-xs text-zinc-400 truncate">{inv.vendor?.name || '—'}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs font-semibold text-zinc-900">{fmt(inv.grandTotal, symbol)}</p>
                      <AgingBadge days={inv.daysOverdue} />
                    </div>
                  </div>
                ))}
              </div>
              {apItems.length > 4 && (
                <button onClick={() => setShowAllAP((v) => !v)} className="mt-2 flex items-center gap-1 text-xs text-zinc-400">
                  {showAllAP ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  {showAllAP ? 'Show less' : `+${apItems.length - 4} more`}
                </button>
              )}
            </>
          )}
        </SectionCard>
      </div>

      {/* Invoice status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { title: 'Sales Invoice Status', byStatus: siByStatus, total: salesInvoices.length },
          { title: 'Purchase Invoice Status', byStatus: piByStatus, total: purchaseInvoices.length },
        ].map(({ title, byStatus, total }) => (
          <SectionCard key={title} title={title}>
            {total === 0
              ? <p className="text-sm text-zinc-400">No invoices yet</p>
              : Object.entries(byStatus).filter(([, c]) => c > 0).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between py-1.5">
                  <p className={`text-sm capitalize ${STATUS_TXT[status] || 'text-zinc-600'}`}>{status}</p>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${STATUS_BAR[status] || 'bg-zinc-300'}`}
                        style={{ width: pct(count, total) }} />
                    </div>
                    <p className="text-xs text-zinc-400 w-6 text-right">{count}</p>
                  </div>
                </div>
              ))
            }
          </SectionCard>
        ))}
      </div>

      {/* Top customers + vendors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SectionCard title="Top Customers">
          {topCustomers.length === 0
            ? <p className="text-sm text-zinc-400">No customer invoices yet</p>
            : <>
              <div className="flex flex-col gap-3">
                {(showAllCust ? topCustomers : topCustomers.slice(0, 5)).map((c, i) => (
                  <div key={c.name}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs font-bold text-zinc-400 w-4 flex-shrink-0">#{i + 1}</span>
                        <p className="text-sm font-medium text-zinc-900 truncate">{c.name}</p>
                      </div>
                      <div className="text-right flex-shrink-0 ml-2">
                        <p className="text-sm font-semibold text-zinc-900">{fmt(c.revenue, symbol)}</p>
                        <p className="text-xs text-zinc-400">{c.count} inv</p>
                      </div>
                    </div>
                    <ProgressBar value={c.revenue} max={topCustomers[0]?.revenue || 1} color="bg-emerald-400" />
                  </div>
                ))}
              </div>
              {topCustomers.length > 5 && (
                <button onClick={() => setShowAllCust((v) => !v)} className="mt-3 flex items-center gap-1 text-xs text-zinc-400">
                  {showAllCust ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  {showAllCust ? 'Show less' : `+${topCustomers.length - 5} more`}
                </button>
              )}
            </>}
        </SectionCard>

        <SectionCard title="Top Vendors">
          {topVendors.length === 0
            ? <p className="text-sm text-zinc-400">No vendor invoices yet</p>
            : <>
              <div className="flex flex-col gap-3">
                {(showAllVend ? topVendors : topVendors.slice(0, 5)).map((v, i) => (
                  <div key={v.name}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs font-bold text-zinc-400 w-4 flex-shrink-0">#{i + 1}</span>
                        <p className="text-sm font-medium text-zinc-900 truncate">{v.name}</p>
                      </div>
                      <div className="text-right flex-shrink-0 ml-2">
                        <p className="text-sm font-semibold text-zinc-900">{fmt(v.spend, symbol)}</p>
                        <p className="text-xs text-zinc-400">{v.count} inv</p>
                      </div>
                    </div>
                    <ProgressBar value={v.spend} max={topVendors[0]?.spend || 1} color="bg-red-300" />
                  </div>
                ))}
              </div>
              {topVendors.length > 5 && (
                <button onClick={() => setShowAllVend((v) => !v)} className="mt-3 flex items-center gap-1 text-xs text-zinc-400">
                  {showAllVend ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  {showAllVend ? 'Show less' : `+${topVendors.length - 5} more`}
                </button>
              )}
            </>}
        </SectionCard>
      </div>

      {/* Inventory value */}
      <SectionCard title={`Inventory Value — ${fmt(totalInvValue, symbol)}`}>
        {invByCat.length === 0 ? <p className="text-sm text-zinc-400">No inventory data</p> : (
          <div className="flex flex-col gap-3">
            {invByCat.map((c) => (
              <div key={c.cat}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-base leading-none">{c.icon}</span>
                    <p className="text-sm font-medium text-zinc-900 truncate">{c.cat}</p>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <p className="text-sm font-semibold text-zinc-900">{fmt(c.value, symbol)}</p>
                    <p className="text-xs text-zinc-400">{pct(c.value, totalInvValue)} · {c.count} SKU{c.count !== 1 ? 's' : ''}</p>
                  </div>
                </div>
                <ProgressBar value={c.value} max={totalInvValue} color="bg-zinc-800" />
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* Low stock alert */}
      {lowStock.length > 0 && (
        <SectionCard title={`Low Stock Alert — ${lowStock.length} item${lowStock.length !== 1 ? 's' : ''}`}>
          <div className="flex flex-col divide-y divide-zinc-50">
            {lowStock.slice(0, 6).map((inv) => {
              const p = inv.product || {}
              return (
                <div key={inv._id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                  <span className="text-xl leading-none">{p.category?.icon || '📦'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-900 truncate">{p.name || '—'}</p>
                    <p className="text-xs text-zinc-400">{p.unit || '—'}</p>
                  </div>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                    inv.quantityAvailable === 0 ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'
                  }`}>{inv.quantityAvailable} left</span>
                </div>
              )
            })}
          </div>
        </SectionCard>
      )}

      {/* Pipeline counts */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Purchase Orders',   val: purchaseOrders.length,   icon: FileText,    bg: 'bg-blue-50',    ic: 'text-blue-600'    },
          { label: 'Sales Orders',      val: salesOrders.length,      icon: ReceiptText, bg: 'bg-emerald-50', ic: 'text-emerald-600' },
          { label: 'Sales Invoices',    val: salesInvoices.length,    icon: TrendingUp,  bg: 'bg-emerald-50', ic: 'text-emerald-600' },
          { label: 'Purchase Invoices', val: purchaseInvoices.length, icon: TrendingDown,bg: 'bg-red-50',     ic: 'text-red-500'     },
        ].map(({ label, val, icon: Icon, bg, ic }) => (
          <div key={label} className="bg-white rounded-2xl border border-zinc-200 p-4">
            <div className={`w-8 h-8 rounded-xl ${bg} flex items-center justify-center mb-3`}>
              <Icon size={16} className={ic} />
            </div>
            <p className="text-2xl font-bold text-zinc-900">{val}</p>
            <p className="text-xs text-zinc-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PERSONAL REPORTS
// ─────────────────────────────────────────────────────────────────────────────
function PersonalReports({ symbol, period }) {
  const { activeGroupId } = useGroupStore()
  const { data: products  = [] } = useProducts()
  const { data: orders    = [] } = useOrders()
  const { data: inventory = [] } = useInventory()

  // Fetch all transactions for the year (broad range)
  const now = new Date()
  const { data: allTx = [] } = useFinance({
    groupId:   activeGroupId,
    startDate: new Date(now.getFullYear() - 2, 0, 1).toISOString(),
    endDate:   new Date(now.getFullYear(), 11, 31).toISOString(),
  })

  const range = useMemo(() => periodRange(period), [period])

  // Filter to period
  const txInPeriod = useMemo(() =>
    allTx.filter((t) => inRange(t.date || t.createdAt, range)),
    [allTx, range])

  const income     = txInPeriod.filter((t) => t.type === 'income').reduce((s, t) => s + (t.amount || 0), 0)
  const expense    = txInPeriod.filter((t) => t.type === 'expense').reduce((s, t) => s + (t.amount || 0), 0)
  const loans      = txInPeriod.filter((t) => t.type === 'loan').reduce((s, t) => s + (t.amount || 0), 0)
  const investment = txInPeriod.filter((t) => t.type === 'investment').reduce((s, t) => s + (t.amount || 0), 0)
  const net = income - expense

  // Spending by category
  const spendByCat = useMemo(() => {
    const map = {}
    txInPeriod.filter((t) => t.type === 'expense').forEach((t) => {
      const name = t.category?.name || 'Uncategorised'
      const icon = t.category?.icon || '💸'
      if (!map[name]) map[name] = { name, icon, amount: 0, count: 0 }
      map[name].amount += t.amount || 0
      map[name].count  += 1
    })
    return Object.values(map).sort((a, b) => b.amount - a.amount)
  }, [txInPeriod])
  const maxSpend = spendByCat[0]?.amount || 1

  // Income by category
  const incomeByCat = useMemo(() => {
    const map = {}
    txInPeriod.filter((t) => t.type === 'income').forEach((t) => {
      const name = t.category?.name || 'Other Income'
      const icon = t.category?.icon || '💰'
      if (!map[name]) map[name] = { name, icon, amount: 0, count: 0 }
      map[name].amount += t.amount || 0
      map[name].count  += 1
    })
    return Object.values(map).sort((a, b) => b.amount - a.amount)
  }, [txInPeriod])
  const maxIncome = incomeByCat[0]?.amount || 1

  // Monthly income vs expense bars
  const incomeMonths  = useMemo(() => buildMonthly(
    allTx.filter((t) => t.type === 'income'),
    (t) => t.date || t.createdAt, (t) => t.amount, 6), [allTx])
  const expenseMonths = useMemo(() => buildMonthly(
    allTx.filter((t) => t.type === 'expense'),
    (t) => t.date || t.createdAt, (t) => t.amount, 6), [allTx])
  const maxBar = Math.max(...incomeMonths.map((m) => m.total), ...expenseMonths.map((m) => m.total), 1)

  // Orders stats
  const ordersByStatus = useMemo(() => {
    const map = {}
    orders.forEach((o) => {
      const s = o.status || 'received'
      map[s] = (map[s] || 0) + 1
    })
    return map
  }, [orders])

  // Low stock
  const lowStock = inventory.filter((inv) => inv.quantityAvailable <= 2)

  // Spending paid by each member
  const spendByPerson = useMemo(() => {
    const map = {}
    orders.forEach((o) => {
      const name = o.paidBy?.name || o.paidBy?.email || 'Unknown'
      const id   = o.paidBy?._id || name
      if (!map[id]) map[id] = { name, amount: 0, count: 0 }
      map[id].amount += o.totalPrice || 0
      map[id].count  += 1
    })
    return Object.values(map).sort((a, b) => b.amount - a.amount)
  }, [orders])
  const maxPersonSpend = spendByPerson[0]?.amount || 1

  return (
    <>
      {/* Income vs Expense hero */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-zinc-900 text-white rounded-2xl p-4">
          <p className="text-[10px] text-zinc-400 mb-1 flex items-center gap-1"><TrendingUp size={10} /> Income</p>
          <p className="text-2xl font-bold text-emerald-400">{fmt(income, symbol)}</p>
          <p className="text-xs text-zinc-400 mt-1">{txInPeriod.filter((t) => t.type === 'income').length} transactions</p>
        </div>
        <div className="bg-zinc-900 text-white rounded-2xl p-4">
          <p className="text-[10px] text-zinc-400 mb-1 flex items-center gap-1"><TrendingDown size={10} /> Expenses</p>
          <p className="text-2xl font-bold text-red-400">{fmt(expense, symbol)}</p>
          <p className="text-xs text-zinc-400 mt-1">{txInPeriod.filter((t) => t.type === 'expense').length} transactions</p>
        </div>
      </div>

      {/* Net summary */}
      <SectionCard title="Summary">
        <StatRow label="Total Income"     value={fmt(income, symbol)}     color="text-emerald-600" bold />
        <StatRow label="Total Expenses"   value={`− ${fmt(expense, symbol)}`} color="text-red-500" />
        <div className="my-1 border-t border-zinc-200" />
        <StatRow label="Net Balance"      value={fmt(Math.abs(net), symbol)}
          sub={net < 0 ? 'Deficit' : 'Surplus'}
          color={net >= 0 ? 'text-emerald-600' : 'text-red-500'} bold />
        {loans > 0 && <StatRow label="Loans / Debts" value={fmt(loans, symbol)} color="text-amber-600" />}
        {investment > 0 && <StatRow label="Investments" value={fmt(investment, symbol)} color="text-blue-600" />}
      </SectionCard>

      {/* Monthly bars */}
      <SectionCard title="Income vs Expenses — Last 6 Months">
        <div className="flex items-end gap-2 mt-2" style={{ height: 80 }}>
          {incomeMonths.map((m, i) => {
            const incH = (m.total / maxBar) * 72
            const expH = (expenseMonths[i].total / maxBar) * 72
            return (
              <div key={m.key} className="flex-1 flex flex-col items-center gap-0.5">
                <div className="w-full flex items-end justify-center gap-0.5" style={{ height: 64 }}>
                  <div className="flex-1 bg-emerald-400 rounded-t-md" style={{ height: incH || 2 }} />
                  <div className="flex-1 bg-red-300 rounded-t-md"    style={{ height: expH || 2 }} />
                </div>
                <p className="text-[9px] text-zinc-400 text-center leading-tight">{m.key}</p>
              </div>
            )
          })}
        </div>
        <div className="flex items-center gap-4 mt-3">
          <span className="flex items-center gap-1.5 text-xs text-zinc-500"><span className="w-3 h-3 rounded-sm bg-emerald-400 inline-block" />Income</span>
          <span className="flex items-center gap-1.5 text-xs text-zinc-500"><span className="w-3 h-3 rounded-sm bg-red-300 inline-block" />Expenses</span>
        </div>
      </SectionCard>

      {/* Spending + Income by category */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SectionCard title="Spending by Category">
          {spendByCat.length === 0
            ? <p className="text-sm text-zinc-400">No expenses in this period</p>
            : <div className="flex flex-col gap-3">
              {spendByCat.slice(0, 6).map((c) => (
                <div key={c.name}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-base leading-none">{c.icon}</span>
                      <p className="text-sm font-medium text-zinc-900 truncate">{c.name}</p>
                    </div>
                    <div className="text-right flex-shrink-0 ml-2">
                      <p className="text-sm font-semibold text-zinc-900">{fmt(c.amount, symbol)}</p>
                      <p className="text-xs text-zinc-400">{pct(c.amount, expense)} · {c.count} txn{c.count !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  <ProgressBar value={c.amount} max={maxSpend} color="bg-red-300" />
                </div>
              ))}
            </div>
          }
        </SectionCard>

        <SectionCard title="Income by Category">
          {incomeByCat.length === 0
            ? <p className="text-sm text-zinc-400">No income in this period</p>
            : <div className="flex flex-col gap-3">
              {incomeByCat.slice(0, 6).map((c) => (
                <div key={c.name}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-base leading-none">{c.icon}</span>
                      <p className="text-sm font-medium text-zinc-900 truncate">{c.name}</p>
                    </div>
                    <div className="text-right flex-shrink-0 ml-2">
                      <p className="text-sm font-semibold text-zinc-900">{fmt(c.amount, symbol)}</p>
                      <p className="text-xs text-zinc-400">{pct(c.amount, income)} · {c.count} txn{c.count !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  <ProgressBar value={c.amount} max={maxIncome} color="bg-emerald-400" />
                </div>
              ))}
            </div>
          }
        </SectionCard>
      </div>

      {/* Spending by person (orders) */}
      {spendByPerson.length > 0 && (
        <SectionCard title="Orders — Spent by Member">
          <div className="flex flex-col gap-3">
            {spendByPerson.map((p, i) => (
              <div key={p.name}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-6 h-6 rounded-full bg-zinc-100 flex items-center justify-center text-xs font-bold text-zinc-600 flex-shrink-0">
                      {p.name[0]?.toUpperCase()}
                    </div>
                    <p className="text-sm font-medium text-zinc-900 truncate">{p.name}</p>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <p className="text-sm font-semibold text-zinc-900">{fmt(p.amount, symbol)}</p>
                    <p className="text-xs text-zinc-400">{p.count} order{p.count !== 1 ? 's' : ''}</p>
                  </div>
                </div>
                <ProgressBar value={p.amount} max={maxPersonSpend} color="bg-zinc-700" />
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Products & orders counts */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Products Tracked', val: products.length,              icon: Package,    bg: 'bg-zinc-100',   ic: 'text-zinc-600'    },
          { label: 'Total Orders',     val: orders.length,                icon: ShoppingCart, bg: 'bg-zinc-100', ic: 'text-zinc-600'    },
          { label: 'Low Stock Items',  val: lowStock.length,              icon: AlertTriangle, bg: lowStock.length > 0 ? 'bg-amber-50' : 'bg-zinc-100', ic: lowStock.length > 0 ? 'text-amber-600' : 'text-zinc-400' },
          { label: 'Transactions',     val: allTx.length,                 icon: BarChart3,  bg: 'bg-zinc-100',   ic: 'text-zinc-600'    },
        ].map(({ label, val, icon: Icon, bg, ic }) => (
          <div key={label} className="bg-white rounded-2xl border border-zinc-200 p-4">
            <div className={`w-8 h-8 rounded-xl ${bg} flex items-center justify-center mb-3`}>
              <Icon size={16} className={ic} />
            </div>
            <p className="text-2xl font-bold text-zinc-900">{val}</p>
            <p className="text-xs text-zinc-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Low stock */}
      {lowStock.length > 0 && (
        <SectionCard title={`Low Stock — ${lowStock.length} item${lowStock.length !== 1 ? 's' : ''}`}>
          <div className="flex flex-col divide-y divide-zinc-50">
            {lowStock.map((inv) => {
              const p = inv.product || {}
              return (
                <div key={inv._id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                  <span className="text-xl leading-none">{p.category?.icon || '📦'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-900 truncate">{p.name || '—'}</p>
                    <p className="text-xs text-zinc-400">{p.unit || '—'}</p>
                  </div>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                    inv.quantityAvailable === 0 ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'
                  }`}>{inv.quantityAvailable} left</span>
                </div>
              )
            })}
          </div>
        </SectionCard>
      )}
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function Reports() {
  const [period, setPeriod] = useState('3m')
  const isBusiness = useIsBusiness()
  const symbol = useCurrencySymbol()

  return (
    <>
      <TopBar title="Reports" />

      <div className="px-4 py-5 md:px-0 md:py-0 flex flex-col gap-4 md:gap-6 pb-8">
        <PageHeader
          title="Reports"
          subtitle={isBusiness ? 'Business analytics & financials' : 'Personal finance analytics'}
          action={<PageActions />}
        />

        <PeriodSelector period={period} setPeriod={setPeriod} />

        {isBusiness
          ? <BusinessReports symbol={symbol} period={period} />
          : <PersonalReports symbol={symbol} period={period} />
        }
      </div>
    </>
  )
}
