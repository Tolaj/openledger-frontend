import { NavLink } from 'react-router-dom'
import { Home, Tag, CreditCard, Settings, ShoppingCart, TrendingUp, Boxes, BarChart2 } from 'lucide-react'
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
  { to: '/finance',   icon: BarChart2,    label: 'Finance'                },
  { to: '/settings',  icon: Settings,     label: 'Settings'               },
]

export default function BottomNav() {
  const { activeGroupId } = useGroupStore()
  const { data: groups = [] } = useGroups()

  const activeGroup = groups.find(g => g._id === activeGroupId)
  const tabs = activeGroup?.type === 'business' ? BUSINESS_TABS : PERSONAL_TABS

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pointer-events-none"
      style={{ paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))' }}
    >
      <div className="pointer-events-auto flex items-center gap-1 bg-white rounded-full shadow-[0_4px_32px_rgba(0,0,0,0.12)] px-2 py-2 border border-zinc-100">
        {tabs.map(({ to, icon: Icon, label, exact }) => (
          <NavLink key={to} to={to} end={exact} title={label}>
            {({ isActive }) => (
              <div
                className={[
                  'w-11 h-11 flex items-center justify-center rounded-full transition-all duration-200',
                  isActive ? 'bg-zinc-900 shadow-sm' : 'hover:bg-zinc-50 active:bg-zinc-100',
                ].join(' ')}
              >
                <Icon
                  size={20}
                  strokeWidth={isActive ? 2.2 : 1.8}
                  className={isActive ? 'text-white' : 'text-zinc-400'}
                />
              </div>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
