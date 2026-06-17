export default function Card({ children, className = '', onClick }) {
  return (
    <div
      onClick={onClick}
      className={[
        'bg-white rounded-2xl border border-zinc-200 p-4',
        onClick ? 'cursor-pointer active:bg-zinc-50 transition-colors' : '',
        className,
      ].join(' ')}
    >
      {children}
    </div>
  )
}
