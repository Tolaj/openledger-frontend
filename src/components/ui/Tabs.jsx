/**
 * Tabs — pill-style tab bar matching the General page design.
 *
 * Props:
 *   tabs    — array of { key, label, icon? (lucide component) }
 *   active  — currently active tab key
 *   onChange — (key) => void
 *   className — optional extra class on the wrapper
 */
export default function Tabs({ tabs = [], active, onChange, className = '' }) {
  return (
    <div className={`flex gap-1 bg-zinc-100 rounded-xl p-1 w-fit flex-shrink-0 ${className}`}>
      {tabs.map((tab) => {
        const Icon = tab.icon
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onChange(tab.key)}
            className={[
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap outline-none focus:outline-none focus-visible:outline-none',
              active === tab.key
                ? 'bg-white text-zinc-900 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-700',
            ].join(' ')}
          >
            {Icon && <Icon size={14} />}
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
