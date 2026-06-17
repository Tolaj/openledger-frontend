import { ShoppingCart } from 'lucide-react'
import GroupSwitcher from './GroupSwitcher'
import useCartStore from '../../store/cartStore'

export default function PageActions({ add }) {
  const { openCart, getItemCount } = useCartStore()
  const totalItems = getItemCount()

  return (
    <div className="hidden md:flex items-center gap-2">
      <GroupSwitcher />

      {add && <div>{add}</div>}

      <button
        onClick={openCart}
        className="relative flex items-center gap-2 px-3 py-2 rounded-xl border border-zinc-200 bg-white text-sm font-medium text-zinc-700 hover:bg-zinc-50 active:bg-zinc-100 transition-colors"
      >
        <ShoppingCart size={15} className="text-zinc-500" />
        <span>Cart</span>
        {totalItems > 0 && (
          <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1 rounded-full bg-zinc-900 text-white text-[11px] font-bold leading-none">
            {totalItems > 99 ? '99+' : totalItems}
          </span>
        )}
      </button>
    </div>
  )
}
