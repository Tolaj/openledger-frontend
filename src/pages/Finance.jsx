import { useState, useMemo, useEffect, useRef, Fragment } from 'react'
import { createPortal } from 'react-dom'
import { useForm, useFieldArray } from 'react-hook-form'
import {
  TrendingUp, TrendingDown, Landmark, BarChart3,
  Plus, Pencil, Trash2, CheckCircle2, CircleDollarSign,
  ChevronDown, Wallet, FileText, ReceiptText,
  AlertTriangle, X,
} from 'lucide-react'
import TopBar from '../components/layout/TopBar'
import PageHeader from '../components/layout/PageHeader'
import PageActions from '../components/layout/PageActions'
import DataTable, { DataTableMobileFilters, DataTableFilterIcon } from '../components/ui/DataTable'
import BottomSheet from '../components/ui/BottomSheet'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Spinner from '../components/ui/Spinner'
import EmptyState from '../components/ui/EmptyState'
import useGroupStore from '../store/groupStore'
import { useMe } from '../hooks/useUser'
import {
  useFinance, useFinanceSummary, useCreateFinance, useUpdateFinance, useDeleteFinance, useSettleDebt,
  useBudgets, useCreateBudget, useUpdateBudget, useDeleteBudget,
} from '../hooks/useFinance'
import { useSalesInvoices } from '../hooks/useSalesInvoices'
import { usePurchaseInvoices } from '../hooks/usePurchaseInvoices'
import { useOrders } from '../hooks/useOrders'
import { useGroups } from '../hooks/useGroups'
import { useCategories } from '../hooks/useCategories'
import { useProducts } from '../hooks/useProducts'
import { useCurrencySymbol } from '../hooks/useCurrency'
import { useIsBusiness } from '../hooks/useActiveGroupType'
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear, differenceInDays, parseISO } from 'date-fns'

// ── Constants ─────────────────────────────────────────────────────────────────
const PERSONAL_TABS = [
  { key: 'overview', label: 'Overview', mobileLabel: 'Overview' },
  { key: 'transactions', label: 'Transactions', mobileLabel: 'Txns' },
  { key: 'budgets', label: 'Budgets', mobileLabel: 'Budgets' },
  { key: 'debts', label: 'Debts', mobileLabel: 'Debts' },
]
const BUSINESS_TABS = [
  { key: 'overview', label: 'Overview', mobileLabel: 'Overview' },
  { key: 'transactions', label: 'Transactions', mobileLabel: 'Txns' },
  { key: 'budgets', label: 'Budgets', mobileLabel: 'Budgets' },
  { key: 'debts', label: 'AR / AP', mobileLabel: 'AR/AP' },
]

const PERIODS = [
  { key: 'week', label: 'This Week' },
  { key: 'month', label: 'This Month' },
  { key: 'quarter', label: 'Quarter' },
  { key: 'year', label: 'This Year' },
  { key: 'custom', label: 'Custom' },
]

const TYPE_META = {
  income: { label: 'Income', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
  expense: { label: 'Expense', icon: TrendingDown, color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-100' },
  loan: { label: 'Loan', icon: Landmark, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
  investment: { label: 'Investment', icon: BarChart3, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
}

const CURRENCIES = [
  { code: 'INR', symbol: '₹', label: '₹ INR — Indian Rupee' },
  { code: 'USD', symbol: '$', label: '$ USD — US Dollar' },
  { code: 'EUR', symbol: '€', label: '€ EUR — Euro' },
  { code: 'GBP', symbol: '£', label: '£ GBP — British Pound' },
  { code: 'JPY', symbol: '¥', label: '¥ JPY — Japanese Yen' },
  { code: 'AUD', symbol: 'A$', label: 'A$ AUD — Australian Dollar' },
]

// ── Helpers ───────────────────────────────────────────────────────────────────
function getPeriodDates(period, custom) {
  const now = new Date()
  switch (period) {
    case 'week': return { startDate: startOfWeek(now).toISOString(), endDate: endOfWeek(now).toISOString() }
    case 'month': return { startDate: startOfMonth(now).toISOString(), endDate: endOfMonth(now).toISOString() }
    case 'quarter': return { startDate: startOfQuarter(now).toISOString(), endDate: endOfQuarter(now).toISOString() }
    case 'year': return { startDate: startOfYear(now).toISOString(), endDate: endOfYear(now).toISOString() }
    case 'custom': return { startDate: custom.start, endDate: custom.end }
    default: return {}
  }
}

function fmt(amount, symbol) {
  return `${symbol}${Number(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatDate(d) {
  return d ? format(new Date(d), 'dd MMM yyyy') : '—'
}

function ProgressBar({ value, max, color = 'bg-emerald-500' }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0
  const danger = pct >= 90
  return (
    <div className="w-full bg-zinc-100 rounded-full h-1.5 overflow-hidden">
      <div
        className={`h-full rounded-full transition-all ${danger ? 'bg-red-500' : color}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

// ── Period Picker ─────────────────────────────────────────────────────────────
function PeriodPicker({ period, setPeriod, custom, setCustom }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-1.5 flex-wrap">
        {PERIODS.map((p) => (
          <button
            key={p.key}
            onClick={() => setPeriod(p.key)}
            className={[
              'px-3 py-1 rounded-full text-xs font-semibold border transition-all',
              period === p.key
                ? 'bg-zinc-900 text-white border-zinc-900'
                : 'bg-white text-zinc-500 border-zinc-200 active:bg-zinc-100',
            ].join(' ')}
          >
            {p.label}
          </button>
        ))}
      </div>
      {period === 'custom' && (
        <div className="flex gap-2 items-center">
          <input
            type="date"
            value={custom.start?.slice(0, 10) || ''}
            onChange={(e) => setCustom((c) => ({ ...c, start: new Date(e.target.value).toISOString() }))}
            className="flex-1 text-xs border border-zinc-200 rounded-lg px-2 py-1.5 outline-none focus:border-zinc-900"
          />
          <span className="text-xs text-zinc-400">to</span>
          <input
            type="date"
            value={custom.end?.slice(0, 10) || ''}
            onChange={(e) => setCustom((c) => ({ ...c, end: new Date(e.target.value).toISOString() }))}
            className="flex-1 text-xs border border-zinc-200 rounded-lg px-2 py-1.5 outline-none focus:border-zinc-900"
          />
        </div>
      )}
    </div>
  )
}

// ── Mobile Filter Panel ───────────────────────────────────────────────────────
function FinanceMobileFilters({ open, period, setPeriod, custom, setCustom, typeFilter, setTypeFilter, showTypeFilter = false }) {
  if (!open) return null
  const hasActive = period !== 'month' || (showTypeFilter && typeFilter)
  return (
    <div className="md:hidden mb-3 bg-white rounded-2xl border border-zinc-200 p-3 flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wide">Period</label>
        <PeriodPicker period={period} setPeriod={setPeriod} custom={custom} setCustom={setCustom} />
      </div>
      {showTypeFilter && (
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wide">Type</label>
          <div className="flex gap-1.5 flex-wrap">
            <button onClick={() => setTypeFilter('')}
              className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${!typeFilter ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-white text-zinc-500 border-zinc-200'}`}>
              All
            </button>
            {Object.entries(TYPE_META).map(([key, meta]) => (
              <button key={key} onClick={() => setTypeFilter(key === typeFilter ? '' : key)}
                className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${typeFilter === key ? `${meta.bg} ${meta.color} ${meta.border}` : 'bg-white text-zinc-500 border-zinc-200'}`}>
                {meta.label}
              </button>
            ))}
          </div>
        </div>
      )}
      {hasActive && (
        <button onClick={() => { setPeriod('month'); setTypeFilter?.('') }}
          className="text-xs text-zinc-400 hover:text-zinc-600 text-left">
          Clear filters
        </button>
      )}
    </div>
  )
}

// ── Transaction Form ──────────────────────────────────────────────────────────
function TransactionForm({ open, onClose, editing, groupId, groupMembers = [], categories = [], symbol, isBusiness = false }) {
  const { mutate: create, isPending: creating } = useCreateFinance()
  const { mutate: update, isPending: updating } = useUpdateFinance()
  const { data: products = [] } = useProducts()
  const { register, handleSubmit, watch, setValue, control, reset, formState: { errors } } = useForm({
    defaultValues: { type: 'expense', amount: '', description: '', date: format(new Date(), 'yyyy-MM-dd'), category: '', paidBy: '', splitAmong: [], items: [] },
  })
  const { fields: itemFields, append: appendItem, remove: removeItem } = useFieldArray({ control, name: 'items' })

  const splitAmong = watch('splitAmong') || []
  const watchedItems = watch('items') || []
  const watchedCategory = watch('category')
  const amount = parseFloat(watch('amount')) || 0
  const paidBy = watch('paidBy')
  const hasItems = watchedItems.length > 0

  // Auto-sum items → amount field whenever any item field changes
  useEffect(() => {
    if (!watchedItems.length) return
    const total = watchedItems.reduce((sum, it) => {
      const qty = parseFloat(it?.qty) || 0
      const unitPrice = parseFloat(it?.unitPrice) || 0
      const taxRate = parseFloat(it?.taxRate) || 0
      return sum + qty * unitPrice * (1 + taxRate / 100)
    }, 0)
    setValue('amount', parseFloat(total.toFixed(2)), { shouldValidate: true })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(watchedItems)])

  // when editing populate form
  useEffect(() => {
    if (!open) return
    if (editing) {
      reset({
        type: editing.type,
        amount: editing.amount,
        description: editing.description || '',
        date: editing.date ? format(new Date(editing.date), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
        category: editing.category?._id || editing.category || '',
        paidBy: editing.paidBy?._id || editing.paidBy || '',
        splitAmong: (editing.splitAmong || []).map((s) => ({ user: s.user?._id || s.user, amount: s.amount })),
        items: (editing.items || []).map((it) => ({ product: '', name: it.name || '', qty: it.qty || 1, unitPrice: it.amount && it.qty ? (it.amount / it.qty).toFixed(2) : it.amount || '', taxRate: 0, amount: it.amount || 0, category: it.category?._id || it.category || '' })),
      })
    } else {
      reset({ type: 'expense', amount: '', description: '', date: format(new Date(), 'yyyy-MM-dd'), category: '', paidBy: '', splitAmong: [], items: [] })
    }
  }, [editing, open])

  const toggleMember = (memberId) => {
    const exists = splitAmong.find((s) => s.user === memberId)
    if (exists) {
      setValue('splitAmong', splitAmong.filter((s) => s.user !== memberId))
    } else {
      const share = splitAmong.length > 0 ? amount / (splitAmong.length + 1) : amount
      setValue('splitAmong', [...splitAmong, { user: memberId, amount: share }])
    }
  }

  const equalSplit = () => {
    if (splitAmong.length === 0 || amount === 0) return
    const share = amount / splitAmong.length
    setValue('splitAmong', splitAmong.map((s) => ({ ...s, amount: share })))
  }

  const onSubmit = (data) => {
    const payload = {
      ...data,
      amount: parseFloat(data.amount),
      group: groupId,
      date: new Date(data.date).toISOString(),
      splitAmong: data.splitAmong.map((s) => ({ user: s.user, amount: parseFloat(s.amount) })),
      items: (data.items || []).filter((it) => it.name).map((it) => {
        const qty = parseFloat(it.qty) || 1
        const unitPrice = parseFloat(it.unitPrice) || 0
        const taxRate = parseFloat(it.taxRate) || 0
        return {
          name: it.name,
          qty,
          amount: qty * unitPrice * (1 + taxRate / 100),
          category: it.category || undefined,
        }
      }),
    }
    if (editing) {
      update({ id: editing._id, data: payload }, { onSuccess: onClose })
    } else {
      create(payload, { onSuccess: onClose })
    }
  }

  return (
    <BottomSheet open={open} onClose={onClose} title={editing ? 'Edit Transaction' : 'New Transaction'}
      footer={<Button type="submit" form="txn-form" fullWidth loading={creating || updating}>{editing ? 'Save' : 'Add Transaction'}</Button>}
    >
      <form id="txn-form" onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        {/* Type */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-zinc-700">Type</label>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(TYPE_META).map(([key, meta]) => {
              const Icon = meta.icon
              const selected = watch('type') === key
              return (
                <button
                  key={key} type="button"
                  onClick={() => setValue('type', key)}
                  className={['flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-all',
                    selected ? `${meta.bg} ${meta.border} ${meta.color} border-2` : 'border-zinc-200 text-zinc-500',
                  ].join(' ')}
                >
                  <Icon size={15} /> {meta.label}
                </button>
              )
            })}
          </div>
        </div>

        <Input label="Amount" type="number" step="0.01" placeholder="0.00"
          error={errors.amount?.message}
          {...register('amount', { required: 'Amount required', min: { value: 0.01, message: 'Must be > 0' } })}
        />
        <Input label="Description" placeholder="What was this for?" {...register('description')} />
        <Input label="Date" type="date" {...register('date')} />

        {/* Category — hidden when items are added */}
        {!hasItems && (
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700">Category</label>
            <CategoryCombobox
              globalCategories={categories}
              value={categories.find((c) => c._id === watchedCategory)?.name || ''}
              categoryRef={watchedCategory || ''}
              onChange={({ name, categoryRef }) => {
                const match = categories.find((c) => c._id === categoryRef || c.name === name)
                setValue('category', match?._id || '')
              }}
            />
          </div>
        )}

        {/* Paid By — personal groups only */}
        {!isBusiness && groupMembers.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700">Paid by</label>
            <select {...register('paidBy')} className="h-11 px-3 rounded-xl border border-zinc-300 bg-white text-sm outline-none focus:border-zinc-900">
              <option value="">Select person</option>
              {groupMembers.map((m) => <option key={m._id} value={m._id}>{m.name || m.email}</option>)}
            </select>
          </div>
        )}

        {/* Split Among — personal groups only */}
        {!isBusiness && groupMembers.length > 0 && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-zinc-700">Split among</label>
              {splitAmong.length > 0 && (
                <button type="button" onClick={equalSplit} className="text-xs text-zinc-500 underline">Equal split</button>
              )}
            </div>
            <div className="flex flex-col gap-1">
              {groupMembers.map((m) => {
                const selected = splitAmong.find((s) => s.user === m._id)
                return (
                  <div key={m._id} className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => toggleMember(m._id)}
                      className={['flex-1 flex items-center gap-2 px-3 py-2 rounded-xl border text-sm transition-all',
                        selected ? 'border-zinc-900 bg-zinc-50' : 'border-zinc-200',
                      ].join(' ')}
                    >
                      <div className={['w-4 h-4 rounded border flex items-center justify-center flex-shrink-0',
                        selected ? 'bg-zinc-900 border-zinc-900' : 'border-zinc-300',
                      ].join(' ')}>
                        {selected && <CheckCircle2 size={10} className="text-white" />}
                      </div>
                      <span className="truncate">{m.name || m.email}</span>
                    </button>
                    {selected && (
                      <input
                        type="number" step="0.01"
                        value={selected.amount}
                        onChange={(e) => setValue('splitAmong', splitAmong.map((s) => s.user === m._id ? { ...s, amount: parseFloat(e.target.value) || 0 } : s))}
                        className="w-20 text-xs border border-zinc-200 rounded-lg px-2 py-1.5 outline-none focus:border-zinc-900 text-right"
                      />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Line Items */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-zinc-700">Items</label>
            <button type="button" onClick={() => appendItem({ product: '', name: '', qty: 1, unitPrice: '', taxRate: 0, amount: 0, category: '' })}
              className="text-xs text-zinc-500 underline flex items-center gap-1">
              <Plus size={12} /> Add Item
            </button>
          </div>
          {itemFields.length === 0 && (
            <p className="text-xs text-zinc-400">Optional — add items to track per-category spending</p>
          )}
          {itemFields.map((field, idx) => {
            const qty = parseFloat(watchedItems[idx]?.qty) || 0
            const unitPrice = parseFloat(watchedItems[idx]?.unitPrice) || 0
            const taxRate = parseFloat(watchedItems[idx]?.taxRate) || 0
            const lineAmt = qty * unitPrice * (1 + taxRate / 100)
            return (
              <div key={field.id} className="flex flex-col gap-3 p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                {/* From catalog / custom name */}
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <ProductCombobox
                      products={products}
                      value={watchedItems[idx]?.product || ''}
                      customName={watchedItems[idx]?.name || ''}
                      onSelect={(p) => {
                        if (p) {
                          setValue(`items.${idx}.product`, p._id)
                          setValue(`items.${idx}.name`, p.name)
                          setValue(`items.${idx}.unitPrice`, p.price ?? '')
                          setValue(`items.${idx}.category`, p.category?._id || p.category || '')
                        } else {
                          setValue(`items.${idx}.product`, '')
                        }
                      }}
                      onCustomName={(val) => {
                        setValue(`items.${idx}.name`, val)
                        setValue(`items.${idx}.product`, '')
                      }}
                    />
                  </div>
                  <button type="button" onClick={() => removeItem(idx)} className="p-1 mb-1 text-zinc-400 hover:text-red-500 flex-shrink-0">
                    <Trash2 size={14} />
                  </button>
                </div>
                <input type="hidden" {...register(`items.${idx}.name`)} />
                {/* Category */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-zinc-500">Category</label>
                  <select
                    value={watchedItems[idx]?.category || ''}
                    onChange={(e) => setValue(`items.${idx}.category`, e.target.value)}
                    className="h-9 px-3 text-sm border border-zinc-200 rounded-xl outline-none focus:border-zinc-900 bg-white"
                  >
                    <option value="">No category</option>
                    {categories.map((c) => (
                      <option key={c._id} value={c._id}>{c.icon ? `${c.icon} ` : ''}{c.name}</option>
                    ))}
                  </select>
                </div>
                {/* Qty / Unit Price / Tax */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-zinc-500">Qty</label>
                    <input {...register(`items.${idx}.qty`)} type="number" step="1" min="0" placeholder="1"
                      className="h-9 px-3 text-sm border border-zinc-200 rounded-xl outline-none focus:border-zinc-900 bg-white" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-zinc-500">Unit Price</label>
                    <input {...register(`items.${idx}.unitPrice`)} type="number" step="0.01" min="0" placeholder="0"
                      className="h-9 px-3 text-sm border border-zinc-200 rounded-xl outline-none focus:border-zinc-900 bg-white" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-zinc-500">Tax %</label>
                    <input {...register(`items.${idx}.taxRate`)} type="number" step="0.1" min="0" placeholder="0"
                      className="h-9 px-3 text-sm border border-zinc-200 rounded-xl outline-none focus:border-zinc-900 bg-white" />
                  </div>
                </div>
                {/* Computed amount */}
                <p className="text-xs text-zinc-400 text-right">
                  Amount: <span className="font-semibold text-zinc-900">{fmt(lineAmt, symbol)}</span>
                </p>
              </div>
            )
          })}
        </div>
      </form>
    </BottomSheet>
  )
}

// ── Product Combobox ──────────────────────────────────────────────────────────
function ProductCombobox({ products = [], value, customName = '', onSelect, onCustomName }) {
  const [open, setOpen] = useState(false)
  const [rect, setRect] = useState(null)
  const inputRef = useRef(null)
  const wrapRef = useRef(null)

  const selected = products.find((p) => p._id === value)

  // The text shown in the input: selected product name, or the custom name being typed
  const inputValue = selected ? selected.name : customName

  useEffect(() => {
    if (!open) return
    const h = (e) => {
      if (!wrapRef.current?.contains(e.target) && !document.getElementById('prod-combo-portal')?.contains(e.target))
        setOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])

  const openDropdown = () => {
    if (inputRef.current) setRect(inputRef.current.getBoundingClientRect())
    setOpen(true)
  }

  const handleInputChange = (e) => {
    const val = e.target.value
    // If a product was selected, typing clears the selection and switches to custom text
    if (selected) onSelect(null)
    onCustomName?.(val)
    if (!open) openDropdown()
  }

  const handleInputFocus = () => {
    if (!open) openDropdown()
  }

  const filtered = customName && !selected
    ? products.filter((p) =>
        p.name.toLowerCase().includes(customName.toLowerCase()) ||
        p.category?.name?.toLowerCase().includes(customName.toLowerCase())
      )
    : products

  const handleSelect = (p) => {
    onSelect(p)
    setOpen(false)
  }

  return (
    <div ref={wrapRef} className="flex flex-col gap-1">
      <label className="text-xs font-medium text-zinc-500">Item</label>
      <div className="relative">
        {/* Show category icon badge when a catalog product is selected */}
        {selected?.category?.icon && (
          <span
            className="absolute left-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded flex items-center justify-center text-sm flex-shrink-0 pointer-events-none"
            style={{ backgroundColor: selected.category?.color ? `${selected.category.color}22` : '#f4f4f5' }}
          >
            {selected.category.icon}
          </span>
        )}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          placeholder="Type item name or search catalog…"
          className={[
            'h-9 w-full px-3 text-sm border rounded-xl outline-none bg-white transition-colors',
            selected?.category?.icon ? 'pl-9' : '',
            open ? 'border-zinc-900' : 'border-zinc-200 focus:border-zinc-900',
          ].join(' ')}
        />
        {selected && (
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => { onSelect(null); onCustomName?.('') }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
          >
            <X size={13} />
          </button>
        )}
      </div>

      {open && rect && createPortal(
        <div
          id="prod-combo-portal"
          style={{
            position: 'fixed',
            left: rect.left,
            width: rect.width,
            zIndex: 9999,
            maxHeight: 280,
            ...(rect.bottom + 280 > window.innerHeight
              ? { bottom: window.innerHeight - rect.top + 4 }
              : { top: rect.bottom + 4 }),
          }}
          className="bg-white border border-zinc-200 rounded-xl shadow-xl overflow-y-auto flex flex-col"
        >
          {filtered.map((p) => (
            <button
              key={p._id}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleSelect(p)}
              className={[
                'w-full px-3 py-2.5 flex items-center gap-3 hover:bg-zinc-50 border-b border-zinc-100 last:border-0 text-left',
                value === p._id ? 'bg-zinc-50' : '',
              ].join(' ')}
            >
              <span
                className="w-7 h-7 rounded-lg flex items-center justify-center text-base flex-shrink-0"
                style={{ backgroundColor: p.category?.color ? `${p.category.color}22` : '#f4f4f5' }}
              >
                {p.category?.icon || '📦'}
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-medium text-zinc-900 truncate">{p.name}</span>
                {p.category?.name && <span className="block text-xs text-zinc-400">{p.category.name}</span>}
              </span>
              <span className="flex-shrink-0 text-right">
                <span className="block text-sm font-semibold text-zinc-900">${Number(p.price || 0).toFixed(2)}</span>
                {p.unit && <span className="block text-xs text-zinc-400">{p.unit}</span>}
              </span>
            </button>
          ))}
          {filtered.length === 0 && (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setOpen(false)}
              className="w-full px-3 py-4 text-xs text-zinc-400 text-center hover:bg-zinc-50 transition-colors"
            >
              No products match — use "<span className="font-medium text-zinc-600">{customName}</span>" as custom item
            </button>
          )}
        </div>,
        document.body
      )}
    </div>
  )
}

// ── Category Combobox ─────────────────────────────────────────────────────────
function CategoryCombobox({ globalCategories = [], value, categoryRef, onChange }) {
  const [open, setOpen] = useState(false)
  const [rect, setRect] = useState(null)
  const [inputText, setInputText] = useState(value || '')
  const wrapRef = useRef(null)
  const inputRef = useRef(null)

  // Sync inputText when value changes externally (e.g. form reset or edit populate)
  useEffect(() => {
    setInputText(value || '')
  }, [value])

  // Resolve selected category object (for icon display)
  const selectedCat = categoryRef ? globalCategories.find((c) => c._id === categoryRef) : null

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const h = (e) => {
      if (!wrapRef.current?.contains(e.target) && !document.getElementById('cat-combo-portal')?.contains(e.target))
        setOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])

  const openDropdown = () => {
    if (wrapRef.current) setRect(wrapRef.current.getBoundingClientRect())
    setOpen(true)
  }

  const suggestions = inputText
    ? globalCategories.filter((c) => c.name.toLowerCase().includes(inputText.toLowerCase()))
    : globalCategories

  const handleInput = (e) => {
    setInputText(e.target.value)
    onChange({ name: e.target.value, categoryRef: '' })
    openDropdown()
  }

  const handleSelect = (cat) => {
    setInputText(cat.name)
    onChange({ name: cat.name, categoryRef: cat._id })
    setOpen(false)
  }

  return (
    <div className="flex-1">
      <div
        ref={wrapRef}
        onClick={() => { inputRef.current?.focus(); openDropdown() }}
        className={[
          'w-full h-9 flex items-center gap-1.5 px-3 border rounded-xl bg-white cursor-text',
          categoryRef ? 'border-emerald-400 bg-emerald-50' : 'border-zinc-200',
          open ? 'border-zinc-900' : '',
        ].join(' ')}
      >
        {selectedCat?.icon && (
          <span className="text-base leading-none flex-shrink-0">{selectedCat.icon}</span>
        )}
        <input
          ref={inputRef}
          value={inputText}
          onChange={handleInput}
          onFocus={openDropdown}
          placeholder="Type or pick a category…"
          className="flex-1 text-sm outline-none bg-transparent min-w-0"
        />
      </div>
      {open && suggestions.length > 0 && rect && createPortal(
        <div
          id="cat-combo-portal"
          style={{ position: 'fixed', bottom: window.innerHeight - rect.top + 4, left: rect.left, width: rect.width, zIndex: 9999 }}
          className="bg-white border border-zinc-200 rounded-xl shadow-xl overflow-hidden"
        >
          {suggestions.slice(0, 6).map((cat) => (
            <button
              key={cat._id}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleSelect(cat)}
              className="w-full px-3 py-2 text-sm text-left hover:bg-zinc-50 flex items-center justify-between gap-2 border-b border-zinc-100 last:border-0"
            >
              <span className="flex items-center gap-2 truncate">
                {cat.icon && <span className="text-base leading-none flex-shrink-0">{cat.icon}</span>}
                <span className="truncate">{cat.name}</span>
              </span>
              {cat._id === categoryRef && (
                <span className="text-[10px] text-emerald-600 font-semibold flex-shrink-0">linked</span>
              )}
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  )
}

// ── Budget Form ───────────────────────────────────────────────────────────────
function BudgetForm({ open, onClose, editing, groupId }) {
  const { mutate: create, isPending: creating } = useCreateBudget()
  const { mutate: update, isPending: updating } = useUpdateBudget()
  const { data: globalCategories = [] } = useCategories()
  const { register, handleSubmit, control, reset, setValue, watch, formState: { errors } } = useForm({
    defaultValues: { name: '', totalAmount: '', startDate: format(new Date(), 'yyyy-MM-dd'), endDate: format(new Date(new Date().setMonth(new Date().getMonth() + 1)), 'yyyy-MM-dd'), notes: '', categories: [] },
  })
  const { fields, append, remove } = useFieldArray({ control, name: 'categories' })
  const watchedCategories = watch('categories')

  useEffect(() => {
    if (!open) return
    if (editing) {
      reset({
        name: editing.name,
        totalAmount: editing.totalAmount,
        startDate: editing.startDate ? format(new Date(editing.startDate), 'yyyy-MM-dd') : '',
        endDate: editing.endDate ? format(new Date(editing.endDate), 'yyyy-MM-dd') : '',
        notes: editing.notes || '',
        categories: (editing.categories || []).map((c) => ({
          categoryRef: c.categoryRef?._id || c.categoryRef || '',
          name: c.name,
          allocatedAmount: c.allocatedAmount,
        })),
      })
    } else {
      reset({ name: '', totalAmount: '', startDate: format(new Date(), 'yyyy-MM-dd'), endDate: format(new Date(new Date().setMonth(new Date().getMonth() + 1)), 'yyyy-MM-dd'), notes: '', categories: [] })
    }
  }, [editing, open])

  const onSubmit = (data) => {
    const payload = {
      ...data,
      totalAmount: parseFloat(data.totalAmount),
      group: groupId,
      startDate: new Date(data.startDate).toISOString(),
      endDate: new Date(data.endDate).toISOString(),
      categories: data.categories.map((c) => ({
        categoryRef: c.categoryRef || undefined,
        name: c.name,
        allocatedAmount: parseFloat(c.allocatedAmount),
      })),
    }
    if (editing) {
      update({ id: editing._id, data: payload }, { onSuccess: onClose })
    } else {
      create(payload, { onSuccess: onClose })
    }
  }

  return (
    <BottomSheet open={open} onClose={onClose} title={editing ? 'Edit Budget' : 'New Budget'}
      footer={<Button type="submit" form="budget-form" fullWidth loading={creating || updating}>{editing ? 'Save' : 'Create Budget'}</Button>}
    >
      <form id="budget-form" onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Input label="Budget name" placeholder="e.g. Monthly Expenses" error={errors.name?.message}
          {...register('name', { required: 'Name required' })} />
        <Input label="Total Amount" type="number" step="0.01" placeholder="0.00" error={errors.totalAmount?.message}
          {...register('totalAmount', { required: 'Amount required' })} />
        <div className="grid grid-cols-2 gap-2">
          <Input label="Start date" type="date" {...register('startDate')} />
          <Input label="End date" type="date" {...register('endDate')} />
        </div>
        <Input label="Notes" placeholder="Optional notes..." {...register('notes')} />

        {/* Categories */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-zinc-700">Categories</label>
            <button type="button" onClick={() => append({ categoryRef: '', name: '', allocatedAmount: '' })}
              className="text-xs text-zinc-500 underline flex items-center gap-1">
              <Plus size={12} /> Add
            </button>
          </div>
          {fields.map((field, idx) => (
            <div key={field.id} className="flex gap-2 items-center">
              <select
                value={watchedCategories[idx]?.categoryRef || ''}
                onChange={(e) => {
                  const cat = globalCategories.find((c) => c._id === e.target.value)
                  setValue(`categories.${idx}.categoryRef`, cat?._id || '')
                  setValue(`categories.${idx}.name`, cat?.name || '')
                }}
                className="flex-1 h-9 px-3 text-sm border border-zinc-200 rounded-xl outline-none focus:border-zinc-900 bg-white"
              >
                <option value="">Select category…</option>
                {globalCategories.map((c) => (
                  <option key={c._id} value={c._id}>{c.icon ? `${c.icon} ` : ''}{c.name}</option>
                ))}
              </select>
              <input
                {...register(`categories.${idx}.allocatedAmount`)}
                type="number" step="0.01" placeholder="Budget"
                className="w-28 h-9 px-3 text-sm border border-zinc-200 rounded-xl outline-none focus:border-zinc-900 text-right bg-white"
              />
              <button type="button" onClick={() => remove(idx)} className="p-1 text-zinc-400 active:text-red-500 flex-shrink-0">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          {fields.length === 0 && (
            <p className="text-xs text-zinc-400 text-center py-2">No categories — spending tracked at budget level only</p>
          )}
        </div>
      </form>
    </BottomSheet>
  )
}

// ── Overview Tab ──────────────────────────────────────────────────────────────
function OverviewTab({ groupId, period, setPeriod, custom, setCustom, symbol, budgets, recentTxns, mobileFiltersOpen, isBusiness }) {
  const dates = getPeriodDates(period, custom)
  const { data: summary, isLoading } = useFinanceSummary({ groupId, ...dates })
  const { data: salesInvoices = [] } = useSalesInvoices()
  const { data: purchaseInvoices = [] } = usePurchaseInvoices()

  const unpaidSInv = salesInvoices.filter((i) => ['draft', 'sent', 'overdue'].includes(i.status))
  const unpaidPInv = purchaseInvoices.filter((i) => ['draft', 'sent', 'overdue'].includes(i.status))
  const overdueSInv = salesInvoices.filter((i) => i.status === 'overdue')
  const overduePInv = purchaseInvoices.filter((i) => i.status === 'overdue')
  const totalAR = unpaidSInv.reduce((s, i) => s + (i.grandTotal || 0), 0)
  const totalAP = unpaidPInv.reduce((s, i) => s + (i.grandTotal || 0), 0)

  return (
    <div className="flex flex-col gap-4">
      {/* Mobile: filter panel */}
      <FinanceMobileFilters open={mobileFiltersOpen} period={period} setPeriod={setPeriod} custom={custom} setCustom={setCustom} setTypeFilter={() => { }} />
      {/* Desktop: inline period picker */}
      <div className="hidden md:block">
        <PeriodPicker period={period} setPeriod={setPeriod} custom={custom} setCustom={setCustom} />
      </div>

      {/* Net balance */}
      <div className="bg-zinc-900 text-white rounded-2xl p-5">
        <p className="text-xs font-medium text-zinc-400 mb-1">Net Balance</p>
        {isLoading ? <Spinner className="text-white" /> : (
          <>
            <p className="text-3xl font-bold mb-3">{fmt(summary?.net, symbol)}</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/10 rounded-xl p-3">
                <p className="text-[10px] text-zinc-400 mb-0.5">Income</p>
                <p className="text-sm font-semibold text-emerald-400">{fmt(summary?.income, symbol)}</p>
              </div>
              <div className="bg-white/10 rounded-xl p-3">
                <p className="text-[10px] text-zinc-400 mb-0.5">Expense</p>
                <p className="text-sm font-semibold text-red-400">{fmt(summary?.expense, symbol)}</p>
              </div>
              <div className="bg-white/10 rounded-xl p-3">
                <p className="text-[10px] text-zinc-400 mb-0.5">Loan</p>
                <p className="text-sm font-semibold text-amber-400">{fmt(summary?.loan, symbol)}</p>
              </div>
              <div className="bg-white/10 rounded-xl p-3">
                <p className="text-[10px] text-zinc-400 mb-0.5">Investment</p>
                <p className="text-sm font-semibold text-blue-400">{fmt(summary?.investment, symbol)}</p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Business: AR / AP */}
      {isBusiness && (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl border border-zinc-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center">
                <TrendingUp size={14} className="text-emerald-600" />
              </div>
              <p className="text-xs font-semibold text-zinc-600">Receivable</p>
            </div>
            <p className="text-xl font-bold text-emerald-600">{fmt(totalAR, symbol)}</p>
            <p className="text-xs text-zinc-400 mt-1">{unpaidSInv.length} unpaid invoice{unpaidSInv.length !== 1 ? 's' : ''}</p>
            {overdueSInv.length > 0 && (
              <p className="text-xs text-red-500 mt-0.5 flex items-center gap-1"><AlertTriangle size={10} />{overdueSInv.length} overdue</p>
            )}
          </div>
          <div className="bg-white rounded-2xl border border-zinc-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center">
                <TrendingDown size={14} className="text-red-500" />
              </div>
              <p className="text-xs font-semibold text-zinc-600">Payable</p>
            </div>
            <p className="text-xl font-bold text-red-500">{fmt(totalAP, symbol)}</p>
            <p className="text-xs text-zinc-400 mt-1">{unpaidPInv.length} unpaid invoice{unpaidPInv.length !== 1 ? 's' : ''}</p>
            {overduePInv.length > 0 && (
              <p className="text-xs text-red-500 mt-0.5 flex items-center gap-1"><AlertTriangle size={10} />{overduePInv.length} overdue</p>
            )}
          </div>
        </div>
      )}

      {/* Active budgets */}
      {budgets?.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Active Budgets</p>
          {budgets.slice(0, 3).map((b) => (
            <div key={b._id} className="bg-white rounded-2xl border border-zinc-100 p-4 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-zinc-900">{b.name}</p>
                <p className="text-xs text-zinc-500">{fmt(b.amountSpent, symbol)} / {fmt(b.totalAmount, symbol)}</p>
              </div>
              <ProgressBar value={b.amountSpent} max={b.totalAmount} />
              <p className="text-[10px] text-zinc-400">{formatDate(b.startDate)} — {formatDate(b.endDate)}</p>
            </div>
          ))}
        </div>
      )}

      {/* Recent transactions */}
      {recentTxns?.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Recent Transactions</p>
          {recentTxns.slice(0, 5).map((t) => {
            const meta = TYPE_META[t.type]
            const Icon = meta.icon
            return (
              <div key={t._id} className="bg-white rounded-2xl border border-zinc-100 p-3 flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${meta.bg}`}>
                  <Icon size={16} className={meta.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-900 truncate">{t.description || meta.label}</p>
                  <p className="text-[10px] text-zinc-400">{formatDate(t.date)}</p>
                </div>
                <p className={`text-sm font-semibold ${meta.color}`}>{fmt(t.amount, symbol)}</p>
              </div>
            )
          })}
        </div>
      )}

      {!isLoading && !recentTxns?.length && !budgets?.length && (
        <EmptyState icon={Wallet} title="No data yet" description="Add transactions to see your financial overview" />
      )}
    </div>
  )
}

// ── Transactions Tab ──────────────────────────────────────────────────────────
function TransactionsTab({ groupId, period, setPeriod, custom, setCustom, symbol, groupMembers, categories, externalOpen, onExternalClose, mobileFiltersOpen, isBusiness }) {
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [filters, setFilters] = useState({})
  const [dropSel, setDropSel] = useState({})
  const [expanded, setExpanded] = useState(null)
  const { mutate: del } = useDeleteFinance()

  useEffect(() => {
    if (externalOpen) { setShowForm(true); onExternalClose?.() }
  }, [externalOpen])

  const dates = getPeriodDates(period, custom)
  const { data: txns = [], isLoading } = useFinance({ groupId, ...dates })
  const { data: salesInvoices = [] } = useSalesInvoices()
  const { data: purchaseInvoices = [] } = usePurchaseInvoices()
  const { data: orders = [] } = useOrders()

  // categoryMap: id → { _id, name } for resolving ObjectId refs in order items
  const categoryMap = useMemo(() => {
    const map = {}
    categories.forEach((c) => { map[String(c._id)] = c })
    return map
  }, [categories])

  const resolveCategory = (catVal) => {
    if (!catVal) return null
    // already populated object
    if (catVal.name) return catVal
    // ObjectId string or object — look up in categoryMap
    return categoryMap[String(catVal)] || null
  }

  // Reverse-lookup: financeEntryId → items[]
  // Works for ALL existing data since invoices/orders store financeEntryId
  const sourceItemsMap = useMemo(() => {
    const map = {}
    salesInvoices.forEach((inv) => {
      if (!inv.financeEntryId) return
      map[String(inv.financeEntryId)] = (inv.items || []).map((it) => ({
        name: it.product?.name || it.description || 'Item',
        qty: it.qty,
        amount: it.amount || 0,
        category: resolveCategory(it.product?.category),
      }))
    })
    purchaseInvoices.forEach((inv) => {
      if (!inv.financeEntryId) return
      map[String(inv.financeEntryId)] = (inv.items || []).map((it) => ({
        name: it.product?.name || it.description || 'Item',
        qty: it.qty,
        amount: it.amount || 0,
        category: resolveCategory(it.product?.category),
      }))
    })
    orders.forEach((order) => {
      if (!order.financeEntryId) return
      map[String(order.financeEntryId)] = (order.items || []).map((it) => ({
        name: it.product?.name || 'Item',
        qty: parseFloat(it.count) || 1,
        amount: (parseFloat(it.price) || 0) * (parseFloat(it.count) || 1),
        category: resolveCategory(it.product?.category),
      }))
    })
    return map
  }, [salesInvoices, purchaseInvoices, orders, categoryMap])

  // Get items for a transaction: prefer Finance-stored items, fall back to source lookup
  const getItems = (t) => {
    if (t.items?.length) return t.items
    return sourceItemsMap[String(t._id)] || []
  }

  const inDrop = (key, val) => !dropSel[key]?.length || dropSel[key].includes(val)
  const inText = (key, val) => !filters[key] || String(val || '').toLowerCase().includes(filters[key].toLowerCase())

  const txnCategories = (t) => {
    const seen = new Set()
    const cats = []
    const add = (cat) => {
      if (!cat?.name) return
      if (seen.has(cat.name)) return
      seen.add(cat.name)
      cats.push(cat)
    }
    if (t.category?.name) add(t.category)
    getItems(t).forEach((it) => { if (it.category?.name) add(it.category) })
    return cats // array of { _id, name, icon? }
  }

  const filtered = useMemo(() => txns.filter((t) => {
    if (!inDrop('type', TYPE_META[t.type]?.label || t.type)) return false
    if (!inText('description', t.description)) return false
    // category filter: match if ANY category on the txn matches
    if (dropSel.category?.length) {
      const cats = txnCategories(t).map((c) => c.name)
      if (!dropSel.category.some((sel) => cats.includes(sel))) return false
    }
    return true
  }), [txns, filters, dropSel])

  // Collect all category names for dropdown filter
  const allCategoryNames = useMemo(() => {
    const names = new Set()
    txns.forEach((t) => {
      txnCategories(t).forEach((c) => names.add(c.name))
    })
    return [...names]
  }, [txns, sourceItemsMap])

  const dropOpts = useMemo(() => ({
    type: Object.values(TYPE_META).map((m) => m.label),
    category: allCategoryNames,
  }), [allCategoryNames])

  const columns = useMemo(() => [
    { key: 'type', label: 'Type', filterable: true },
    { key: 'description', label: 'Description', filterable: true, noDropdown: true },
    { key: 'date', label: 'Date', filterable: false },
    ...(!isBusiness ? [{ key: 'paidBy', label: 'Paid By', filterable: false }] : []),
    { key: 'category', label: 'Categories', filterable: true },
    { key: 'amount', label: 'Amount', filterable: false },
    { key: 'action', label: 'Action', filterable: false },
  ], [isBusiness])

  // +1 for leadingCol
  const txnColSpan = useMemo(() => columns.length, [columns])

  return (
    <div className="flex flex-col gap-3 md:flex-1 md:min-h-0 md:flex md:flex-col">
      {/* Mobile: period + type filter panel */}
      <FinanceMobileFilters open={mobileFiltersOpen} period={period} setPeriod={setPeriod}
        custom={custom} setCustom={setCustom} showTypeFilter={false} setTypeFilter={() => { }} />

      {/* Mobile: DataTable column filters */}
      <DataTableMobileFilters
        open={mobileFiltersOpen}
        columns={columns}
        filters={filters}
        onFilterChange={(key, val) => setFilters((f) => ({ ...f, [key]: val }))}
        dropOpts={dropOpts}
        dropSel={dropSel}
        onDropChange={(key, vals) => setDropSel((s) => ({ ...s, [key]: vals }))}
      />

      {/* Desktop: period picker */}
      <div className="hidden md:flex flex-col gap-3 flex-shrink-0">
        <PeriodPicker period={period} setPeriod={setPeriod} custom={custom} setCustom={setCustom} />
      </div>

      {isLoading && <div className="flex justify-center py-8"><Spinner /></div>}

      {/* Desktop DataTable */}
      {!isLoading && (
        <DataTable
          columns={columns}
          data={filtered}
          filters={filters}
          onFilterChange={(key, val) => setFilters((f) => ({ ...f, [key]: val }))}
          dropOpts={dropOpts}
          dropSel={dropSel}
          onDropChange={(key, vals) => setDropSel((s) => ({ ...s, [key]: vals }))}
          leadingCol
          emptyMessage="No transactions found"
          renderRow={(t) => {
            const meta = TYPE_META[t.type] || TYPE_META.expense
            const Icon = meta.icon
            const isExpanded = expanded === t._id
            const items = getItems(t)
            const hasItems = items.length > 0
            const cats = txnCategories(t)
            return (
              <Fragment key={t._id}>
                <tr className="border-b border-zinc-100 hover:bg-zinc-50 transition-colors">
                  {/* expand chevron — leading col */}
                  <td className="w-8 px-2 py-3 border-r border-zinc-100 text-center">
                    {hasItems && (
                      <button onClick={() => setExpanded(isExpanded ? null : t._id)}
                        className="p-0.5 rounded text-zinc-400 hover:text-zinc-600">
                        <ChevronDown size={14} className={`transition-transform ${isExpanded ? '' : '-rotate-90'}`} />
                      </button>
                    )}
                  </td>
                  <td className="px-3 py-3 border-r border-zinc-100">
                    <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-semibold ${meta.bg} ${meta.color}`}>
                      <Icon size={11} />{meta.label}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-sm text-zinc-900 truncate border-r border-zinc-100">{t.description || '—'}</td>
                  <td className="px-3 py-3 text-xs text-zinc-500 whitespace-nowrap border-r border-zinc-100">{formatDate(t.date)}</td>
                  {!isBusiness && <td className="px-3 py-3 text-xs text-zinc-500 border-r border-zinc-100">{t.paidBy?.name || t.paidBy?.email || '—'}</td>}
                  <td className="px-3 py-3 border-r border-zinc-100">
                    {cats.length > 0 ? (
                      <div className="flex flex-wrap gap-1 items-center">
                        {cats.map((c) => (
                          <div key={c.name} title={c.name}
                            className="flex items-center gap-1 px-1.5 py-0.5 bg-zinc-100 rounded-lg text-[10px] font-medium text-zinc-600 flex-shrink-0">
                            {c.icon && <span className="text-sm leading-none">{c.icon}</span>}
                            <span>{c.name}</span>
                          </div>
                        ))}
                      </div>
                    ) : <span className="text-xs text-zinc-400">—</span>}
                  </td>
                  <td className={`px-3 py-3 text-sm font-semibold text-right border-r border-zinc-100 ${meta.color}`}>{fmt(t.amount, symbol)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 whitespace-nowrap">
                      <button onClick={() => { setEditing(t); setShowForm(true) }} className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 active:bg-zinc-100"><Pencil size={14} /></button>
                      <button onClick={() => del(t._id)} className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 active:bg-zinc-100"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
                {isExpanded && hasItems && (
                  <tr className="bg-zinc-50 border-b border-zinc-100">
                    <td /><td colSpan={txnColSpan} className="px-4 py-3">
                      <table className="w-full text-xs border-collapse rounded-xl overflow-hidden border border-zinc-200">
                        <thead>
                          <tr className="border-b border-zinc-200">
                            <th className="px-3 py-2 text-left font-semibold text-zinc-500 border-r border-zinc-200">Item</th>
                            <th className="px-3 py-2 text-left font-semibold text-zinc-500 border-r border-zinc-200">Category</th>
                            <th className="px-3 py-2 text-left font-semibold text-zinc-500 border-r border-zinc-200">Qty</th>
                            <th className="px-3 py-2 text-left font-semibold text-zinc-500">Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {items.map((it, i, arr) => (
                            <tr key={i} className={i < arr.length - 1 ? 'border-b border-zinc-100' : ''}>
                              <td className="px-3 py-2 border-r border-zinc-100 font-medium text-zinc-800">{it.name || '—'}</td>
                              <td className="px-3 py-2 border-r border-zinc-100">
                                {it.category?.name
                                  ? (
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-zinc-100 text-zinc-600 rounded-md font-medium">
                                      {it.category.icon && <span className="text-sm leading-none">{it.category.icon}</span>}
                                      {it.category.name}
                                    </span>
                                  )
                                  : <span className="text-zinc-400">—</span>}
                              </td>
                              <td className="px-3 py-2 border-r border-zinc-100 text-zinc-600">{it.qty ?? '—'}</td>
                              <td className="px-3 py-2 font-semibold text-zinc-900">{fmt(it.amount, symbol)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </td>
                  </tr>
                )}
              </Fragment>
            )
          }}
        />
      )}

      {/* Mobile cards */}
      {!isLoading && (
        <div className="md:hidden flex flex-col gap-2">
          {filtered.length === 0 && (
            <EmptyState icon={CircleDollarSign} title="No transactions" description="Add your first transaction" />
          )}
          {filtered.map((t) => {
            const meta = TYPE_META[t.type] || TYPE_META.expense
            const Icon = meta.icon
            const isExpanded = expanded === t._id
            const items = getItems(t)
            const hasItems = items.length > 0
            const cats = txnCategories(t)
            return (
              <div key={t._id} className="bg-white rounded-2xl border border-zinc-100 p-4">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${meta.bg}`}>
                    <Icon size={18} className={meta.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-zinc-900 truncate">{t.description || meta.label}</p>
                        <p className="text-xs text-zinc-400 mt-0.5">{formatDate(t.date)}</p>
                        {!isBusiness && t.paidBy && <p className="text-[10px] text-zinc-400">Paid by {t.paidBy.name || t.paidBy.email}</p>}
                      </div>
                      <p className={`text-sm font-bold flex-shrink-0 ${meta.color}`}>{fmt(t.amount, symbol)}</p>
                    </div>
                    {cats.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5 items-center">
                        {cats.map((c) => (
                          <div key={c.name}
                            className="flex items-center gap-1 px-1.5 py-0.5 bg-zinc-100 rounded-lg text-[10px] font-medium text-zinc-600 flex-shrink-0">
                            {c.icon && <span className="text-sm leading-none">{c.icon}</span>}
                            <span>{c.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {!isBusiness && t.splitAmong?.length > 0 && (
                      <p className="text-[10px] text-zinc-400 mt-1">Split: {t.splitAmong.map((s) => s.user?.name || s.user?.email).join(', ')}</p>
                    )}
                  </div>
                </div>
                {/* Items expand */}
                {hasItems && (
                  <>
                    <button onClick={() => setExpanded(isExpanded ? null : t._id)}
                      className="mt-2 flex items-center gap-1 text-xs text-zinc-400">
                      <ChevronDown size={12} className={`transition-transform ${isExpanded ? '' : '-rotate-90'}`} />
                      {items.length} item{items.length !== 1 ? 's' : ''}
                    </button>
                    {isExpanded && (
                      <div className="mt-2 pt-2 border-t border-zinc-100 flex flex-col gap-1.5">
                        {items.map((it, i) => (
                          <div key={i} className="flex items-center justify-between gap-2 text-xs">
                            <div className="flex-1 min-w-0">
                              <span className="font-medium text-zinc-800 truncate">{it.name || '—'}</span>
                              {it.category?.name && (
                                <span className="inline-flex items-center gap-1 ml-1.5 px-1.5 py-0.5 bg-zinc-100 text-zinc-500 rounded-md">
                                  {it.category.icon && <span className="text-sm leading-none">{it.category.icon}</span>}
                                  {it.category.name}
                                </span>
                              )}
                            </div>
                            {it.qty && <span className="text-zinc-400">×{it.qty}</span>}
                            <span className="font-semibold text-zinc-900">{fmt(it.amount, symbol)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
                <div className="flex justify-end gap-1 mt-2 pt-2 border-t border-zinc-50">
                  <button onClick={() => { setEditing(t); setShowForm(true) }} className="p-1 rounded-xl text-zinc-400 active:bg-zinc-100"><Pencil size={15} /></button>
                  <button onClick={() => del(t._id)} className="p-1 rounded-xl text-zinc-400 active:bg-zinc-100"><Trash2 size={15} /></button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <TransactionForm open={showForm} onClose={() => { setShowForm(false); setEditing(null) }}
        editing={editing} groupId={groupId} groupMembers={isBusiness ? [] : groupMembers}
        categories={categories} symbol={symbol} isBusiness={isBusiness} />
    </div>
  )
}

// ── Budgets Tab ───────────────────────────────────────────────────────────────
const BUDGET_COLS = [
  { key: 'name', label: 'Name', filterable: true, noDropdown: true },
  { key: 'period', label: 'Period', filterable: false, width: 'w-52' },
  { key: 'spent', label: 'Spent', filterable: false },
  { key: 'total', label: 'Total', filterable: false },
  { key: 'progress', label: 'Progress', filterable: false },
  { key: 'remaining', label: 'Remaining', filterable: false },
  { key: 'action', label: 'Action', filterable: false },
]

function BudgetsTab({ groupId, symbol, budgets = [], isLoading, externalOpen, onExternalClose }) {
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [expanded, setExpanded] = useState(null)
  const [filters, setFilters] = useState({})
  const { mutate: del } = useDeleteBudget()

  useEffect(() => {
    if (externalOpen) { setShowForm(true); onExternalClose?.() }
  }, [externalOpen])

  const filtered = useMemo(() => budgets.filter((b) =>
    !filters.name || b.name.toLowerCase().includes(filters.name.toLowerCase())
  ), [budgets, filters])

  return (
    <div className="flex flex-col gap-3 md:flex-1 md:min-h-0 md:flex md:flex-col">
      {isLoading && <div className="flex justify-center py-8"><Spinner /></div>}

      {/* Desktop DataTable */}
      {!isLoading && (
        <DataTable
          columns={BUDGET_COLS}
          data={filtered}
          filters={filters}
          onFilterChange={(key, val) => setFilters((f) => ({ ...f, [key]: val }))}
          dropOpts={{}}
          dropSel={{}}
          onDropChange={() => { }}
          leadingCol
          emptyMessage="No budgets yet — create one to start tracking"
          renderRow={(b) => {
            const pct = b.totalAmount > 0 ? Math.min((b.amountSpent / b.totalAmount) * 100, 100) : 0
            const isExpanded = expanded === b._id
            const danger = pct >= 90
            return (
              <Fragment key={b._id}>
                <tr className="border-b border-zinc-100 hover:bg-zinc-50 transition-colors">
                  {/* expand chevron */}
                  <td className="w-8 px-3 py-3 border-r border-zinc-100">
                    {b.categories?.length > 0 ? (
                      <button onClick={() => setExpanded(isExpanded ? null : b._id)}
                        className="p-0.5 rounded text-zinc-400 hover:text-zinc-600">
                        <ChevronDown size={14} className={`transition-transform ${isExpanded ? '' : '-rotate-90'}`} />
                      </button>
                    ) : null}
                  </td>
                  <td className="px-3 py-3 border-r border-zinc-100">
                    <p className="text-sm font-semibold text-zinc-900 truncate">{b.name}</p>
                    {b.notes && <p className="text-[10px] text-zinc-400 italic truncate">{b.notes}</p>}
                  </td>
                  <td className="px-3 py-3 text-xs text-zinc-500 whitespace-nowrap border-r border-zinc-100">
                    {formatDate(b.startDate)} — {formatDate(b.endDate)}
                  </td>
                  <td className="px-3 py-3 text-sm font-semibold text-zinc-900 border-r border-zinc-100">{fmt(b.amountSpent, symbol)}</td>
                  <td className="px-3 py-3 text-sm text-zinc-500 border-r border-zinc-100">{fmt(b.totalAmount, symbol)}</td>
                  <td className="px-3 py-3 border-r border-zinc-100">
                    <div className="flex flex-col gap-1">
                      <div className="w-full bg-zinc-100 rounded-full h-1.5 overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${danger ? 'bg-red-500' : 'bg-emerald-500'}`}
                          style={{ width: `${pct}%` }} />
                      </div>
                      <p className="text-[10px] text-zinc-400">{pct.toFixed(0)}% used</p>
                    </div>
                  </td>
                  <td className={`px-3 py-3 text-sm font-semibold border-r border-zinc-100 ${danger ? 'text-red-500' : 'text-emerald-600'}`}>
                    {fmt(b.amountRemaining, symbol)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 whitespace-nowrap">
                      <button onClick={() => { setEditing(b); setShowForm(true) }} className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 active:bg-zinc-100"><Pencil size={14} /></button>
                      <button onClick={() => del(b._id)} className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 active:bg-zinc-100"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
                {/* expanded categories sub-row */}
                {isExpanded && b.categories?.length > 0 && (
                  <tr className="bg-zinc-50 border-b border-zinc-100">
                    <td /><td colSpan={7} className="px-4 py-3">
                      <table className="w-full text-xs border-collapse rounded-xl overflow-hidden border border-zinc-200">
                        <thead>
                          <tr className="border-b border-zinc-200">
                            <th className="px-3 py-2 w-40 text-left font-semibold text-zinc-500 border-r border-zinc-200">Category</th>
                            <th className="px-3 py-2 w-48 text-left font-semibold text-zinc-500 border-r border-zinc-200">Progress</th>
                            <th className="px-3 py-2 w-40 text-left font-semibold text-zinc-500 border-r border-zinc-200">Spent / Allocated</th>
                            <th className="px-3 py-2 w-40 text-left font-semibold text-zinc-500">Used</th>
                          </tr>
                        </thead>
                        <tbody>
                          {b.categories.map((cat, i, arr) => {
                            const catPct = cat.allocatedAmount > 0 ? Math.min((cat.spentAmount / cat.allocatedAmount) * 100, 100) : 0
                            return (
                              <tr key={i} className={i < arr.length - 1 ? 'border-b border-zinc-100' : ''}>
                                <td className="px-3 py-2 border-r border-zinc-100 font-medium text-zinc-800 truncate max-w-0">{cat.name}</td>
                                <td className="px-3 py-2 border-r border-zinc-100">
                                  <div className="w-full bg-zinc-200 rounded-full h-1.5 overflow-hidden">
                                    <div className={`h-full rounded-full transition-all ${catPct >= 90 ? 'bg-red-500' : 'bg-blue-500'}`}
                                      style={{ width: `${catPct}%` }} />
                                  </div>
                                </td>
                                <td className="px-3 py-2 border-r border-zinc-100 text-zinc-600 whitespace-nowrap">{fmt(cat.spentAmount, symbol)} / {fmt(cat.allocatedAmount, symbol)}</td>
                                <td className="px-3 py-2 text-zinc-400 whitespace-nowrap">{catPct.toFixed(0)}%</td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </td>
                  </tr>
                )}
              </Fragment>
            )
          }}
        />
      )}

      {/* Mobile cards */}
      {!isLoading && (
        <div className="md:hidden flex flex-col gap-3">
          {filtered.length === 0 && (
            <EmptyState icon={Wallet} title="No budgets" description="Create a budget to track your spending" />
          )}
          {filtered.map((b) => {
            const pct = b.totalAmount > 0 ? Math.min((b.amountSpent / b.totalAmount) * 100, 100) : 0
            const isExpanded = expanded === b._id
            return (
              <div key={b._id} className="bg-white rounded-2xl border border-zinc-100 p-4 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-zinc-900 truncate">{b.name}</p>
                    <p className="text-[10px] text-zinc-400">{formatDate(b.startDate)} — {formatDate(b.endDate)}</p>
                  </div>
                  <div className="flex items-center gap-0 flex-shrink-0">
                    <button onClick={() => { setEditing(b); setShowForm(true) }} className="p-1 rounded-xl text-zinc-400 active:bg-zinc-100"><Pencil size={15} /></button>
                    <button onClick={() => del(b._id)} className="p-1 rounded-xl text-zinc-400 active:bg-zinc-100"><Trash2 size={15} /></button>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-500">Spent: <span className="font-semibold text-zinc-900">{fmt(b.amountSpent, symbol)}</span></span>
                    <span className="text-zinc-500">Total: <span className="font-semibold text-zinc-900">{fmt(b.totalAmount, symbol)}</span></span>
                  </div>
                  <ProgressBar value={b.amountSpent} max={b.totalAmount} />
                  <p className="text-[10px] text-zinc-400">{fmt(b.amountRemaining, symbol)} remaining · {pct.toFixed(0)}% used</p>
                </div>
                {b.categories?.length > 0 && (
                  <>
                    <button onClick={() => setExpanded(isExpanded ? null : b._id)}
                      className="flex items-center gap-1 text-xs text-zinc-400">
                      <ChevronDown size={13} className={`transition-transform ${isExpanded ? '' : '-rotate-90'}`} />
                      {b.categories.length} categories
                    </button>
                    {isExpanded && (
                      <div className="flex flex-col gap-2 pt-1 border-t border-zinc-50">
                        {b.categories.map((cat, i) => (
                          <div key={i} className="flex flex-col gap-1">
                            <div className="flex justify-between text-xs">
                              <span className="text-zinc-700 font-medium">{cat.name}</span>
                              <span className="text-zinc-500">{fmt(cat.spentAmount, symbol)} / {fmt(cat.allocatedAmount, symbol)}</span>
                            </div>
                            <ProgressBar value={cat.spentAmount} max={cat.allocatedAmount} color="bg-blue-500" />
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
                {b.notes && <p className="text-xs text-zinc-400 italic">{b.notes}</p>}
              </div>
            )
          })}
        </div>
      )}

      <BudgetForm open={showForm} onClose={() => { setShowForm(false); setEditing(null) }} editing={editing} groupId={groupId} />
    </div>
  )
}

// ── Debts Tab — Personal ──────────────────────────────────────────────────────
function PersonalDebtsTab({ groupId, symbol, currentUserId }) {
  const { data: txns = [], isLoading } = useFinance({ groupId })
  const { mutate: settle } = useSettleDebt()

  const netDebts = useMemo(() => {
    const map = {}
    for (const txn of txns) {
      for (let i = 0; i < (txn.debtTracking || []).length; i++) {
        const d = txn.debtTracking[i]
        if (d.settled) continue
        const fromId = d.from?._id || d.from
        const toId = d.to?._id || d.to
        const key = [fromId, toId].sort().join('-')
        if (!map[key]) map[key] = { fromId, toId, fromName: d.from?.name || d.from?.email || fromId, toName: d.to?.name || d.to?.email || toId, amount: 0, entries: [] }
        if (String(fromId) < String(toId)) map[key].amount += d.amount
        else map[key].amount -= d.amount
        map[key].entries.push({ financeId: txn._id, debtIndex: i })
      }
    }
    return Object.values(map).filter((d) => Math.abs(d.amount) > 0.01)
  }, [txns])

  if (isLoading) return <div className="flex justify-center py-8"><Spinner /></div>
  if (netDebts.length === 0) return (
    <EmptyState icon={CheckCircle2} title="All settled up!" description="No outstanding debts in this group" />
  )

  return (
    <div className="flex flex-col gap-3">
      {netDebts.map((d, idx) => {
        const owes = d.amount > 0 ? d.fromName : d.toName
        const owed = d.amount > 0 ? d.toName : d.fromName
        const amt = Math.abs(d.amount)
        const isMine = String(d.fromId) === String(currentUserId) || String(d.toId) === String(currentUserId)
        return (
          <div key={idx} className={`bg-white rounded-2xl border p-4 flex items-center gap-3 ${isMine ? 'border-zinc-300' : 'border-zinc-100'}`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${d.amount > 0 ? 'bg-red-50' : 'bg-emerald-50'}`}>
              <Landmark size={18} className={d.amount > 0 ? 'text-red-500' : 'text-emerald-600'} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-zinc-900 truncate">
                <span className="text-zinc-700">{owes}</span>
                <span className="text-zinc-400 font-normal"> owes </span>
                <span className="text-zinc-700">{owed}</span>
              </p>
              <p className={`text-sm font-bold ${d.amount > 0 ? 'text-red-500' : 'text-emerald-600'}`}>{fmt(amt, symbol)}</p>
            </div>
            <button onClick={() => d.entries.forEach((e) => settle({ id: e.financeId, debtIndex: e.debtIndex }))}
              className="px-3 py-1.5 text-xs font-semibold bg-zinc-900 text-white rounded-xl active:scale-95 transition-transform">
              Settle
            </button>
          </div>
        )
      })}
    </div>
  )
}

// ── Debts Tab — Business (AR/AP aging) ───────────────────────────────────────
function BusinessDebtsTab({ symbol }) {
  const { data: salesInvoices = [], isLoading: loadingSI } = useSalesInvoices()
  const { data: purchaseInvoices = [], isLoading: loadingPI } = usePurchaseInvoices()
  const [view, setView] = useState('ar') // 'ar' | 'ap'

  const unpaidSI = salesInvoices.filter((i) => ['draft', 'sent', 'overdue'].includes(i.status))
    .map((i) => ({ ...i, daysOverdue: i.dueDate ? Math.max(0, differenceInDays(new Date(), parseISO(i.dueDate))) : 0 }))
    .sort((a, b) => b.daysOverdue - a.daysOverdue)

  const unpaidPI = purchaseInvoices.filter((i) => ['draft', 'sent', 'overdue'].includes(i.status))
    .map((i) => ({ ...i, daysOverdue: i.dueDate ? Math.max(0, differenceInDays(new Date(), parseISO(i.dueDate))) : 0 }))
    .sort((a, b) => b.daysOverdue - a.daysOverdue)

  const totalAR = unpaidSI.reduce((s, i) => s + (i.grandTotal || 0), 0)
  const totalAP = unpaidPI.reduce((s, i) => s + (i.grandTotal || 0), 0)

  const isLoading = loadingSI || loadingPI
  if (isLoading) return <div className="flex justify-center py-8"><Spinner /></div>

  const items = view === 'ar' ? unpaidSI : unpaidPI
  const total = view === 'ar' ? totalAR : totalAP

  const agingColor = (days) => {
    if (days === 0) return 'bg-zinc-100 text-zinc-500'
    if (days <= 30) return 'bg-amber-50 text-amber-600'
    if (days <= 60) return 'bg-orange-50 text-orange-600'
    return 'bg-red-50 text-red-600'
  }

  return (
    <div className="flex flex-col gap-4">
      {/* AR / AP toggle + totals */}
      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => setView('ar')}
          className={`rounded-2xl border p-4 text-left transition-all ${view === 'ar' ? 'bg-zinc-900 border-zinc-900 text-white' : 'bg-white border-zinc-200'}`}>
          <div className="flex items-center gap-2 mb-1">
            <FileText size={14} className={view === 'ar' ? 'text-emerald-400' : 'text-emerald-600'} />
            <p className={`text-xs font-semibold ${view === 'ar' ? 'text-zinc-300' : 'text-zinc-500'}`}>Receivable (AR)</p>
          </div>
          <p className={`text-xl font-bold ${view === 'ar' ? 'text-emerald-400' : 'text-emerald-600'}`}>{fmt(totalAR, symbol)}</p>
          <p className={`text-xs mt-0.5 ${view === 'ar' ? 'text-zinc-400' : 'text-zinc-400'}`}>{unpaidSI.length} invoice{unpaidSI.length !== 1 ? 's' : ''}</p>
        </button>
        <button onClick={() => setView('ap')}
          className={`rounded-2xl border p-4 text-left transition-all ${view === 'ap' ? 'bg-zinc-900 border-zinc-900 text-white' : 'bg-white border-zinc-200'}`}>
          <div className="flex items-center gap-2 mb-1">
            <ReceiptText size={14} className={view === 'ap' ? 'text-red-400' : 'text-red-500'} />
            <p className={`text-xs font-semibold ${view === 'ap' ? 'text-zinc-300' : 'text-zinc-500'}`}>Payable (AP)</p>
          </div>
          <p className={`text-xl font-bold ${view === 'ap' ? 'text-red-400' : 'text-red-500'}`}>{fmt(totalAP, symbol)}</p>
          <p className={`text-xs mt-0.5 ${view === 'ap' ? 'text-zinc-400' : 'text-zinc-400'}`}>{unpaidPI.length} invoice{unpaidPI.length !== 1 ? 's' : ''}</p>
        </button>
      </div>

      {items.length === 0 ? (
        <EmptyState icon={CheckCircle2}
          title={view === 'ar' ? 'No outstanding receivables' : 'No outstanding payables'}
          description={view === 'ar' ? 'All customer invoices are paid' : 'All vendor invoices are paid'} />
      ) : (
        <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200">
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-zinc-500">Invoice</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-zinc-500">{view === 'ar' ? 'Customer' : 'Vendor'}</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-zinc-500">Due Date</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-zinc-500">Overdue</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-zinc-500">Status</th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold text-zinc-500">Amount</th>
              </tr>
            </thead>
            <tbody>
              {items.map((inv) => (
                <tr key={inv._id} className="border-b border-zinc-100 hover:bg-zinc-50">
                  <td className="px-4 py-3 font-mono text-xs font-semibold text-zinc-900">{inv.invoiceNumber}</td>
                  <td className="px-4 py-3 text-sm text-zinc-700">{(view === 'ar' ? inv.customer?.name : inv.vendor?.name) || '—'}</td>
                  <td className="px-4 py-3 text-xs text-zinc-500">{inv.dueDate ? formatDate(inv.dueDate) : '—'}</td>
                  <td className="px-4 py-3">
                    {inv.daysOverdue > 0
                      ? <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${agingColor(inv.daysOverdue)}`}>{inv.daysOverdue}d</span>
                      : <span className="text-xs text-zinc-400">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md capitalize ${inv.status === 'overdue' ? 'bg-red-50 text-red-600' :
                        inv.status === 'sent' ? 'bg-amber-50 text-amber-600' : 'bg-zinc-100 text-zinc-500'
                      }`}>{inv.status}</span>
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-right text-zinc-900">{fmt(inv.grandTotal, symbol)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-zinc-50 border-t border-zinc-200">
                <td colSpan={5} className="px-4 py-2.5 text-xs font-semibold text-zinc-500">Total Outstanding</td>
                <td className="px-4 py-2.5 text-sm font-bold text-right text-zinc-900">{fmt(total, symbol)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  )
}

// ── Debts Tab — router ────────────────────────────────────────────────────────
function DebtsTab({ groupId, symbol, currentUserId, isBusiness }) {
  if (isBusiness) return <BusinessDebtsTab symbol={symbol} />
  return <PersonalDebtsTab groupId={groupId} symbol={symbol} currentUserId={currentUserId} />
}

// ── Main Finance Page ─────────────────────────────────────────────────────────
export default function Finance() {
  const [tab, setTab] = useState('overview')
  const [period, setPeriod] = useState('month')
  const [custom, setCustom] = useState({ start: '', end: '' })
  const [showAddTxn, setShowAddTxn] = useState(false)
  const [showAddBudget, setShowAddBudget] = useState(false)
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

  const handleTabChange = (key) => { setTab(key); setMobileFiltersOpen(false) }

  const { activeGroupId } = useGroupStore()
  const { data: me } = useMe()
  const { data: groups } = useGroups()
  const isBusiness = useIsBusiness()
  const TABS = isBusiness ? BUSINESS_TABS : PERSONAL_TABS
  const { data: categories = [] } = useCategories()

  const symbol = useCurrencySymbol()

  const activeGroup = groups?.find((g) => g._id === activeGroupId)
  const groupMembers = activeGroup?.members || []

  const dates = getPeriodDates(period, custom)
  const { data: allTxns = [] } = useFinance({ groupId: activeGroupId, ...dates })
  const { data: budgets = [], isLoading: budgetsLoading } = useBudgets({ groupId: activeGroupId })

  const filterTabs = ['overview', 'transactions']
  const activeCount = period !== 'month' ? 1 : 0

  return (
    <>
      <TopBar
        title="Finance"
        filterIcon={filterTabs.includes(tab) && (
          <DataTableFilterIcon open={mobileFiltersOpen} onChange={setMobileFiltersOpen} activeCount={activeCount} />
        )}
        right={
          <div className="flex items-center">
            {tab === 'transactions' && (
              <button onClick={() => setShowAddTxn(true)} className="p-2 rounded-xl active:bg-zinc-100">
                <Plus size={20} className="text-zinc-600" />
              </button>
            )}
            {tab === 'budgets' && (
              <button onClick={() => setShowAddBudget(true)} className="p-2 rounded-xl active:bg-zinc-100">
                <Plus size={20} className="text-zinc-600" />
              </button>
            )}
          </div>
        }
      />

      <div className="px-4 pt-0 pb-5 md:px-0 md:py-0 md:pb-4 md:flex md:flex-col md:flex-1 md:min-h-0">
        {/* Mobile sticky pill tab bar */}
        <div className="md:hidden sticky z-30 bg-zinc-50 -mx-4 px-4 py-4 flex-shrink-0 flex flex-col gap-1" style={{ top: 'calc(3.5rem + env(safe-area-inset-top))' }}>
          <div className="bg-zinc-100 rounded-xl p-0.5 flex">
            {TABS.slice(0, 3).map((t) => (
              <button key={t.key} onClick={() => handleTabChange(t.key)}
                className={['flex-1 py-1.5 text-xs font-semibold rounded-[10px] transition-all duration-200 whitespace-nowrap',
                  tab === t.key ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-400 active:bg-zinc-200'].join(' ')}>
                {t.mobileLabel}
              </button>
            ))}
          </div>
          <div className="bg-zinc-100 rounded-xl p-0.5 flex">
            {TABS.slice(3).map((t) => (
              <button key={t.key} onClick={() => handleTabChange(t.key)}
                className={['flex-1 py-1.5 text-xs font-semibold rounded-[10px] transition-all duration-200 whitespace-nowrap',
                  tab === t.key ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-400 active:bg-zinc-200'].join(' ')}>
                {t.mobileLabel}
              </button>
            ))}
          </div>
        </div>

        {/* Desktop underline tab bar */}
        <div className="hidden md:flex items-end justify-between border-b border-zinc-200 mb-5 flex-shrink-0">
          <div className="flex gap-x-6">
            {TABS.map((t) => (
              <button key={t.key} onClick={() => handleTabChange(t.key)}
                className={['pb-3 text-sm font-medium transition-colors whitespace-nowrap',
                  tab === t.key ? 'text-zinc-900 border-b-2 border-zinc-900 -mb-px' : 'text-zinc-400 hover:text-zinc-600'].join(' ')}>
                {t.label}
              </button>
            ))}
          </div>
          <div className="pb-3 flex gap-2">
            {tab === 'transactions' && <Button size="sm" onClick={() => setShowAddTxn(true)}><Plus size={15} /> Add</Button>}
            {tab === 'budgets' && <Button size="sm" onClick={() => setShowAddBudget(true)}><Plus size={15} /> New Budget</Button>}
          </div>
        </div>

        <div className="md:flex-1 md:min-h-0 md:flex md:flex-col">
          {tab === 'overview' && (
            <OverviewTab groupId={activeGroupId} period={period} setPeriod={setPeriod}
              custom={custom} setCustom={setCustom} symbol={symbol} budgets={budgets} recentTxns={allTxns}
              mobileFiltersOpen={mobileFiltersOpen} isBusiness={isBusiness} />
          )}
          {tab === 'transactions' && (
            <TransactionsTab groupId={activeGroupId} period={period} setPeriod={setPeriod}
              custom={custom} setCustom={setCustom} symbol={symbol} groupMembers={groupMembers} categories={categories}
              externalOpen={showAddTxn} onExternalClose={() => setShowAddTxn(false)}
              mobileFiltersOpen={mobileFiltersOpen} isBusiness={isBusiness} />
          )}
          {tab === 'budgets' && (
            <BudgetsTab groupId={activeGroupId} symbol={symbol} budgets={budgets} isLoading={budgetsLoading}
              externalOpen={showAddBudget} onExternalClose={() => setShowAddBudget(false)} />
          )}
          {tab === 'debts' && (
            <DebtsTab groupId={activeGroupId} symbol={symbol} currentUserId={me?._id} isBusiness={isBusiness} />
          )}
        </div>
      </div>

    </>
  )
}
