import TopBar from '../components/layout/TopBar'
import PageHeader from '../components/layout/PageHeader'
import PageActions from '../components/layout/PageActions'
import useAuthStore from '../store/authStore'
import { useProducts } from '../hooks/useProducts'
import { useOrders } from '../hooks/useOrders'
import { useWishlists } from '../hooks/useWishlists'
import { useInventory } from '../hooks/useInventory'

export default function Dashboard() {
  const user = useAuthStore((s) => s.user)
  const firstName = user?.name?.split(' ')[0] || 'there'

  const { data: products  = [] } = useProducts()
  const { data: orders    = [] } = useOrders()
  const { data: wishlists = [] } = useWishlists()
  const { data: inventory = [] } = useInventory()

  const stats = [
    { label: 'Products',  value: products.length,  desc: 'in your catalogue' },
    { label: 'In Stock',  value: inventory.length, desc: 'inventory items' },
    { label: 'Orders',    value: orders.length,    desc: 'shopping trips' },
    { label: 'Wishlist',  value: wishlists.length, desc: 'saved lists' },
  ]

  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5)

  const lowStock = inventory
    .filter((inv) => inv.quantityAvailable <= 2)
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
          {/* Recent Orders — spans 2 cols on desktop */}
          <div className="md:col-span-2 bg-white rounded-2xl border border-zinc-200 p-5">
            <p className="text-sm font-semibold text-zinc-900 mb-3">Recent Orders</p>
            {recentOrders.length === 0 ? (
              <p className="text-sm text-zinc-400">Your latest shopping trips will appear here</p>
            ) : (
              <div className="flex flex-col divide-y divide-zinc-100">
                {recentOrders.map((o) => (
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
            <p className="text-sm font-semibold text-zinc-900 mb-3">Low Stock</p>
            {lowStock.length === 0 ? (
              <p className="text-sm text-zinc-400">
                {inventory.length === 0 ? 'Items running low will appear here' : 'All items are well stocked'}
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
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${inv.quantityAvailable === 0 ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
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
