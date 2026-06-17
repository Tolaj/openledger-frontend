import { NavLink } from 'react-router-dom'
import { Home, Tag, CreditCard, Settings } from 'lucide-react'

const tabs = [
  { to: '/',         icon: Home,       label: 'Dashboard', exact: true },
  { to: '/products', icon: Tag,         label: 'Products'              },
  { to: '/finance',  icon: CreditCard,  label: 'Finance'               },
  { to: '/settings', icon: Settings,    label: 'Settings'              },
]

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-white/90 backdrop-blur-md border-t border-zinc-100 safe-bottom">
      <div className="flex items-center max-w-md mx-auto h-16">
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
                <span className={['text-[10px] font-medium', isActive ? 'font-semibold' : ''].join(' ')}>
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
