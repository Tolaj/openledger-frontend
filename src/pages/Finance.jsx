import { useState, useMemo, useEffect } from 'react'
import { useForm, useFieldArray, Controller } from 'react-hook-form'
import {
  TrendingUp, TrendingDown, Landmark, BarChart3,
  Plus, Pencil, Trash2, CheckCircle2, CircleDollarSign,
  ChevronDown, ChevronUp, Wallet,
} from 'lucide-react'
import TopBar from '../components/layout/TopBar'
import PageHeader from '../components/layout/PageHeader'
import PageActions from '../components/layout/PageActions'
import BottomSheet from '../components/ui/BottomSheet'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Spinner from '../components/ui/Spinner'
import EmptyState from '../components/ui/EmptyState'
import useGroupStore from '../store/groupStore'
import { useMe, useUpdateUser } from '../hooks/useUser'
import {
  useFinance, useFinanceSummary, useCreateFinance, useUpdateFinance, useDeleteFinance, useSettleDebt,
  useBudgets, useCreateBudget, useUpdateBudget, useDeleteBudget,
} from '../hooks/useFinance'
import { useGroups } from '../hooks/useGroups'
import { useCategories } from '../hooks/useCategories'
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear, subMonths } from 'date-fns'

// ── Constants ─────────────────────────────────────────────────────────────────
const TABS = [
  { key: 'overview',     label: 'Overview',     mobileLabel: 'Overview'  },
  { key: 'transactions', label: 'Transactions', mobileLabel: 'Txns'      },
  { key: 'budgets',      label: 'Budgets',      mobileLabel: 'Budgets'   },
  { key: 'debts',        label: 'Debts',        mobileLabel: 'Debts'     },
]

const PERIODS = [
  { key: 'week',    label: 'This Week'  },
  { key: 'month',   label: 'This Month' },
  { key: 'quarter', label: 'Quarter'    },
  { key: 'year',    label: 'This Year'  },
  { key: 'custom',  label: 'Custom'     },
]

const TYPE_META = {
  income:     { label: 'Income',     icon: TrendingUp,    color: 'text-emerald-600', bg: 'bg-emerald-50',  border: 'border-emerald-100' },
  expense:    { label: 'Expense',    icon: TrendingDown,  color: 'text-red-500',     bg: 'bg-red-50',      border: 'border-red-100'     },
  loan:       { label: 'Loan',       icon: Landmark,      color: 'text-amber-600',   bg: 'bg-amber-50',    border: 'border-amber-100'   },
  investment: { label: 'Investment', icon: BarChart3,     color: 'text-blue-600',    bg: 'bg-blue-50',     border: 'border-blue-100'    },
}

const CURRENCIES = [
  { code: 'INR', symbol: '₹', label: '₹ INR — Indian Rupee' },
  { code: 'USD', symbol: '$', label: '$ USD — US Dollar'     },
  { code: 'EUR', symbol: '€', label: '€ EUR — Euro'          },
  { code: 'GBP', symbol: '£', label: '£ GBP — British Pound' },
  { code: 'JPY', symbol: '¥', label: '¥ JPY — Japanese Yen'  },
  { code: 'AUD', symbol: 'A$', label: 'A$ AUD — Australian Dollar' },
]

// ── Helpers ───────────────────────────────────────────────────────────────────
function getPeriodDates(period, custom) {
  const now = new Date()
  switch (period) {
    case 'week':    return { startDate: startOfWeek(now).toISOString(),    endDate: endOfWeek(now).toISOString()    }
    case 'month':   return { startDate: startOfMonth(now).toISOString(),   endDate: endOfMonth(now).toISOString()   }
    case 'quarter': return { startDate: startOfQuarter(now).toISOString(), endDate: endOfQuarter(now).toISOString() }
    case 'year':    return { startDate: startOfYear(now).toISOString(),    endDate: endOfYear(now).toISOString()    }
    case 'custom':  return { startDate: custom.start, endDate: custom.end  }
    default:        return {}
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

// ── Transaction Form ──────────────────────────────────────────────────────────
function TransactionForm({ open, onClose, editing, groupId, groupMembers = [], categories = [], symbol }) {
  const { mutate: create, isPending: creating } = useCreateFinance()
  const { mutate: update, isPending: updating } = useUpdateFinance()
  const { register, handleSubmit, watch, setValue, control, reset, formState: { errors } } = useForm({
    defaultValues: { type: 'expense', amount: '', description: '', date: format(new Date(), 'yyyy-MM-dd'), category: '', paidBy: '', splitAmong: [] },
  })

  const splitAmong = watch('splitAmong') || []
  const amount = parseFloat(watch('amount')) || 0
  const paidBy = watch('paidBy')

  // when editing populate form
  useState(() => {
    if (editing) {
      reset({
        type: editing.type,
        amount: editing.amount,
        description: editing.description || '',
        date: editing.date ? format(new Date(editing.date), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
        category: editing.category?._id || editing.category || '',
        paidBy: editing.paidBy?._id || editing.paidBy || '',
        splitAmong: (editing.splitAmong || []).map((s) => ({ user: s.user?._id || s.user, amount: s.amount })),
      })
    } else {
      reset({ type: 'expense', amount: '', description: '', date: format(new Date(), 'yyyy-MM-dd'), category: '', paidBy: '', splitAmong: [] })
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

        {/* Category */}
        {categories.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700">Category</label>
            <select {...register('category')} className="h-11 px-3 rounded-xl border border-zinc-300 bg-white text-sm outline-none focus:border-zinc-900">
              <option value="">No category</option>
              {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>
        )}

        {/* Paid By */}
        {groupMembers.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700">Paid by</label>
            <select {...register('paidBy')} className="h-11 px-3 rounded-xl border border-zinc-300 bg-white text-sm outline-none focus:border-zinc-900">
              <option value="">Select person</option>
              {groupMembers.map((m) => <option key={m._id} value={m._id}>{m.name || m.email}</option>)}
            </select>
          </div>
        )}

        {/* Split Among */}
        {groupMembers.length > 0 && (
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
      </form>
    </BottomSheet>
  )
}

// ── Budget Form ───────────────────────────────────────────────────────────────
function BudgetForm({ open, onClose, editing, groupId }) {
  const { mutate: create, isPending: creating } = useCreateBudget()
  const { mutate: update, isPending: updating } = useUpdateBudget()
  const { register, handleSubmit, control, reset, watch, formState: { errors } } = useForm({
    defaultValues: { name: '', totalAmount: '', startDate: format(new Date(), 'yyyy-MM-dd'), endDate: format(new Date(new Date().setMonth(new Date().getMonth() + 1)), 'yyyy-MM-dd'), notes: '', categories: [] },
  })
  const { fields, append, remove } = useFieldArray({ control, name: 'categories' })

  useState(() => {
    if (editing) {
      reset({
        name: editing.name,
        totalAmount: editing.totalAmount,
        startDate: editing.startDate ? format(new Date(editing.startDate), 'yyyy-MM-dd') : '',
        endDate: editing.endDate ? format(new Date(editing.endDate), 'yyyy-MM-dd') : '',
        notes: editing.notes || '',
        categories: editing.categories || [],
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
      categories: data.categories.map((c) => ({ ...c, allocatedAmount: parseFloat(c.allocatedAmount) })),
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
            <button type="button" onClick={() => append({ name: '', allocatedAmount: '' })}
              className="text-xs text-zinc-500 underline flex items-center gap-1">
              <Plus size={12} /> Add
            </button>
          </div>
          {fields.map((field, idx) => (
            <div key={field.id} className="flex gap-2 items-center">
              <input {...register(`categories.${idx}.name`)} placeholder="Category name"
                className="flex-1 h-9 px-3 text-sm border border-zinc-200 rounded-xl outline-none focus:border-zinc-900" />
              <input {...register(`categories.${idx}.allocatedAmount`)} type="number" step="0.01" placeholder="Amount"
                className="w-24 h-9 px-3 text-sm border border-zinc-200 rounded-xl outline-none focus:border-zinc-900 text-right" />
              <button type="button" onClick={() => remove(idx)} className="p-1 text-zinc-400 active:text-red-500">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </form>
    </BottomSheet>
  )
}

// ── Overview Tab ──────────────────────────────────────────────────────────────
function OverviewTab({ groupId, period, setPeriod, custom, setCustom, symbol, budgets, recentTxns }) {
  const dates = getPeriodDates(period, custom)
  const { data: summary, isLoading } = useFinanceSummary({ groupId, ...dates })

  return (
    <div className="flex flex-col gap-4">
      <PeriodPicker period={period} setPeriod={setPeriod} custom={custom} setCustom={setCustom} />

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
function TransactionsTab({ groupId, period, setPeriod, custom, setCustom, symbol, groupMembers, categories, externalOpen, onExternalClose }) {
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)

  useEffect(() => {
    if (externalOpen) { setShowForm(true); onExternalClose?.() }
  }, [externalOpen])
  const [typeFilter, setTypeFilter] = useState('')
  const { mutate: del } = useDeleteFinance()

  const dates = getPeriodDates(period, custom)
  const { data: txns = [], isLoading } = useFinance({ groupId, ...dates, type: typeFilter || undefined })

  return (
    <div className="flex flex-col gap-3">
      <PeriodPicker period={period} setPeriod={setPeriod} custom={custom} setCustom={setCustom} />

      {/* Type filter pills */}
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

      {isLoading && <div className="flex justify-center py-8"><Spinner /></div>}

      {!isLoading && txns.length === 0 && (
        <EmptyState icon={CircleDollarSign} title="No transactions" description="Add your first transaction" />
      )}

      {txns.map((t) => {
        const meta = TYPE_META[t.type]
        const Icon = meta.icon
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
                    <p className="text-xs text-zinc-400 mt-0.5">{formatDate(t.date)}{t.category?.name ? ` · ${t.category.name}` : ''}</p>
                    {t.paidBy && <p className="text-[10px] text-zinc-400">Paid by {t.paidBy.name || t.paidBy.email}</p>}
                  </div>
                  <p className={`text-sm font-bold flex-shrink-0 ${meta.color}`}>{fmt(t.amount, symbol)}</p>
                </div>
                {t.splitAmong?.length > 0 && (
                  <p className="text-[10px] text-zinc-400 mt-1">Split: {t.splitAmong.map((s) => s.user?.name || s.user?.email).join(', ')}</p>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-0 mt-2 pt-2 border-t border-zinc-50">
              <button onClick={() => { setEditing(t); setShowForm(true) }} className="p-1 rounded-xl text-zinc-400 active:bg-zinc-100"><Pencil size={15} /></button>
              <button onClick={() => del(t._id)} className="p-1 rounded-xl text-zinc-400 active:bg-zinc-100"><Trash2 size={15} /></button>
            </div>
          </div>
        )
      })}

      <TransactionForm open={showForm} onClose={() => { setShowForm(false); setEditing(null) }}
        editing={editing} groupId={groupId} groupMembers={groupMembers} categories={categories} symbol={symbol} />

      <TransactionForm open={showForm} onClose={() => { setShowForm(false); setEditing(null) }}
        editing={editing} groupId={groupId} groupMembers={groupMembers} categories={categories} symbol={symbol} />
    </div>
  )
}

// ── Budgets Tab ───────────────────────────────────────────────────────────────
function BudgetsTab({ groupId, symbol, budgets = [], isLoading, externalOpen, onExternalClose }) {
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)

  useEffect(() => {
    if (externalOpen) { setShowForm(true); onExternalClose?.() }
  }, [externalOpen])
  const [expanded, setExpanded] = useState(null)
  const { mutate: del } = useDeleteBudget()

  return (
    <div className="flex flex-col gap-3">
      {isLoading && <div className="flex justify-center py-8"><Spinner /></div>}

      {!isLoading && budgets.length === 0 && (
        <EmptyState icon={Wallet} title="No budgets" description="Create a budget to track your spending" />
      )}

      {budgets.map((b) => {
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
                  {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
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

      <BudgetForm open={showForm} onClose={() => { setShowForm(false); setEditing(null) }} editing={editing} groupId={groupId} />
    </div>
  )
}

// ── Debts Tab ─────────────────────────────────────────────────────────────────
function DebtsTab({ groupId, symbol, currentUserId }) {
  const { data: txns = [], isLoading } = useFinance({ groupId })
  const { mutate: settle } = useSettleDebt()

  // Compute net balances from debtTracking
  const netDebts = useMemo(() => {
    const map = {} // key: `${from}-${to}`, value: { from, to, net, entries: [{financeId, debtIndex}] }
    for (const txn of txns) {
      for (let i = 0; i < (txn.debtTracking || []).length; i++) {
        const d = txn.debtTracking[i]
        if (d.settled) continue
        const fromId = d.from?._id || d.from
        const toId = d.to?._id || d.to
        const key = [fromId, toId].sort().join('-')
        if (!map[key]) map[key] = { fromId, toId, fromName: d.from?.name || d.from?.email || fromId, toName: d.to?.name || d.to?.email || toId, amount: 0, entries: [] }
        // from owes to
        if (String(fromId) < String(toId)) {
          map[key].amount += d.amount
        } else {
          map[key].amount -= d.amount
        }
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
            <button
              onClick={() => d.entries.forEach((e) => settle({ id: e.financeId, debtIndex: e.debtIndex }))}
              className="px-3 py-1.5 text-xs font-semibold bg-zinc-900 text-white rounded-xl active:scale-95 transition-transform"
            >
              Settle
            </button>
          </div>
        )
      })}
    </div>
  )
}

// ── Main Finance Page ─────────────────────────────────────────────────────────
export default function Finance() {
  const [tab, setTab]       = useState('overview')
  const [period, setPeriod] = useState('month')
  const [custom, setCustom] = useState({ start: '', end: '' })
  const [showAddTxn, setShowAddTxn]       = useState(false)
  const [showAddBudget, setShowAddBudget] = useState(false)

  const { activeGroupId } = useGroupStore()
  const { data: me }      = useMe()
  const { data: groups }  = useGroups()
  const { data: categories = [] } = useCategories()

  const symbol = CURRENCIES.find((c) => c.code === (me?.currency || 'INR'))?.symbol || '₹'

  const activeGroup = groups?.find((g) => g._id === activeGroupId)
  const groupMembers = activeGroup?.members || []

  const dates = getPeriodDates(period, custom)
  const { data: allTxns = [] }  = useFinance({ groupId: activeGroupId, ...dates })
  const { data: budgets = [], isLoading: budgetsLoading } = useBudgets({ groupId: activeGroupId })

  const handleTabChange = (key) => setTab(key)

  return (
    <>
      <TopBar
        title="Finance"
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
              custom={custom} setCustom={setCustom} symbol={symbol} budgets={budgets} recentTxns={allTxns} />
          )}
          {tab === 'transactions' && (
            <TransactionsTab groupId={activeGroupId} period={period} setPeriod={setPeriod}
              custom={custom} setCustom={setCustom} symbol={symbol} groupMembers={groupMembers} categories={categories}
              externalOpen={showAddTxn} onExternalClose={() => setShowAddTxn(false)} />
          )}
          {tab === 'budgets' && (
            <BudgetsTab groupId={activeGroupId} symbol={symbol} budgets={budgets} isLoading={budgetsLoading}
              externalOpen={showAddBudget} onExternalClose={() => setShowAddBudget(false)} />
          )}
          {tab === 'debts' && (
            <DebtsTab groupId={activeGroupId} symbol={symbol} currentUserId={me?._id} />
          )}
        </div>
      </div>

    </>
  )
}
