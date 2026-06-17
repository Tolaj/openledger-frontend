import { forwardRef } from 'react'

const Input = forwardRef(function Input({ label, error, className = '', ...props }, ref) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-zinc-700">{label}</label>
      )}
      <input
        ref={ref}
        className={[
          'h-11 w-full rounded-xl border bg-white px-3 text-sm text-zinc-900',
          'placeholder:text-zinc-400 outline-none transition-colors',
          'focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900',
          error ? 'border-red-400' : 'border-zinc-300',
          className,
        ].join(' ')}
        {...props}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
})

export default Input
