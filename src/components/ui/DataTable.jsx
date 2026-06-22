import { useState, useRef, useEffect } from 'react'

const PAGE_SIZE = 20

function ColFilterDropdown({ options = [], selected = [], onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const h = (e) => { if (!ref.current?.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])

  const toggle = (val) =>
    onChange(selected.includes(val) ? selected.filter((v) => v !== val) : [...selected, val])

  return (
    <div ref={ref} className="relative flex-shrink-0">
      <button
        onClick={() => setOpen((o) => !o)}
        className={`flex-shrink-0 transition-colors ${selected.length > 0 ? 'text-zinc-600' : 'text-zinc-300 hover:text-zinc-500'}`}
      >
        {/* funnel icon */}
        <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
          <path d="M1.5 3h13l-5 6v5l-3-1.5V9L1.5 3Z" />
        </svg>
      </button>
      {open && options.length > 0 && (
        <div className="absolute right-0 top-full mt-1 bg-white border border-zinc-200 rounded-xl shadow-xl z-50 min-w-[150px] py-1">
          {options.map((opt) => (
            <button
              key={opt}
              onClick={() => toggle(opt)}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-zinc-700 hover:bg-zinc-50 text-left"
            >
              <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${selected.includes(opt) ? 'bg-zinc-900 border-zinc-900' : 'border-zinc-300'
                }`}>
                {selected.includes(opt) && (
                  <svg viewBox="0 0 10 10" className="w-2 h-2 text-white" fill="none" stroke="currentColor" strokeWidth={2.5}>
                    <path d="M1.5 5l2.5 2.5 4.5-4.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </span>
              <span className="truncate max-w-[120px]">{opt}</span>
            </button>
          ))}
          {selected.length > 0 && (
            <>
              <div className="mx-2 my-1 border-t border-zinc-100" />
              <button onClick={() => { onChange([]); setOpen(false) }} className="w-full px-3 py-1 text-xs text-zinc-400 hover:text-zinc-600 text-left">
                Clear
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

function Pagination({ page, total, pageSize, onChange }) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, total)
  return (
    <div className="flex items-center justify-between px-2 py-3 flex-shrink-0">
      <p className="text-xs text-zinc-400">
        {total === 0 ? 'No results' : `${start}–${end} of ${total}`}
      </p>
      <div className="flex items-center gap-1.5">
        <button onClick={() => onChange(page - 1)} disabled={page === 1}
          className="px-3 py-1.5 text-xs rounded-lg border border-zinc-200 bg-white disabled:opacity-30 hover:bg-zinc-50 transition-colors text-zinc-600">Prev</button>
        <span className="text-xs text-zinc-400 min-w-[60px] text-center">{page} / {totalPages}</span>
        <button onClick={() => onChange(page + 1)} disabled={page === totalPages}
          className="px-3 py-1.5 text-xs rounded-lg border border-zinc-200 bg-white disabled:opacity-30 hover:bg-zinc-50 transition-colors text-zinc-600">Next</button>
      </div>
    </div>
  )
}

/**
 * columns: Array of { key, label, filterable?, noDropdown?, width? }
 *   - key: the filter key (null/undefined = no filter cell rendered)
 *   - label: column header text
 *   - filterable: show text input in filter row
 *   - noDropdown: show text input but no ColFilterDropdown
 *   - width: optional tailwind width class on th
 *
 * data: full (already externally filtered) array for pagination count
 *
 * filters: { [key]: string } — text filter values
 * onFilterChange: (key, value) => void
 *
 * dropOpts: { [key]: string[] } — dropdown options per column
 * dropSel: { [key]: string[] } — selected dropdown values per column
 * onDropChange: (key, values) => void
 *
 * renderRow: (item, index) => ReactNode — renders one or more <tr> elements
 *
 * emptyMessage: string shown when data is empty
 *
 * leadingCol: boolean — adds a narrow leading column (for expand chevrons)
 * pageSize: override default PAGE_SIZE
 */
export function DataTableMobileFilters({ columns = [], filters = {}, onFilterChange, dropOpts = {}, dropSel = {}, onDropChange, open }) {
  const filterableCols = columns.filter((c) => c.filterable)
  if (!open || filterableCols.length === 0) return null
  return (
    <div className="md:hidden mb-3 bg-white rounded-2xl border border-zinc-200 p-3 flex flex-col gap-2">
      {filterableCols.map((col) => (
        <div key={col.key} className="flex flex-col gap-1">
          <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wide">{col.label}</label>
          <div className="flex items-center bg-white border border-zinc-200 rounded-lg px-2 py-1.5 gap-1.5 focus-within:border-zinc-400">
            <input
              value={filters[col.key] ?? ''}
              onChange={(e) => onFilterChange?.(col.key, e.target.value)}
              placeholder={`Filter ${col.label}…`}
              className="flex-1 text-xs bg-transparent outline-none placeholder-zinc-300 min-w-0"
            />
            {!col.noDropdown && (
              <ColFilterDropdown
                options={dropOpts[col.key] || []}
                selected={dropSel[col.key] || []}
                onChange={(vals) => onDropChange?.(col.key, vals)}
              />
            )}
          </div>
        </div>
      ))}
      {filterableCols.some((c) => filters[c.key] || dropSel[c.key]?.length) && (
        <button
          onClick={() => filterableCols.forEach((c) => { onFilterChange?.(c.key, ''); onDropChange?.(c.key, []) })}
          className="text-xs text-zinc-400 hover:text-zinc-600 text-left pt-1"
        >Clear all filters</button>
      )}
    </div>
  )
}

export default function DataTable({
  columns = [],
  data = [],
  filters = {},
  onFilterChange,
  dropOpts = {},
  dropSel = {},
  onDropChange,
  renderRow,
  emptyMessage = 'No data',
  leadingCol = false,
  pageSize = PAGE_SIZE,
}) {
  const [page, setPage] = useState(1)

  useEffect(() => { setPage(1) }, [data.length])

  const paginated = data.slice((page - 1) * pageSize, page * pageSize)
  const colSpan = columns.length + (leadingCol ? 1 : 0) + 1

  return (
    <div className="hidden md:flex md:flex-col md:flex-1 md:min-h-0 md:gap-2">
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden rounded-2xl border border-zinc-200 bg-white">
        <table className="w-full table-fixed text-sm border-separate border-spacing-0">
          <thead className="sticky top-0 z-10 bg-white">
            {/* Column headers */}
            <tr className="border-b border-zinc-200 bg-white">
              {leadingCol && <th className="w-8 px-3 py-3 border-r border-zinc-200" />}
              {columns.map((col, i) => (
                <th
                  key={col.key ?? col.label ?? i}
                  className={`px-3 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wide border-b border-zinc-200 ${col.width ?? ''} ${i < columns.length - 1 ? 'border-r border-zinc-200' : ''}`}
                >
                  {col.label}
                </th>
              ))}
            </tr>
            {/* Filter row — only render if at least one column is filterable */}
            {columns.some((c) => c.filterable) && (
              <tr className="border-b border-zinc-200 bg-zinc-50">
                {leadingCol && <td className="border-r border-zinc-200 border-b border-zinc-200" />}
                {columns.map((col, i) => (
                  <td
                    key={col.key ?? col.label ?? i}
                    className={`px-3 py-2 border-b border-zinc-200 ${i < columns.length - 1 ? 'border-r border-zinc-200' : ''}`}
                  >
                    {col.filterable && (
                      <div className="flex items-center bg-white border border-zinc-200 rounded-lg px-2 py-1.5 gap-1.5 focus-within:border-zinc-400">
                        <input
                          value={filters[col.key] ?? ''}
                          onChange={(e) => onFilterChange?.(col.key, e.target.value)}
                          placeholder="Filter…"
                          className="flex-1 text-xs bg-transparent outline-none placeholder-zinc-300 min-w-0"
                        />
                        {!col.noDropdown && (
                          <ColFilterDropdown
                            options={dropOpts[col.key] || []}
                            selected={dropSel[col.key] || []}
                            onChange={(vals) => onDropChange?.(col.key, vals)}
                          />
                        )}
                      </div>
                    )}
                  </td>
                ))}
              </tr>
            )}
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={colSpan} className="px-4 py-8 text-center text-sm text-zinc-400">
                  {data.length === 0 ? emptyMessage : 'No items match the filter'}
                </td>
              </tr>
            ) : paginated.map((item, idx) => renderRow(item, idx))}
          </tbody>
        </table>
      </div>
      <Pagination page={page} total={data.length} pageSize={pageSize} onChange={setPage} />
    </div>
  )
}

export function DataTableFilterIcon({ open, onChange, activeCount = 0 }) {
  return (
    <button
      onClick={() => onChange(!open)}
      className="relative p-2 rounded-xl active:bg-zinc-100"
    >
      <svg viewBox="0 0 16 16" fill="currentColor" className={`w-5 h-5 transition-colors ${activeCount > 0 ? 'text-zinc-900' : 'text-zinc-500'}`}>
        <path d="M1.5 3h13l-5 6v5l-3-1.5V9L1.5 3Z" />
      </svg>
      {activeCount > 0 && (
        <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-zinc-900" />
      )}
    </button>
  )
}
