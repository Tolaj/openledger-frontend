import TopBar from '../components/layout/TopBar'
import PageHeader from '../components/layout/PageHeader'
import useAuthStore from '../store/authStore'

const stats = [
  { label: 'Products', value: '—', desc: 'in your catalogue' },
  { label: 'In Stock', value: '—', desc: 'inventory items' },
  { label: 'Orders', value: '—', desc: 'shopping trips' },
  { label: 'Wishlist', value: '—', desc: 'saved items' },
]

export default function Dashboard() {
  const user = useAuthStore((s) => s.user)
  const firstName = user?.name?.split(' ')[0]

  return (
    <>
      {/* Mobile top bar */}
      <TopBar title="OpenLedger" />

      <div className="px-4 py-5 md:px-0 md:py-0">
        {/* Desktop header */}
        <PageHeader
          title={`Hey, ${firstName} 👋`}
          subtitle="Here's your household overview"
        />

        {/* Mobile greeting */}
        <div className="md:hidden mb-5">
          <p className="text-xl font-bold text-zinc-900">Hey, {firstName} 👋</p>
          <p className="text-sm text-zinc-500 mt-1">Here's your household overview</p>
        </div>

        {/* Stats grid — 2 col mobile, 4 col desktop */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {stats.map(({ label, value, desc }) => (
            <div key={label} className="bg-white rounded-2xl border border-zinc-200 p-4 md:p-5">
              <p className="text-2xl md:text-3xl font-bold text-zinc-900">{value}</p>
              <p className="text-sm font-medium text-zinc-700 mt-1">{label}</p>
              <p className="text-xs text-zinc-400 mt-0.5 hidden md:block">{desc}</p>
            </div>
          ))}
        </div>

        {/* Desktop recent activity placeholder */}
        <div className="hidden md:grid grid-cols-3 gap-4 mt-6">
          <div className="col-span-2 bg-white rounded-2xl border border-zinc-200 p-5">
            <p className="text-sm font-semibold text-zinc-900 mb-1">Recent Orders</p>
            <p className="text-sm text-zinc-400">Your latest shopping trips will appear here</p>
          </div>
          <div className="bg-white rounded-2xl border border-zinc-200 p-5">
            <p className="text-sm font-semibold text-zinc-900 mb-1">Low Stock</p>
            <p className="text-sm text-zinc-400">Items running low will appear here</p>
          </div>
        </div>
      </div>
    </>
  )
}
