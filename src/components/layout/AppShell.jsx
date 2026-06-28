import { Outlet } from 'react-router-dom'
import BottomNav from './BottomNav'
import Sidebar from './Sidebar'
import CartPanel from '../features/CartPanel'
import WishlistCartPanel from '../features/WishlistCartPanel'

export default function AppShell() {
  return (
    <div className="flex-1 flex flex-col bg-[#f5f5f5] overflow-hidden" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
      <Sidebar />

      <div className="md:pl-60 flex-1 min-h-0 flex flex-col overflow-x-hidden">
        {/* Mobile: page scrolls naturally */}
        <div className="flex-1 overflow-y-auto md:hidden">
          <main className="max-w-md mx-auto pb-nav">
            <Outlet />
          </main>
        </div>

        {/* Desktop: fixed height so DataTable fills and scrolls internally */}
        <main className="hidden md:flex md:flex-col md:flex-1 md:min-h-0 md:px-8 md:pt-7">
          <Outlet />
        </main>
      </div>

      <div className="md:hidden">
        <BottomNav />
      </div>

      <CartPanel />
      <WishlistCartPanel />
    </div>
  )
}
