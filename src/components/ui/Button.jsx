const variants = {
  primary: 'bg-zinc-900 text-white active:bg-zinc-700',
  secondary: 'bg-zinc-100 text-zinc-900 active:bg-zinc-200',
  ghost: 'bg-transparent text-zinc-900 active:bg-zinc-100',
  danger: 'bg-red-500 text-white active:bg-red-600',
  outline: 'border border-zinc-300 bg-white text-zinc-900 active:bg-zinc-50',
}

const sizes = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-11 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
  icon: 'h-11 w-11',
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  loading = false,
  disabled = false,
  fullWidth = false,
  ...props
}) {
  return (
    <button
      disabled={disabled || loading}
      className={[
        'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-colors',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        fullWidth ? 'w-full' : '',
        variants[variant],
        sizes[size],
        className,
      ].join(' ')}
      {...props}
    >
      {loading ? (
        <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        children
      )}
    </button>
  )
}
