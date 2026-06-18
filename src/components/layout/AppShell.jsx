import { Outlet } from 'react-router-dom'
import BottomNav from './BottomNav'
import Sidebar from './Sidebar'
import CartPanel from '../features/CartPanel'
import WishlistCartPanel from '../features/WishlistCartPanel'

export default function AppShell() {
  return (
    <div className="h-screen flex flex-col bg-zinc-50">
      <Sidebar />

      <div className="md:pl-60 flex-1 min-h-0">
        <main className="h-full max-w-md mx-auto pb-nav md:max-w-none md:pb-0 md:p-8 md:flex md:flex-col">
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
