import { useLocation } from 'react-router-dom'
import { Construction } from 'lucide-react'
import TopBar from '../components/layout/TopBar'
import PageHeader from '../components/layout/PageHeader'
import PageActions from '../components/layout/PageActions'

export default function ComingSoon() {
  const { pathname } = useLocation()
  const name = pathname.replace('/', '').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Page'

  return (
    <>
      <TopBar title={name} />
      <div className="flex flex-col flex-1 min-h-0">
        <PageHeader title={name} action={<PageActions />} />
        <div className="flex-1 flex flex-col items-center justify-center gap-4 pb-20">
          <div className="w-16 h-16 rounded-2xl bg-zinc-100 flex items-center justify-center">
            <Construction size={28} className="text-zinc-400" />
          </div>
          <div className="text-center">
            <p className="text-base font-semibold text-zinc-900">{name} — Coming Soon</p>
            <p className="text-sm text-zinc-400 mt-1">This ERP module is under construction</p>
          </div>
        </div>
      </div>
    </>
  )
}
