import { useNavigate } from 'react-router-dom'
import { ShoppingCart } from 'lucide-react'
import GroupSwitcher from './GroupSwitcher'
import { useHeaderAction } from './HeaderActionContext'
import useCartStore from '../../store/cartStore'

export default function GlobalHeader() {
  const navigate = useNavigate()
  const { action } = useHeaderAction()
  const items = useCartStore((s) => s.items)
  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0)

  return (
    <div className="hidden md:flex items-center justify-end gap-2 px-8 py-3 border-b border-zinc-200 bg-white sticky top-0 z-30">
      <GroupSwitcher />

      {action && <div>{action}</div>}

      <button
        onClick={() => navigate('/finance')}
        className="relative flex items-center gap-2 px-3 py-2 rounded-xl border border-zinc-200 bg-zinc-50 text-sm font-medium text-zinc-700 hover:bg-zinc-100 active:bg-zinc-200 transition-colors"
      >
        <ShoppingCart size={16} className="text-zinc-500" />
        <span>Cart</span>
        {totalItems > 0 && (
          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-zinc-900 text-white text-[11px] font-bold leading-none">
            {totalItems > 99 ? '99+' : totalItems}
          </span>
        )}
      </button>
    </div>
  )
}
