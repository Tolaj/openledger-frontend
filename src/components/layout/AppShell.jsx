import { Outlet } from 'react-router-dom'
import BottomNav from './BottomNav'
import Sidebar from './Sidebar'

export default function AppShell() {
  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Desktop sidebar */}
      <Sidebar />

      {/* Mobile: full width, pad bottom for nav. Desktop: pad left for sidebar */}
      <div className="md:pl-60">
        <main className="max-w-md mx-auto pb-nav md:max-w-none md:pb-0 md:p-8">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom nav only */}
      <div className="md:hidden">
        <BottomNav />
      </div>
    </div>
  )
}
