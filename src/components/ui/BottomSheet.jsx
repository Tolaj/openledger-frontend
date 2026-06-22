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
    <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center md:p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative bg-white w-full rounded-t-3xl md:rounded-2xl max-h-[92vh] flex flex-col shadow-2xl md:max-w-md animate-[slideUp_0.25s_ease-out] overflow-hidden">
        {/* Drag handle (mobile only) */}
        <div className="md:hidden flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-9 h-1 rounded-full bg-zinc-200" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-2 pb-3 flex-shrink-0 border-b border-zinc-100">
          {title ? (
            <h2 className="text-base font-semibold text-zinc-900">{title}</h2>
          ) : (
            <div />
          )}
          <button
            onClick={onClose}
            className="ml-auto w-8 h-8 flex items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-100 active:bg-zinc-100 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto px-4 py-4 flex-1 min-h-0">
          {children}
        </div>

        {/* Pinned footer */}
        {footer && (
          <div className="flex-shrink-0 px-4 py-4 border-t border-zinc-100 bg-white" style={{ paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))' }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
