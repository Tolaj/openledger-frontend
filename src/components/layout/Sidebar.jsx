import { NavLink } from 'react-router-dom'
import { Home, Tag, CreditCard, Settings } from 'lucide-react'
import useAuthStore from '../../store/authStore'

const nav = [
  { to: '/',         icon: Home,       label: 'Dashboard', exact: true },
  { to: '/products', icon: Tag,         label: 'Products'              },
  { to: '/finance',  icon: CreditCard,  label: 'Finance'               },
  { to: '/settings', icon: Settings,    label: 'Settings'              },
]

export default function Sidebar() {
  const user = useAuthStore((s) => s.user)

  return (
    <aside className="hidden md:flex fixed inset-y-0 left-0 w-60 flex-col bg-white border-r border-zinc-200 z-40">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 h-16 border-b border-zinc-100">
        <div className="w-7 h-7 bg-zinc-900 rounded-lg flex-shrink-0" />
        <span className="text-sm font-bold text-zinc-900 tracking-tight">OpenLedger</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5 overflow-y-auto">
        {nav.map(({ to, icon: Icon, label, exact }) => (
          <NavLink
            key={to}
            to={to}
            end={exact}
            className={({ isActive }) =>
              [
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                isActive
                  ? 'bg-zinc-900 text-white'
                  : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900',
              ].join(' ')
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      {user && (
        <div className="px-4 py-4 border-t border-zinc-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-xs font-bold text-zinc-600 flex-shrink-0">
              {user.name?.[0]?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-zinc-900 truncate">{user.name}</p>
              <p className="text-[11px] text-zinc-500 truncate">{user.email}</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}
