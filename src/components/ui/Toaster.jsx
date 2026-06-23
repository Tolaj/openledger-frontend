import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X, CheckCircle2, XCircle, Info, AlertTriangle } from 'lucide-react'
import useToastStore from '../../store/toastStore'

const ICONS = {
  success: { Icon: CheckCircle2, bg: 'bg-emerald-50', border: 'border-emerald-200', icon: 'text-emerald-500', text: 'text-emerald-900' },
  error:   { Icon: XCircle,      bg: 'bg-red-50',     border: 'border-red-200',     icon: 'text-red-500',     text: 'text-red-900'     },
  warning: { Icon: AlertTriangle,bg: 'bg-amber-50',   border: 'border-amber-200',   icon: 'text-amber-500',   text: 'text-amber-900'   },
  info:    { Icon: Info,         bg: 'bg-blue-50',    border: 'border-blue-200',    icon: 'text-blue-500',    text: 'text-blue-900'    },
}

function ToastItem({ toast, onRemove }) {
  const { Icon, bg, border, icon, text } = ICONS[toast.type] || ICONS.info
  const timerRef = useRef(null)

  useEffect(() => {
    timerRef.current = setTimeout(() => onRemove(toast.id), toast.duration ?? 3500)
    return () => clearTimeout(timerRef.current)
  }, [toast.id, toast.duration, onRemove])

  return (
    <div
      className={`
        flex items-start gap-3 w-full max-w-sm px-4 py-3 rounded-2xl border shadow-lg
        ${bg} ${border}
        animate-[toast-in_0.22s_cubic-bezier(0.34,1.56,0.64,1)_both]
      `}
      role="alert"
    >
      <Icon size={18} className={`flex-shrink-0 mt-0.5 ${icon}`} />
      <p className={`flex-1 text-sm font-medium leading-snug ${text}`}>{toast.message}</p>
      <button
        onClick={() => onRemove(toast.id)}
        className={`flex-shrink-0 mt-0.5 ${icon} opacity-60 hover:opacity-100 transition-opacity`}
      >
        <X size={14} />
      </button>
    </div>
  )
}

export default function Toaster() {
  const toasts = useToastStore((s) => s.toasts)
  const remove  = useToastStore((s) => s.remove)

  return createPortal(
    <>
      {/* Desktop: top-right stack */}
      <div className="hidden md:flex fixed top-5 right-5 z-[200] flex-col gap-2 items-end">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onRemove={remove} />
        ))}
      </div>

      {/* Mobile: bottom stack (above nav bar) */}
      <div
        className="flex md:hidden fixed left-3 right-3 z-[200] flex-col gap-2 items-stretch"
        style={{ bottom: 'calc(env(safe-area-inset-bottom) + 4.5rem)' }}
      >
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onRemove={remove} />
        ))}
      </div>
    </>,
    document.body
  )
}
