const variants = {
  default: 'bg-zinc-100 text-zinc-700',
  dark: 'bg-zinc-900 text-white',
  success: 'bg-emerald-50 text-emerald-700',
  warning: 'bg-amber-50 text-amber-700',
  danger: 'bg-red-50 text-red-600',
}

export default function Badge({ children, variant = 'default', className = '' }) {
  return (
    <span
      className={[
        'inline-flex items-center rounded-lg px-2 py-0.5 text-xs font-medium',
        variants[variant],
        className,
      ].join(' ')}
    >
      {children}
    </span>
  )
}
