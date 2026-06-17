export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-6">
      {Icon && (
        <div className="w-14 h-14 rounded-2xl bg-zinc-100 flex items-center justify-center mb-4">
          <Icon size={24} className="text-zinc-400" />
        </div>
      )}
      <p className="text-base font-semibold text-zinc-900">{title}</p>
      {description && (
        <p className="text-sm text-zinc-500 mt-1">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
