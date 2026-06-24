import { NavLink } from 'react-router-dom'
import { Home, Tag, CreditCard, Settings, ShoppingCart, TrendingUp, Boxes, BarChart2 } from 'lucide-react'
import useGroupStore from '../../store/groupStore'
import { useGroups } from '../../hooks/useGroups'
import { usePagePermission } from '../../hooks/usePermission'

const PERSONAL_TABS = [
  { to: '/dashboard', icon: Home,        label: 'Home',      exact: true },
  { to: '/products',  icon: Tag,         label: 'Products'               },
  { to: '/finance',   icon: CreditCard,  label: 'Finance'                },
  { to: '/settings',  icon: Settings,    label: 'Settings'               },
]

const BUSINESS_TABS = [
  { to: '/dashboard', icon: Home,         label: 'Home',      exact: true, pageKey: 'dashboard'      },
  { to: '/products',  icon: Tag,          label: 'Products',               pageKey: 'products'        },
  { to: '/purchases', icon: ShoppingCart, label: 'Purchases',              pageKey: 'purchase_orders' },
  { to: '/sales',     icon: TrendingUp,   label: 'Sales',                  pageKey: 'sales_orders'    },
  { to: '/stock',     icon: Boxes,        label: 'Stock',                  pageKey: 'stock'           },
  { to: '/finance',   icon: BarChart2,    label: 'Finance',                pageKey: 'finance'         },
  { to: '/settings',  icon: Settings,     label: 'Settings'                },
]

function BottomNavItem({ to, icon: Icon, label, exact }) {
  return (
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
  )
}

function BottomNavItemGated({ pageKey, ...props }) {
  const canView = usePagePermission(pageKey)
  if (!canView) return null
  return <BottomNavItem {...props} />
}

export default function BottomNav() {
  const { activeGroupId } = useGroupStore()
  const { data: groups = [] } = useGroups()

  const activeGroup = groups.find(g => g._id === activeGroupId)
  const isBusiness = activeGroup?.type === 'business'
  const tabs = isBusiness ? BUSINESS_TABS : PERSONAL_TABS

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pointer-events-none"
      style={{ paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))' }}
    >
      <div className="pointer-events-auto flex items-center gap-1 bg-white rounded-full shadow-[0_4px_32px_rgba(0,0,0,0.12)] px-2 py-2 border border-zinc-100">
        {tabs.map((item) =>
          isBusiness && item.pageKey
            ? <BottomNavItemGated key={item.to} {...item} />
            : <BottomNavItem key={item.to} {...item} />
        )}
      </div>
    </nav>
  )
}
