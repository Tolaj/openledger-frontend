import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export default function TopBar({ title, back = false, right }) {
  const navigate = useNavigate()

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-zinc-100 md:hidden">
      <div className="flex items-center h-14 px-4 max-w-md mx-auto gap-3">
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
        {right && <div className="flex items-center gap-1">{right}</div>}
      </div>
    </header>
  )
}
