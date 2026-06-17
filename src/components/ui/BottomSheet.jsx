import { useEffect } from 'react'
import { X } from 'lucide-react'

export default function BottomSheet({ open, onClose, title, children, footer }) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative bg-white w-full rounded-2xl max-h-[90vh] flex flex-col shadow-2xl max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2 flex-shrink-0 border-b border-zinc-100">
          {title ? (
            <h2 className="text-base font-semibold text-zinc-900">{title}</h2>
          ) : (
            <div />
          )}
          <button
            onClick={onClose}
            className="ml-auto p-1.5 rounded-lg text-zinc-500 hover:bg-zinc-100 active:bg-zinc-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable content — min-h-0 forces it to shrink so footer stays visible */}
        <div className="overflow-y-auto px-4 py-4 flex-1 min-h-0">
          {children}
        </div>

        {/* Pinned footer */}
        {footer && (
          <div className="flex-shrink-0 px-4 py-4 border-t border-zinc-100 bg-white rounded-b-2xl">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
