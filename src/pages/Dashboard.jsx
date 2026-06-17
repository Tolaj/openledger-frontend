import { useState, useRef, useEffect } from 'react'
import TopBar from '../components/layout/TopBar'
import PageHeader from '../components/layout/PageHeader'
import PageActions from '../components/layout/PageActions'
import useAuthStore from '../store/authStore'
import { useProducts } from '../hooks/useProducts'
import { useOrders } from '../hooks/useOrders'
import { useWishlists } from '../hooks/useWishlists'
import { useInventory } from '../hooks/useInventory'

// ── FilterDropdown ─────────────────────────────────────────────────────────────
function FilterDropdown({ options, selected, onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const h = (e) => { if (!ref.current?.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])

  const toggle = (val) => {
    onChange(
      selected.includes(val)
        ? selected.filter((v) => v !== val)
        : [...selected, val]
    )
  }

  const activeCount = selected.length

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
          activeCount > 0
            ? 'bg-zinc-900 border-zinc-900 text-white'
            : 'bg-white border-zinc-200 text-zinc-500 hover:border-zinc-400'
        }`}
      >
        {/* funnel icon */}
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
          <path d="M14 2H2l4.75 5.65V13l2.5 1V7.65L14 2Z" />
        </svg>
        Filter
        {activeCount > 0 && (
          <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-white text-zinc-900 text-[10px] font-bold">
            {activeCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 bg-white border border-zinc-200 rounded-xl shadow-xl z-50 min-w-[160px] py-1">
          {options.map((opt) => {
            const isSelected = selected.includes(opt)
            return (
              <button
                key={opt}
                onClick={() => toggle(opt)}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-zinc-700 hover:bg-zinc-50 text-left"
              >
                <span className={`w-4 h-4 rounded flex items-center justify-center border flex-shrink-0 transition-colors ${
                  isSelected ? 'bg-zinc-900 border-zinc-900' : 'border-zinc-200'
                }`}>
                  {isSelected && (
                    <svg viewBox="0 0 10 10" className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path d="M1.5 5l2.5 2.5 4.5-4.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </span>
                <span className="truncate">{opt}</span>
              </button>
            )
          })}
          {selected.length > 0 && (
            <>
              <div className="mx-3 my-1 border-t border-zinc-100" />
              <button
                onClick={() => { onChange([]); setOpen(false) }}
                className="w-full px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-600 text-left"
              >
                Clear filters
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ── Dashboard ──────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const user = useAuthStore((s) => s.user)
  const firstName = user?.name?.split(' ')[0] || 'there'

  const { data: products  = [] } = useProducts()
  const { data: orders    = [] } = useOrders()
  const { data: wishlists = [] } = useWishlists()
  const { data: inventory = [] } = useInventory()

  // Order filters: paidBy
  const [orderFilters, setOrderFilters] = useState([])
  // Inventory filters: category
  const [invFilters, setInvFilters] = useState([])

  const stats = [
    { label: 'Products',  value: products.length,  desc: 'in your catalogue' },
    { label: 'In Stock',  value: inventory.length, desc: 'inventory items' },
    { label: 'Orders',    value: orders.length,    desc: 'shopping trips' },
    { label: 'Wishlist',  value: wishlists.length, desc: 'saved lists' },
  ]

  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 20)

  // Distinct paidBy names for order filter
  const orderFilterOptions = [...new Set(
    orders.map((o) => o.paidBy?.name || o.paidBy?.email).filter(Boolean)
  )]

  const filteredOrders = recentOrders
    .filter((o) => orderFilters.length === 0 || orderFilters.includes(o.paidBy?.name || o.paidBy?.email))
    .slice(0, 5)

  // Distinct categories for inventory filter
  const invFilterOptions = [...new Set(
    inventory.map((inv) => inv.product?.category?.name).filter(Boolean)
  )]

  const lowStock = inventory
    .filter((inv) => inv.quantityAvailable <= 2)
    .filter((inv) => invFilters.length === 0 || invFilters.includes(inv.product?.category?.name))
    .slice(0, 6)

  const fmtDate = (d) => d
    ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })
    : '—'

  return (
    <>
      <TopBar title="OpenLedger" />

      <div className="px-4 py-5 md:px-0 md:py-0">
        <PageHeader
          title={`Hey, ${firstName} 👋`}
          subtitle="Here's your household overview"
          action={<PageActions />}
        />

        <div className="md:hidden mb-5">
          <p className="text-xl font-bold text-zinc-900">Hey, {firstName} 👋</p>
          <p className="text-sm text-zinc-500 mt-1">Here's your household overview</p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {stats.map(({ label, value, desc }) => (
            <div key={label} className="bg-white rounded-2xl border border-zinc-200 p-4 md:p-5">
              <p className="text-2xl md:text-3xl font-bold text-zinc-900">{value}</p>
              <p className="text-sm font-medium text-zinc-700 mt-1">{label}</p>
              <p className="text-xs text-zinc-400 mt-0.5 hidden md:block">{desc}</p>
            </div>
          ))}
        </div>

        {/* Recent Orders + Low Stock */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 md:mt-6">
          {/* Recent Orders */}
          <div className="md:col-span-2 bg-white rounded-2xl border border-zinc-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-zinc-900">Recent Orders</p>
              {orderFilterOptions.length > 0 && (
                <FilterDropdown
                  options={orderFilterOptions}
                  selected={orderFilters}
                  onChange={setOrderFilters}
                />
              )}
            </div>
            {filteredOrders.length === 0 ? (
              <p className="text-sm text-zinc-400">
                {orders.length === 0 ? 'Your latest shopping trips will appear here' : 'No orders match the filter'}
              </p>
            ) : (
              <div className="flex flex-col divide-y divide-zinc-100">
                {filteredOrders.map((o) => (
                  <div key={o._id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                    <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center flex-shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-white">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11.35 3.836c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m8.9-4.414c.376.023.75.05 1.124.08 1.131.094 1.976 1.057 1.976 2.192V16.5A2.25 2.25 0 0 1 18 18.75h-2.25m-7.5-10.5H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V18.75m-7.5-10.5h6.375c.621 0 1.125.504 1.125 1.125v9.375m-8.25-3 1.5 1.5 3-3.75" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-zinc-900 truncate">{o.name}</p>
                      <p className="text-xs text-zinc-400">{fmtDate(o.date)} · {o.paidBy?.name || o.paidBy?.email || '—'}</p>
                    </div>
                    <p className="text-sm font-semibold text-zinc-900 flex-shrink-0">$ {o.totalPrice}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Low Stock */}
          <div className="bg-white rounded-2xl border border-zinc-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-zinc-900">Low Stock</p>
              {invFilterOptions.length > 0 && (
                <FilterDropdown
                  options={invFilterOptions}
                  selected={invFilters}
                  onChange={setInvFilters}
                />
              )}
            </div>
            {lowStock.length === 0 ? (
              <p className="text-sm text-zinc-400">
                {inventory.length === 0
                  ? 'Items running low will appear here'
                  : invFilters.length > 0
                  ? 'No items match the filter'
                  : 'All items are well stocked'}
              </p>
            ) : (
              <div className="flex flex-col divide-y divide-zinc-100">
                {lowStock.map((inv) => {
                  const p = inv.product || {}
                  const catColor = p.category?.color
                  const iconBg = catColor && catColor.startsWith('#') ? `${catColor}22` : '#f4f4f5'
                  return (
                    <div key={inv._id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base flex-shrink-0" style={{ backgroundColor: iconBg }}>
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
      </div>
    </>
  )
}
