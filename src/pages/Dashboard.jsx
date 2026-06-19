import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  TrendingUp, TrendingDown, ShoppingCart, Package,
  Heart, ClipboardList, ArrowRight, AlertTriangle,
} from 'lucide-react'
import TopBar from '../components/layout/TopBar'
import PageHeader from '../components/layout/PageHeader'
import PageActions from '../components/layout/PageActions'
import useAuthStore from '../store/authStore'
import useGroupStore from '../store/groupStore'
import { useProducts } from '../hooks/useProducts'
import { useOrders } from '../hooks/useOrders'
import { useWishlists } from '../hooks/useWishlists'
import { useInventory } from '../hooks/useInventory'
import { useMe } from '../hooks/useUser'
import { useCurrencySymbol } from '../hooks/useCurrency'
import { useFinanceSummary, useFinance } from '../hooks/useFinance'
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
      <p className="text-sm font-semibold text-zinc-900">{title}</p>
      {to && (
        <button onClick={() => navigate(to)} className="flex items-center gap-0.5 text-xs text-zinc-400 active:text-zinc-700">
          See all <ArrowRight size={12} />
        </button>
      )}
    </div>
  )
}

// ── Dashboard ──────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const navigate   = useNavigate()
  const user       = useAuthStore((s) => s.user)
  const firstName  = user?.name?.split(' ')[0] || 'there'

  const { activeGroupId } = useGroupStore()
  const { data: me }      = useMe()
  const symbol = useCurrencySymbol()

  const { data: products  = [] } = useProducts()
  const { data: orders    = [] } = useOrders()
  const { data: wishlists = [] } = useWishlists()
  const { data: inventory = [] } = useInventory()

  const now = new Date()
  const monthParams = {
    groupId:   activeGroupId,
    startDate: startOfMonth(now).toISOString(),
    endDate:   endOfMonth(now).toISOString(),
  }
  const { data: summary }          = useFinanceSummary(monthParams)
  const { data: recentFinance = [] } = useFinance({ groupId: activeGroupId, ...monthParams })

  // Derived
  const lowStock = inventory.filter((inv) => inv.quantityAvailable <= 2)
  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5)

  const TYPE_COLOR = {
    income:     'text-emerald-600',
    expense:    'text-red-500',
    loan:       'text-amber-600',
    investment: 'text-blue-600',
  }

  // Stats
  const stats = [
    { label: 'Products',  value: products.length,  icon: Package,      color: 'bg-zinc-100',    to: '/products'  },
    { label: 'Orders',    value: orders.length,    icon: ShoppingCart, color: 'bg-zinc-100',    to: '/products'  },
    { label: 'Wishlist',  value: wishlists.length, icon: Heart,        color: 'bg-pink-50',     to: '/products'  },
    { label: 'Low Stock', value: lowStock.length,  icon: AlertTriangle, color: lowStock.length > 0 ? 'bg-amber-50' : 'bg-zinc-100', to: '/products' },
  ]

  return (
    <>
      <TopBar title="OpenLedger" />

      <div className="px-4 py-5 md:px-0 md:py-0 flex flex-col gap-4 md:gap-6">
        {/* Greeting */}
        <div>
          <PageHeader
            title={`Hey, ${firstName} 👋`}
            subtitle={`${format(now, 'EEEE, d MMMM')} · Here's your overview`}
            action={<PageActions />}
          />
          <div className="md:hidden">
            <p className="text-xl font-bold text-zinc-900">Hey, {firstName} 👋</p>
            <p className="text-sm text-zinc-500 mt-0.5">{format(now, 'EEEE, d MMMM')} · Here's your overview</p>
          </div>
        </div>

        {/* Finance hero card */}
        {activeGroupId && (
          <button onClick={() => navigate('/finance')} className="w-full text-left bg-zinc-900 text-white rounded-2xl p-5 active:scale-[0.98] transition-transform">
            <p className="text-xs font-medium text-zinc-400 mb-1">This month · Net balance</p>
            <p className="text-3xl font-bold mb-4">{fmt(summary?.net, symbol)}</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-white/10 rounded-xl p-3">
                <p className="text-[10px] text-zinc-400 mb-0.5 flex items-center gap-1"><TrendingUp size={10} /> Income</p>
                <p className="text-sm font-semibold text-emerald-400">{fmt(summary?.income, symbol)}</p>
              </div>
              <div className="bg-white/10 rounded-xl p-3">
                <p className="text-[10px] text-zinc-400 mb-0.5 flex items-center gap-1"><TrendingDown size={10} /> Expense</p>
                <p className="text-sm font-semibold text-red-400">{fmt(summary?.expense, symbol)}</p>
              </div>
            </div>
          </button>
        )}

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {stats.map(({ label, value, icon: Icon, color, to }) => (
            <button key={label} onClick={() => navigate(to)}
              className="bg-white rounded-2xl border border-zinc-200 p-4 text-left active:scale-[0.97] transition-transform">
              <div className={`w-8 h-8 rounded-xl ${color} flex items-center justify-center mb-3`}>
                <Icon size={16} className="text-zinc-700" />
              </div>
              <p className="text-2xl font-bold text-zinc-900">{value}</p>
              <p className="text-xs text-zinc-500 mt-0.5">{label}</p>
            </button>
          ))}
        </div>

        {/* 2-col layout for orders + low stock */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Recent Orders */}
          <div className="md:col-span-2 bg-white rounded-2xl border border-zinc-200 p-4">
            <SectionHeader title="Recent Orders" to="/products" navigate={navigate} />
            {recentOrders.length === 0 ? (
              <p className="text-sm text-zinc-400">No orders yet — start a shopping trip</p>
            ) : (
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

          {/* Low Stock */}
          <div className="bg-white rounded-2xl border border-zinc-200 p-4">
            <SectionHeader title="Low Stock" to="/products" navigate={navigate} />
            {lowStock.length === 0 ? (
              <p className="text-sm text-zinc-400">All items well stocked</p>
            ) : (
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
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                        inv.quantityAvailable === 0 ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'
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
          <div className="bg-white rounded-2xl border border-zinc-200 p-4">
            <SectionHeader title="Recent Transactions" to="/finance" navigate={navigate} />
            <div className="flex flex-col divide-y divide-zinc-100">
              {recentFinance.slice(0, 5).map((t) => (
                <div key={t._id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                  <div className="w-8 h-8 rounded-xl bg-zinc-100 flex items-center justify-center flex-shrink-0">
                    {t.type === 'income'     && <TrendingUp  size={14} className="text-emerald-600" />}
                    {t.type === 'expense'    && <TrendingDown size={14} className="text-red-500" />}
                    {t.type === 'loan'       && <ClipboardList size={14} className="text-amber-600" />}
                    {t.type === 'investment' && <TrendingUp  size={14} className="text-blue-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-900 truncate">{t.description || t.type}</p>
                    <p className="text-xs text-zinc-400">{fmtDate(t.date)}{t.category?.name ? ` · ${t.category.name}` : ''}</p>
                  </div>
                  <p className={`text-sm font-semibold flex-shrink-0 ${TYPE_COLOR[t.type]}`}>
                    {t.type === 'expense' || t.type === 'loan' ? '-' : '+'}{fmt(t.amount, symbol)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
