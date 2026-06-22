export default function Tabs({ tabs = [], active, onChange, className = '' }) {
  return (
    <div className={`flex gap-1 overflow-x-auto scrollbar-none flex-1 min-w-0 md:w-fit md:flex-none ${className}`}>
      {tabs.map((tab) => {
        const Icon = tab.icon
        const isActive = active === tab.key
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onChange(tab.key)}
            className={[
              'flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all whitespace-nowrap outline-none focus:outline-none focus-visible:outline-none',
              isActive
                ? 'bg-zinc-900 text-white shadow-sm'
                : 'bg-white text-zinc-500 shadow-[0_1px_4px_rgba(0,0,0,0.07)]',
            ].join(' ')}
          >
            {Icon && <Icon size={14} />}
            <span className="md:hidden">{tab.mobileLabel ?? tab.label}</span>
            <span className="hidden md:inline">{tab.label}</span>
          </button>
        )
      })}
    </div>
  )
}
