import { NavLink } from 'react-router-dom'
import { Home, Tag, CreditCard, Settings, ShoppingCart, TrendingUp, Boxes } from 'lucide-react'
import useGroupStore from '../../store/groupStore'
import { useGroups } from '../../hooks/useGroups'

const PERSONAL_TABS = [
  { to: '/',         icon: Home,        label: 'Home',      exact: true },
  { to: '/products', icon: Tag,         label: 'Products'               },
  { to: '/finance',  icon: CreditCard,  label: 'Finance'                },
  { to: '/settings', icon: Settings,    label: 'Settings'               },
]

const BUSINESS_TABS = [
  { to: '/',          icon: Home,         label: 'Home',      exact: true },
  { to: '/products',  icon: Tag,          label: 'Products'               },
  { to: '/purchases', icon: ShoppingCart, label: 'Purchases'              },
  { to: '/sales',     icon: TrendingUp,   label: 'Sales'                  },
  { to: '/stock',     icon: Boxes,        label: 'Stock'                  },
  { to: '/settings',  icon: Settings,     label: 'Settings'               },
]

export default function BottomNav() {
  const { activeGroupId } = useGroupStore()
  const { data: groups = [] } = useGroups()

  const activeGroup = groups.find(g => g._id === activeGroupId)
  const tabs = activeGroup?.type === 'business' ? BUSINESS_TABS : PERSONAL_TABS

  return (
    <nav className="bg-white/95 backdrop-blur-md border-t border-zinc-100 safe-bottom">
      <div className="flex items-center h-16 max-w-lg mx-auto">
        {tabs.map(({ to, icon: Icon, label, exact }) => (
          <NavLink
            key={to}
            to={to}
            end={exact}
            className={({ isActive }) =>
              [
                'flex-1 flex flex-col items-center justify-center gap-0.5 py-2 transition-colors',
                isActive ? 'text-zinc-900' : 'text-zinc-400',
              ].join(' ')
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={22} strokeWidth={isActive ? 2.2 : 1.8} />
                <span className={`text-[10px] ${isActive ? 'font-semibold' : 'font-medium'}`}>
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
