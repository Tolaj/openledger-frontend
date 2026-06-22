import { useNavigate } from 'react-router-dom'
import {
  TrendingUp, TrendingDown, ShoppingCart, Package,
  Heart, ClipboardList, ArrowRight, AlertTriangle,
  Truck, FileText, PackageCheck, ReceiptText,
} from 'lucide-react'
import GroupSwitcher from '../components/layout/GroupSwitcher'
import useCartStore from '../store/cartStore'
import PageHeader from '../components/layout/PageHeader'
import PageActions from '../components/layout/PageActions'
import useAuthStore from '../store/authStore'
import { useMe } from '../hooks/useUser'
import useGroupStore from '../store/groupStore'
import { useProducts } from '../hooks/useProducts'
import { useOrders } from '../hooks/useOrders'
import { useWishlists } from '../hooks/useWishlists'
import { useInventory } from '../hooks/useInventory'
import { useCurrencySymbol } from '../hooks/useCurrency'
import { useFinanceSummary, useFinance } from '../hooks/useFinance'
import { usePurchaseOrders } from '../hooks/usePurchaseOrders'
import { useSalesOrders } from '../hooks/useSalesOrders'
import { usePurchaseInvoices } from '../hooks/usePurchaseInvoices'
import { useSalesInvoices } from '../hooks/useSalesInvoices'
import { useActiveGroupType } from '../hooks/useActiveGroupType'
import { startOfMonth, endOfMonth, format } from 'date-fns'

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmt(amount, symbol) {
  return `${symbol}${Number(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

function fmtDate(d) {
  return d ? format(new Date(d), 'dd MMM') : '—'
}

// ── Section Header ────────────────────────────────────────────────────────────
function SectionHeader({ title, to, navigate }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <p className="text-base font-bold text-zinc-900">{title}</p>
      {to && (
        <button onClick={() => navigate(to)} className="flex items-center gap-0.5 text-xs text-zinc-400 active:text-zinc-700">
          See all <ArrowRight size={12} />
        </button>
      )}
    </div>
  )
}

// ── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, icon: Icon, iconColor, bgColor, to, navigate, danger }) {
  return (
    <button onClick={() => to && navigate(to)}
      className="bg-white rounded-2xl p-4 text-left active:scale-[0.97] transition-transform w-full shadow-[0_2px_8px_rgba(0,0,0,0.07)]">
      <div className={`w-8 h-8 rounded-xl ${bgColor} flex items-center justify-center mb-3`}>
        <Icon size={16} className={iconColor} />
      </div>
      <p className={`text-2xl font-bold ${danger ? 'text-red-500' : 'text-zinc-900'}`}>{value}</p>
      <p className="text-xs text-zinc-500 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-zinc-400 mt-0.5">{sub}</p>}
    </button>
  )
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const navigate = useNavigate()
  const { openCart, getItemCount } = useCartStore()
  const user = useAuthStore((s) => s.user)
  const { data: me } = useMe()
  const firstName = me?.name?.split(' ')[0] || user?.name?.split(' ')[0] || 'there'
  const { activeGroupId } = useGroupStore()
  const symbol = useCurrencySymbol()
  const groupType = useActiveGroupType()   // 'personal' | 'business'
  const isBusiness = groupType === 'business'

  const now = new Date()

  // ── Always needed ─────────────────────────────────────────────────────────
  const { data: inventory = [] } = useInventory()
  const lowStock = inventory.filter((inv) => inv.quantityAvailable <= 2)

  // ── Personal-only hooks (gated so they don't fire for business groups) ────
  const { data: products = [] } = useProducts()
  const { data: orders = [] } = useOrders()
  const { data: wishlists = [] } = useWishlists()

  // Finance queries: pass null groupId for business groups so enabled: !!groupId = false → no fetch
  const financeParams = {
    groupId: isBusiness ? null : activeGroupId,
    startDate: startOfMonth(now).toISOString(),
    endDate: endOfMonth(now).toISOString(),
  }
  const { data: summary } = useFinanceSummary(financeParams)
  const { data: recentFinance = [] } = useFinance(financeParams)

  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5)

  // ── Business-only hooks ────────────────────────────────────────────────────
  const { data: purchaseOrders = [] } = usePurchaseOrders()
  const { data: salesOrders = [] } = useSalesOrders()
  const { data: purchaseInvoices = [] } = usePurchaseInvoices()
  const { data: salesInvoices = [] } = useSalesInvoices()

  const pendingPOs = purchaseOrders.filter((p) => ['draft', 'sent', 'partial'].includes(p.status))
  const pendingSOs = salesOrders.filter((s) => ['draft', 'confirmed', 'partial'].includes(s.status))
  const unpaidPInv = purchaseInvoices.filter((i) => ['draft', 'sent', 'overdue'].includes(i.status))
  const unpaidSInv = salesInvoices.filter((i) => ['draft', 'sent', 'overdue'].includes(i.status))
  const overduePInv = purchaseInvoices.filter((i) => i.status === 'overdue')
  const overdueSInv = salesInvoices.filter((i) => i.status === 'overdue')

  const totalReceivable = unpaidSInv.reduce((s, i) => s + (i.grandTotal || 0), 0)
  const totalPayable = unpaidPInv.reduce((s, i) => s + (i.grandTotal || 0), 0)
  const stockValue = inventory.reduce((s, inv) => s + (inv.quantityAvailable || 0) * (inv.price || 0), 0)

  const recentSOs = [...salesOrders]
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .slice(0, 5)
  const recentPOs = [...purchaseOrders]
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .slice(0, 5)

  // ── Status colour maps ────────────────────────────────────────────────────
  const TYPE_COLOR = {
    income: 'text-emerald-600', expense: 'text-red-500',
    loan: 'text-amber-600', investment: 'text-blue-600',
  }
  const SO_STATUS_COLOR = {
    draft: 'bg-zinc-100 text-zinc-600', confirmed: 'bg-amber-50 text-amber-600',
    partial: 'bg-amber-50 text-amber-600', delivered: 'bg-emerald-50 text-emerald-600',
    cancelled: 'bg-red-50 text-red-500',
  }
  const PO_STATUS_COLOR = {
    draft: 'bg-zinc-100 text-zinc-600', sent: 'bg-amber-50 text-amber-600',
    partial: 'bg-amber-50 text-amber-600', received: 'bg-emerald-50 text-emerald-600',
    cancelled: 'bg-red-50 text-red-500',
  }

  return (
    <>
      {/* Desktop greeting */}
      <div className="hidden md:block px-4 py-3 pb-6 md:px-0 md:py-0 md:pb-4">
        <PageHeader
          title={`Hey, ${firstName} 👋`}
          subtitle={`${format(now, 'EEEE, d MMMM')} · Here's your overview`}
          action={<PageActions />}
        />
      </div>

      <div className="px-4 pt-0 pb-6 md:px-0 md:py-0 md:pb-6 flex flex-col gap-5 md:gap-6">

        {/* Mobile greeting — no sticky header, inline at top of scroll */}
        <div className="md:hidden pt-5 flex items-start justify-between gap-3">
          <div>
            <p className="text-sm text-zinc-500 font-medium">Welcome back,</p>
            <p className="text-3xl font-bold text-zinc-900 leading-tight mt-0.5">{firstName}</p>
            <p className="text-xs text-zinc-400 mt-1">{format(now, 'EEEE, d MMMM')}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 mt-1">
            <GroupSwitcher compact />
            <button onClick={openCart} className="relative w-9 h-9 flex items-center justify-center rounded-full bg-white shadow-sm active:bg-zinc-50 transition-colors">
              <ShoppingCart size={17} className="text-zinc-700" />
              {getItemCount() > 0 && (
                <span className="absolute top-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-zinc-900 text-white text-[8px] font-bold flex items-center justify-center">
                  {getItemCount() > 9 ? '9+' : getItemCount()}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* ── BUSINESS DASHBOARD ────────────────────────────────────────── */}
        {isBusiness ? (
          <>
            {/* Receivable / Payable hero */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-zinc-900 text-white rounded-3xl p-4">
                <p className="text-[10px] text-zinc-400 mb-1 flex items-center gap-1"><TrendingUp size={10} /> Receivable</p>
                <p className="text-2xl font-bold text-emerald-400">{fmt(totalReceivable, symbol)}</p>
                <p className="text-xs text-zinc-400 mt-1">{unpaidSInv.length} unpaid invoice{unpaidSInv.length !== 1 ? 's' : ''}</p>
                {overdueSInv.length > 0 && <p className="text-xs text-red-400 mt-0.5">{overdueSInv.length} overdue</p>}
              </div>
              <div className="bg-zinc-900 text-white rounded-3xl p-4">
                <p className="text-[10px] text-zinc-400 mb-1 flex items-center gap-1"><TrendingDown size={10} /> Payable</p>
                <p className="text-2xl font-bold text-red-400">{fmt(totalPayable, symbol)}</p>
                <p className="text-xs text-zinc-400 mt-1">{unpaidPInv.length} unpaid invoice{unpaidPInv.length !== 1 ? 's' : ''}</p>
                {overduePInv.length > 0 && <p className="text-xs text-red-400 mt-0.5">{overduePInv.length} overdue</p>}
              </div>
            </div>

            {/* KPI grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <KpiCard label="Pending POs" value={pendingPOs.length} icon={PackageCheck}
                iconColor="text-blue-600" bgColor="bg-blue-50"
                sub={`${purchaseOrders.length} total`} to="/purchases" navigate={navigate} />
              <KpiCard label="Pending SOs" value={pendingSOs.length} icon={Truck}
                iconColor="text-emerald-600" bgColor="bg-emerald-50"
                sub={`${salesOrders.length} total`} to="/sales" navigate={navigate} />
              <KpiCard label="Stock Value" value={fmt(stockValue, symbol)} icon={Package}
                iconColor="text-zinc-600" bgColor="bg-zinc-100"
                sub={`${inventory.length} SKUs`} to="/products" navigate={navigate} />
              <KpiCard label="Low Stock" value={lowStock.length} icon={AlertTriangle}
                iconColor={lowStock.length > 0 ? 'text-amber-600' : 'text-zinc-400'}
                bgColor={lowStock.length > 0 ? 'bg-amber-50' : 'bg-zinc-100'}
                danger={lowStock.length > 0}
                sub="≤ 2 units" to="/products" navigate={navigate} />
            </div>

            {/* Recent SOs + POs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl p-4 shadow-[0_2px_8px_rgba(0,0,0,0.07)]">
                <SectionHeader title="Recent Sales Orders" to="/sales" navigate={navigate} />
                {recentSOs.length === 0
                  ? <p className="text-sm text-zinc-400">No sales orders yet</p>
                  : (
                    <div className="flex flex-col divide-y divide-zinc-100">
                      {recentSOs.map((o) => (
                        <div key={o._id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                          <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
                            <Truck size={14} className="text-emerald-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-zinc-900 truncate">{o.soNumber}</p>
                            <p className="text-xs text-zinc-400">{o.customer?.name || '—'} · {fmtDate(o.createdAt)}</p>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <p className="text-sm font-semibold text-zinc-900">{fmt(o.grandTotal, symbol)}</p>
                            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md capitalize ${SO_STATUS_COLOR[o.status] || 'bg-zinc-100 text-zinc-600'}`}>{o.status}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
              </div>

              <div className="bg-white rounded-2xl p-4 shadow-[0_2px_8px_rgba(0,0,0,0.07)]">
                <SectionHeader title="Recent Purchase Orders" to="/purchases" navigate={navigate} />
                {recentPOs.length === 0
                  ? <p className="text-sm text-zinc-400">No purchase orders yet</p>
                  : (
                    <div className="flex flex-col divide-y divide-zinc-100">
                      {recentPOs.map((o) => (
                        <div key={o._id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                          <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                            <PackageCheck size={14} className="text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-zinc-900 truncate">{o.poNumber}</p>
                            <p className="text-xs text-zinc-400">{o.vendor?.name || '—'} · {fmtDate(o.createdAt)}</p>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <p className="text-sm font-semibold text-zinc-900">{fmt(o.grandTotal, symbol)}</p>
                            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md capitalize ${PO_STATUS_COLOR[o.status] || 'bg-zinc-100 text-zinc-600'}`}>{o.status}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
              </div>
            </div>

            {/* Low stock alert */}
            {lowStock.length > 0 && (
              <div className="bg-white rounded-2xl p-4 shadow-[0_2px_8px_rgba(0,0,0,0.07)]">
                <SectionHeader title="Low Stock Alert" to="/products" navigate={navigate} />
                <div className="flex flex-col divide-y divide-zinc-100">
                  {lowStock.slice(0, 5).map((inv) => {
                    const p = inv.product || {}
                    const iconBg = p.category?.color ? `${p.category.color}22` : '#f4f4f5'
                    return (
                      <div key={inv._id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center text-base flex-shrink-0" style={{ backgroundColor: iconBg }}>
                          {p.category?.icon || '📦'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-zinc-900 truncate">{p.name || '—'}</p>
                          <p className="text-xs text-zinc-400">{p.unit || '—'}</p>
                        </div>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${inv.quantityAvailable === 0 ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'
                          }`}>
                          {inv.quantityAvailable} left
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </>

        ) : (
          <>
            {/* ── PERSONAL DASHBOARD ──────────────────────────────────────── */}

            {/* Finance hero */}
            {activeGroupId && (
              <div className="w-full bg-zinc-900 text-white rounded-3xl p-5">
                <p className="text-xs font-medium text-zinc-400 mb-1">This month · Net balance</p>
                <p className="text-[32px] font-bold leading-tight mb-4">{fmt(summary?.net, symbol)}</p>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="bg-white/10 rounded-2xl p-3">
                    <p className="text-[10px] text-zinc-400 mb-0.5 flex items-center gap-1"><TrendingUp size={10} /> Income</p>
                    <p className="text-sm font-semibold text-emerald-400">{fmt(summary?.income, symbol)}</p>
                  </div>
                  <div className="bg-white/10 rounded-2xl p-3">
                    <p className="text-[10px] text-zinc-400 mb-0.5 flex items-center gap-1"><TrendingDown size={10} /> Expense</p>
                    <p className="text-sm font-semibold text-red-400">{fmt(summary?.expense, symbol)}</p>
                  </div>
                </div>
                <button onClick={() => navigate('/finance')}
                  className="w-full flex items-center justify-center gap-2 bg-white/15 hover:bg-white/20 active:bg-white/25 rounded-2xl py-3 text-sm font-semibold text-white transition-colors">
                  <ReceiptText size={15} /> View Transactions
                </button>
              </div>
            )}

            {/* Stats grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Products', value: products.length, icon: Package, color: 'bg-zinc-100', to: '/products' },
                { label: 'Orders', value: orders.length, icon: ShoppingCart, color: 'bg-zinc-100', to: '/products' },
                { label: 'Wishlist', value: wishlists.length, icon: Heart, color: 'bg-pink-50', to: '/products' },
                {
                  label: 'Low Stock', value: lowStock.length, icon: AlertTriangle,
                  color: lowStock.length > 0 ? 'bg-amber-50' : 'bg-zinc-100', to: '/products'
                },
              ].map(({ label, value, icon: Icon, color, to }) => (
                <button key={label} onClick={() => navigate(to)}
                  className="bg-white rounded-2xl p-4 text-left active:scale-[0.97] transition-transform shadow-[0_2px_8px_rgba(0,0,0,0.07)]">
                  <div className={`w-8 h-8 rounded-xl ${color} flex items-center justify-center mb-3`}>
                    <Icon size={16} className="text-zinc-700" />
                  </div>
                  <p className="text-2xl font-bold text-zinc-900">{value}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">{label}</p>
                </button>
              ))}
            </div>

            {/* Recent Orders + Low Stock */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 bg-white rounded-2xl border border-zinc-200 p-4">
                <SectionHeader title="Recent Orders" to="/products" navigate={navigate} />
                {recentOrders.length === 0
                  ? <p className="text-sm text-zinc-400">No orders yet — start a shopping trip</p>
                  : (
                    <div className="flex flex-col divide-y divide-zinc-100">
                      {recentOrders.map((o) => (
                        <div key={o._id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                          <div className="w-8 h-8 rounded-xl bg-zinc-900 flex items-center justify-center flex-shrink-0">
                            <ShoppingCart size={14} className="text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-zinc-900 truncate">{o.name}</p>
                            <p className="text-xs text-zinc-400">{fmtDate(o.date)} · {o.paidBy?.name || o.paidBy?.email || '—'}</p>
                          </div>
                          <p className="text-sm font-semibold text-zinc-900 flex-shrink-0">{symbol}{o.totalPrice}</p>
                        </div>
                      ))}
                    </div>
                  )}
              </div>

              <div className="bg-white rounded-2xl p-4 shadow-[0_2px_8px_rgba(0,0,0,0.07)]">
                <SectionHeader title="Low Stock" to="/products" navigate={navigate} />
                {lowStock.length === 0
                  ? <p className="text-sm text-zinc-400">All items well stocked</p>
                  : (
                    <div className="flex flex-col divide-y divide-zinc-100">
                      {lowStock.slice(0, 5).map((inv) => {
                        const p = inv.product || {}
                        const iconBg = p.category?.color ? `${p.category.color}22` : '#f4f4f5'
                        return (
                          <div key={inv._id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-base flex-shrink-0" style={{ backgroundColor: iconBg }}>
                              {p.category?.icon || '📦'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-zinc-900 truncate">{p.name || '—'}</p>
                              <p className="text-xs text-zinc-400">{p.unit || '—'}</p>
                            </div>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${inv.quantityAvailable === 0 ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'
                              }`}>
                              {inv.quantityAvailable} left
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  )}
              </div>
            </div>

            {/* Recent Finance transactions */}
            {recentFinance.length > 0 && (
              <div className="bg-white rounded-2xl p-4 shadow-[0_2px_8px_rgba(0,0,0,0.07)]">
                <SectionHeader title="Recent Transactions" to="/finance" navigate={navigate} />
                <div className="flex flex-col divide-y divide-zinc-100">
                  {recentFinance.slice(0, 5).map((t) => (
                    <div key={t._id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                      <div className="w-8 h-8 rounded-xl bg-zinc-100 flex items-center justify-center flex-shrink-0">
                        {t.type === 'income' && <TrendingUp size={14} className="text-emerald-600" />}
                        {t.type === 'expense' && <TrendingDown size={14} className="text-red-500" />}
                        {t.type === 'loan' && <ClipboardList size={14} className="text-amber-600" />}
                        {t.type === 'investment' && <TrendingUp size={14} className="text-blue-600" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-zinc-900 truncate">{t.description || t.type}</p>
                        <p className="text-xs text-zinc-400">{fmtDate(t.date)}{t.category?.name ? ` · ${t.category.name}` : ''}</p>
                      </div>
                      <p className={`text-sm font-semibold flex-shrink-0 ${TYPE_COLOR[t.type]}`}>
                        {t.type === 'expense' || t.type === 'loan' ? '−' : '+'}{fmt(t.amount, symbol)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  )
}
