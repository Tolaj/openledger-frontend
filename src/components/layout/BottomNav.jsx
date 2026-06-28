import { useRef, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { Home, Tag, CreditCard, Settings, ShoppingCart, TrendingUp, Boxes, BarChart2, Sparkles } from 'lucide-react'
import useGroupStore from '../../store/groupStore'
import { useGroups } from '../../hooks/useGroups'
import { usePagePermission } from '../../hooks/usePermission'
import { aiTriggerRef } from '../../lib/aiTrigger'

const ITEMS_PER_PAGE = 6
const STEP = 2       // buttons revealed per scroll step
const BTN_PX = 44   // w-11
const GAP_PX = 4    // gap-1
const PILL_PAD = 16 // px-2 (8px * 2)

function pageWidth(count) {
  return count * BTN_PX + (count - 1) * GAP_PX
}


function NavBtn({ to, icon: Icon, exact }) {
  return (
    <NavLink to={to} end={exact}>
      {({ isActive }) => (
        <div className={[
          'w-11 h-11 flex items-center justify-center rounded-full transition-all duration-200',
          isActive ? 'bg-zinc-900 shadow-sm' : 'hover:bg-zinc-50 active:bg-zinc-100',
        ].join(' ')}>
          <Icon size={20} strokeWidth={isActive ? 2.2 : 1.8}
            className={isActive ? 'text-white' : 'text-zinc-400'} />
        </div>
      )}
    </NavLink>
  )
}

function AiBtn() {
  return (
    <button
      onClick={() => aiTriggerRef.current?.()}
      className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-zinc-50 active:bg-zinc-100 transition-all duration-200"
      title="Aura AI"
    >
      <Sparkles size={20} strokeWidth={1.8} className="text-zinc-400" />
    </button>
  )
}

export default function BottomNav() {
  const { activeGroupId } = useGroupStore()
  const { data: groups = [] } = useGroups()
  const scrollRef = useRef(null)
  const [currentPage, setCurrentPage] = useState(0)

  const activeGroup = groups.find(g => g._id === activeGroupId)
  const isBusiness = activeGroup?.type === 'business'
  const aiEnabled = activeGroup?.aiEnabled

  // Always call permission hooks (rules of hooks)
  const canDashboard   = usePagePermission('dashboard')
  const canProducts    = usePagePermission('products')
  const canPurchases   = usePagePermission('purchase_orders')
  const canSales       = usePagePermission('sales_orders')
  const canStock       = usePagePermission('stock')
  const canFinance     = usePagePermission('finance')

  // Build visible button list
  const buttons = []
  if (isBusiness) {
    if (canDashboard)  buttons.push({ type: 'nav', to: '/dashboard', icon: Home, exact: true })
    if (canProducts)   buttons.push({ type: 'nav', to: '/products', icon: Tag })
    if (canPurchases)  buttons.push({ type: 'nav', to: '/purchases', icon: ShoppingCart })
    if (canSales)      buttons.push({ type: 'nav', to: '/sales', icon: TrendingUp })
    if (canStock)      buttons.push({ type: 'nav', to: '/stock', icon: Boxes })
    if (canFinance)    buttons.push({ type: 'nav', to: '/finance', icon: BarChart2 })
    buttons.push({ type: 'nav', to: '/settings', icon: Settings })
  } else {
    buttons.push({ type: 'nav', to: '/dashboard', icon: Home, exact: true })
    buttons.push({ type: 'nav', to: '/products', icon: Tag })
    buttons.push({ type: 'nav', to: '/finance', icon: CreditCard })
    buttons.push({ type: 'nav', to: '/settings', icon: Settings })
  }
  if (aiEnabled) buttons.push({ type: 'ai' })

  const hasOverflow = buttons.length > ITEMS_PER_PAGE
  const pillW = pageWidth(Math.min(buttons.length, ITEMS_PER_PAGE)) + PILL_PAD
  // max scrollLeft = (extra buttons) * (btn + gap)
  const maxScroll = hasOverflow ? (buttons.length - ITEMS_PER_PAGE) * (BTN_PX + GAP_PX) : 0

  const stepPx = STEP * (BTN_PX + GAP_PX)

  const handleScroll = () => {
    const el = scrollRef.current
    if (!el) return
    setCurrentPage(el.scrollLeft < stepPx / 2 ? 0 : 1)
  }

  function renderBtn(btn) {
    if (btn.type === 'ai') return <AiBtn key="ai" />
    return <NavBtn key={btn.to} to={btn.to} icon={btn.icon} exact={btn.exact} />
  }

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pointer-events-none md:hidden"
      style={{ paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))' }}
    >
      <div className="relative flex items-center">
      <div
        className="pointer-events-auto bg-white rounded-full shadow-[0_4px_32px_rgba(0,0,0,0.12)] border border-zinc-100 px-2 py-2 flex items-center"
        style={{ width: pillW }}
      >
        {hasOverflow ? (
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="flex gap-1 overflow-x-auto scrollbar-none"
            style={{
              scrollSnapType: 'x mandatory',
              WebkitOverflowScrolling: 'touch',
              width: pageWidth(ITEMS_PER_PAGE),
            }}
          >
            {buttons.map((btn, i) => (
              <div
                key={btn.type === 'ai' ? 'ai' : btn.to}
                className="flex-shrink-0"
                style={{ scrollSnapAlign: i % STEP === 0 ? 'start' : undefined }}
              >
                {renderBtn(btn)}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-1">
            {buttons.map(renderBtn)}
          </div>
        )}
      </div>

      {hasOverflow && (
          <div className="absolute top-full mt-1.5 left-0 right-0 flex justify-center gap-1 pointer-events-none">
            {[0, 1].map(pi => (
              <div
                key={pi}
                className={`rounded-full transition-all duration-200 ${
                  currentPage === pi
                    ? 'w-3 h-1.5 bg-zinc-900'
                    : 'w-1.5 h-1.5 bg-zinc-300'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </nav>
  )
}
