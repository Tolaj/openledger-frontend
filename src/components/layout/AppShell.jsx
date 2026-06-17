import { Outlet } from 'react-router-dom'
import BottomNav from './BottomNav'
import Sidebar from './Sidebar'
import CartPanel from '../features/CartPanel'
import WishlistCartPanel from '../features/WishlistCartPanel'

export default function AppShell() {
  return (
    <div className="min-h-screen bg-zinc-50">
      <Sidebar />

      <div className="md:pl-60">
        <main className="max-w-md mx-auto pb-nav md:max-w-none md:pb-0 md:p-8">
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
