import { NavLink, Link } from 'react-router-dom'
import {
  Home, Tag, CreditCard, Settings,
  ShoppingCart, TrendingUp, Layers, Boxes,
} from 'lucide-react'
import AppLogo from '../ui/AppLogo'
import useAuthStore from '../../store/authStore'
import useGroupStore from '../../store/groupStore'
import { useGroups } from '../../hooks/useGroups'

const PERSONAL_NAV = [
  { to: '/',         icon: Home,       label: 'Dashboard', exact: true },
  { to: '/products', icon: Tag,        label: 'Products'               },
  { to: '/finance',  icon: CreditCard, label: 'Finance'                },
]

const BUSINESS_NAV = [
  { to: '/',          icon: Home,         label: 'Dashboard', exact: true },
  { divider: true, label: 'Catalog' },
  { to: '/products',  icon: Tag,          label: 'Products'               },
  { to: '/stock',     icon: Boxes,        label: 'Stock'                  },
  { divider: true, label: 'Orders' },
  { to: '/general',   icon: Layers,       label: 'General'                },
  { to: '/purchases', icon: ShoppingCart, label: 'Purchases'              },
  { to: '/sales',     icon: TrendingUp,   label: 'Sales'                  },
  { divider: true, label: 'Insights' },
  { to: '/finance',   icon: CreditCard,   label: 'Finance'                },
]

function NavItem({ to, icon: Icon, label, exact }) {
  return (
    <NavLink
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
  )
}

function Divider({ label }) {
  return (
    <div className="pt-4 pb-1 px-3">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">{label}</p>
    </div>
  )
}

export default function Sidebar() {
  const user = useAuthStore((s) => s.user)
  const { activeGroupId } = useGroupStore()
  const { data: groups = [] } = useGroups()

  const activeGroup = groups.find(g => g._id === activeGroupId)
  const isBusiness = activeGroup?.type === 'business'
  const navItems = isBusiness ? BUSINESS_NAV : PERSONAL_NAV

  return (
    <aside className="hidden md:flex fixed inset-y-0 left-0 w-60 flex-col bg-white border-r border-zinc-200 z-40">
      {/* Logo */}
      <Link to="/" className="flex items-center gap-2.5 px-5 h-16 border-b border-zinc-100 hover:bg-zinc-50 transition-colors">
        <div className="w-7 h-7 bg-zinc-900 rounded-lg flex-shrink-0 flex items-center justify-center">
          <AppLogo size={14} />
        </div>
        <span className="text-sm font-bold text-zinc-900 tracking-tight">OpenLedger</span>
      </Link>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5 overflow-y-auto">
        {navItems.map((item, i) =>
          item.divider
            ? <Divider key={i} label={item.label} />
            : <NavItem key={item.to} {...item} />
        )}

        {/* Settings pinned at bottom */}
        <div className="mt-auto pt-3 border-t border-zinc-100">
          <NavItem to="/settings" icon={Settings} label="Settings" />
        </div>
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
