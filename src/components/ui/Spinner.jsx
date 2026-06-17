export default function Spinner({ className = '' }) {
  return (
    <div className={['flex items-center justify-center', className].join(' ')}>
      <span className="h-6 w-6 border-2 border-zinc-200 border-t-zinc-900 rounded-full animate-spin" />
    </div>
  )
}
