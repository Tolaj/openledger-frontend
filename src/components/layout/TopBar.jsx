import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ShoppingCart } from 'lucide-react'
import GroupSwitcher from './GroupSwitcher'
import useCartStore from '../../store/cartStore'

export default function TopBar({ title, back = false, right, filterIcon }) {
  const navigate = useNavigate()
  const { openCart, getItemCount } = useCartStore()
  const totalItems = getItemCount()

  return (
    <header
      className="sticky top-0 z-40 bg-[#f5f5f5]/95 backdrop-blur-md md:hidden"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <div className="flex items-center h-14 px-4 max-w-md mx-auto gap-2">
        {back ? (
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 -ml-1 flex items-center justify-center rounded-full bg-white shadow-sm text-zinc-900 active:bg-zinc-50 transition-colors flex-shrink-0"
          >
            <ArrowLeft size={18} />
          </button>
        ) : null}

        <h1 className={`flex-1 text-[15px] font-bold text-zinc-900 truncate ${back ? 'text-center' : ''}`}>
          {title}
        </h1>

        {!back && <GroupSwitcher compact />}
        {filterIcon && <div>{filterIcon}</div>}

        <button
          onClick={openCart}
          className="relative w-9 h-9 flex items-center justify-center rounded-full bg-white shadow-sm text-zinc-700 active:bg-zinc-50 transition-colors"
        >
          <ShoppingCart size={17} />
          {totalItems > 0 && (
            <span className="absolute top-0.5 right-0.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-zinc-900 text-white text-[9px] font-bold leading-none">
              {totalItems > 9 ? '9+' : totalItems}
            </span>
          )}
        </button>

        {right && <div className="flex items-center gap-1">{right}</div>}
      </div>
    </header>
  )
}
