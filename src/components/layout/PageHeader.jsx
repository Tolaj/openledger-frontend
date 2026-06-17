export default function PageHeader({ title, subtitle, action }) {
  return (
    <div className="hidden md:flex items-start justify-between mb-6">
      <div>
        <h1 className="text-xl font-bold text-zinc-900">{title}</h1>
        {subtitle && <p className="text-sm text-zinc-500 mt-0.5">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}
