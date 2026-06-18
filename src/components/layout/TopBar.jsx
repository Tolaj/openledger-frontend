import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ShoppingCart } from 'lucide-react'
import GroupSwitcher from './GroupSwitcher'
import useCartStore from '../../store/cartStore'

export default function TopBar({ title, back = false, right, filterIcon }) {
  const navigate = useNavigate()
  const { openCart, getItemCount } = useCartStore()
  const totalItems = getItemCount()

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-zinc-100 md:hidden">
      <div className="flex items-center h-14 px-4 max-w-md mx-auto gap-2">
        {back && (
          <button
            onClick={() => navigate(-1)}
            className="p-1 -ml-1 rounded-xl text-zinc-900 active:bg-zinc-100 min-touch flex items-center justify-center"
          >
            <ArrowLeft size={20} />
          </button>
        )}
        <h1 className="flex-1 text-base font-semibold text-zinc-900 truncate">
          {title}
        </h1>
        <GroupSwitcher compact />
        {filterIcon && <div>{filterIcon}</div>}
        <button
          onClick={openCart}
          className="relative p-2 rounded-xl text-zinc-600 active:bg-zinc-100"
        >
          <ShoppingCart size={20} />
          {totalItems > 0 && (
            <span className="absolute -top-0.5 -right-0.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-zinc-900 text-white text-[10px] font-bold leading-none">
              {totalItems > 9 ? '9+' : totalItems}
            </span>
          )}
        </button>
        {right && <div className="flex items-center gap-1">{right}</div>}
      </div>
    </header>
  )
}
