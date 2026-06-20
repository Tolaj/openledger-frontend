import { useState, useRef } from 'react'
import React from 'react'
import { Plus, Pencil, Trash2, ChevronDown, FileText, RefreshCw, Users, Repeat, Minus } from 'lucide-react'
import { useForm, useFieldArray } from 'react-hook-form'
import TopBar from '../components/layout/TopBar'
import PageActions from '../components/layout/PageActions'
import BottomSheet from '../components/ui/BottomSheet'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Badge from '../components/ui/Badge'
import EmptyState from '../components/ui/EmptyState'
import DataTable, { DataTableFilterIcon } from '../components/ui/DataTable'
import Spinner from '../components/ui/Spinner'
import Tabs from '../components/ui/Tabs'
import ProductPicker from '../components/features/ProductPicker'
import { useRecipients, useCreateRecipient, useUpdateRecipient, useDeleteRecipient } from '../hooks/useRecipients'
import { useGeneralOrders, useCreateGeneralOrder, useUpdateGeneralOrder, useDeleteGeneralOrder } from '../hooks/useGeneralOrders'
import { useGeneralInvoices, useCreateGeneralInvoice, useUpdateGeneralInvoice, useDeleteGeneralInvoice } from '../hooks/useGeneralInvoices'
import { useRecurring, useCreateRecurring, useUpdateRecurring, useDeleteRecurring } from '../hooks/useRecurring'
import { useProducts } from '../hooks/useProducts'
import { useCurrencySymbol } from '../hooks/useCurrency'

const TABS = [
  { key: 'orders',    label: 'Orders',     icon: FileText  },
  { key: 'invoices',  label: 'Invoices',   icon: FileText  },
  { key: 'recipients',label: 'Recipients', icon: Users     },
  { key: 'recurring', label: 'Recurring',  icon: Repeat    },
]

const INV_STATUS_VARIANT = {
  draft: 'default', sent: 'warning', paid: 'success', overdue: 'danger', cancelled: 'danger',
}
const ORD_STATUS_VARIANT = {
  draft: 'default', sent: 'warning', confirmed: 'success',
  partial: 'warning', received: 'success', delivered: 'success', cancelled: 'danger',
}
const REC_STATUS_VARIANT = {
  active: 'success', paused: 'warning', cancelled: 'danger',
}

const fmt = (n, sym = '₹') => `${sym}${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'


// ── Recipients Tab ────────────────────────────────────────────────────────────
const RECIPIENT_COLS = [
  { key: 'name',  label: 'Name',  filterable: true },
  { key: 'type',  label: 'Type',  filterable: true },
  { key: 'email', label: 'Email', filterable: true, noDropdown: true },
  { key: 'phone', label: 'Phone', filterable: true, noDropdown: true },
  { key: 'action', label: 'Action' },
]

function RecipientsTab({ mobileFiltersOpen, onAdd }) {
  const { data: recipients = [], isLoading } = useRecipients()
  const createRecipient = useCreateRecipient()
  const updateRecipient = useUpdateRecipient()
  const deleteRecipient = useDeleteRecipient()

  const [sheetOpen, setSheetOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [filters, setFilters] = useState({ name: '', type: '', email: '', phone: '' })

  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  const openCreate = () => { setEditing(null); reset({}); setSheetOpen(true) }
  const openEdit   = (r) => { setEditing(r); reset(r); setSheetOpen(true) }
  const close      = () => { setSheetOpen(false); setEditing(null); reset({}) }

  onAdd.current = openCreate

  const setFilter = (key, val) => setFilters((f) => ({ ...f, [key]: val }))

  const filtered = recipients.filter((r) =>
    (r.name  || '').toLowerCase().includes(filters.name.toLowerCase()) &&
    (r.type  || '').toLowerCase().includes(filters.type.toLowerCase()) &&
    (r.email || '').toLowerCase().includes(filters.email.toLowerCase()) &&
    (r.phone || '').toLowerCase().includes(filters.phone.toLowerCase())
  )

  const onSubmit = async (data) => {
    try {
      if (editing) await updateRecipient.mutateAsync({ id: editing._id, data })
      else         await createRecipient.mutateAsync(data)
      close()
    } catch (e) { console.error(e) }
  }

  const renderRow = (r) => (
    <>
      <td className="px-4 py-3 font-medium text-zinc-900">{r.name}</td>
      <td className="px-4 py-3">
        <Badge variant={r.type === 'payee' ? 'warning' : r.type === 'payer' ? 'info' : 'default'}>
          {r.type}
        </Badge>
      </td>
      <td className="px-4 py-3 text-zinc-600 text-sm">{r.email || '—'}</td>
      <td className="px-4 py-3 text-zinc-600 text-sm">{r.phone || '—'}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <button onClick={() => openEdit(r)} className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900 transition-colors">
            <Pencil size={14} />
          </button>
          <button onClick={() => deleteRecipient.mutate(r._id)} className="p-1.5 rounded-lg hover:bg-red-50 text-zinc-500 hover:text-red-600 transition-colors">
            <Trash2 size={14} />
          </button>
        </div>
      </td>
    </>
  )

  if (isLoading) return <Spinner className="py-12" />

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {recipients.length === 0 ? (
        <EmptyState title="No recipients" description="Add payees and payers to get started"
          action={<Button size="sm" onClick={openCreate}><Plus size={16} /> Add Recipient</Button>} />
      ) : (
      <DataTable
        columns={RECIPIENT_COLS}
        data={filtered}
        filters={filters}
        onFilterChange={setFilter}
        isLoading={isLoading}
        renderRow={renderRow}
        emptyMessage="No recipients match filters"
      />

      )}
      <BottomSheet open={sheetOpen} onClose={close} title={editing ? 'Edit Recipient' : 'New Recipient'}>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Input label="Name" placeholder="Full name or company" error={errors.name?.message}
            {...register('name', { required: 'Name required' })} />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700">Type</label>
            <select {...register('type')} className="h-11 px-3 rounded-xl border border-zinc-300 bg-white text-sm outline-none focus:border-zinc-900">
              <option value="both">Both (payee & payer)</option>
              <option value="payee">Payee (you pay them)</option>
              <option value="payer">Payer (they pay you)</option>
            </select>
          </div>
          <Input label="Email" type="email" placeholder="email@example.com" {...register('email')} />
          <Input label="Phone" placeholder="+91 98765 43210" {...register('phone')} />
          <Input label="Notes" placeholder="Optional notes" {...register('notes')} />
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={close}>Cancel</Button>
            <Button type="submit" className="flex-1" disabled={createRecipient.isPending || updateRecipient.isPending}>
              {editing ? 'Save' : 'Create'}
            </Button>
          </div>
        </form>
      </BottomSheet>
    </div>
  )
}

// ── Orders Tab ────────────────────────────────────────────────────────────────
const ORDER_COLS = [
  { key: 'goNumber',  label: 'GO #',      filterable: true, noDropdown: true, width: 'w-28' },
  { key: 'recipient', label: 'Recipient', filterable: true  },
  { key: 'direction', label: 'Direction', filterable: true  },
  { key: 'status',    label: 'Status',    filterable: true  },
  { key: 'items',     label: 'Items',     width: 'w-16'     },
  { key: 'total',     label: 'Total',     width: 'w-32'     },
  { key: 'action',    label: 'action'                       },
]

function OrdersTab({ mobileFiltersOpen, onAdd, recipients, products, sym }) {
  const { data: orders = [], isLoading } = useGeneralOrders()
  const createOrder = useCreateGeneralOrder()
  const updateOrder = useUpdateGeneralOrder()
  const deleteOrder = useDeleteGeneralOrder()

  const [sheetOpen, setSheetOpen]   = useState(false)
  const [statusSheet, setStatusSheet] = useState(null)
  const [expanded, setExpanded]     = useState({})
  const [filters, setFilters]       = useState({ goNumber: '', recipient: '', direction: '', status: '' })
  const [dropSel, setDropSel]       = useState({})
  const [itemErrors, setItemErrors] = useState([])

  const { register, handleSubmit, reset, control, watch, setValue, formState: { errors } } = useForm({
    defaultValues: { recipient: '', direction: 'payable', items: [{ product: '', description: '', qty: 1, unit: '', unitPrice: 0, taxRate: 0 }], orderDate: '', notes: '' },
  })
  const { fields, append, remove } = useFieldArray({ control, name: 'items' })
  const watchItems = watch('items')
  const calcAmount = (idx) => (parseFloat(watchItems?.[idx]?.qty) || 0) * (parseFloat(watchItems?.[idx]?.unitPrice) || 0)

  const handleProductSelect = (idx, productId) => {
    const p = products.find((x) => x._id === productId)
    setValue(`items.${idx}.product`, productId)
    if (p) {
      setValue(`items.${idx}.description`, p.name)
      setValue(`items.${idx}.unitPrice`, p.price ?? 0)
      setValue(`items.${idx}.unit`, p.unit || '')
    }
  }

  const openCreate = () => {
    reset({ recipient: '', direction: 'payable', items: [{ product: '', description: '', qty: 1, unit: '', unitPrice: 0, taxRate: 0 }], orderDate: '', notes: '' })
    setItemErrors([])
    setSheetOpen(true)
  }
  onAdd.current = openCreate

  const setFilter = (k, v) => setFilters((f) => ({ ...f, [k]: v }))
  const setDrop   = (k, v) => setDropSel((p) => ({ ...p, [k]: v }))
  const inDrop    = (k, v) => (dropSel[k]?.length ?? 0) === 0 || dropSel[k].includes(v)

  const dropOpts = {
    direction: [...new Set(orders.map((o) => o.direction).filter(Boolean))],
    status:    [...new Set(orders.map((o) => o.status).filter(Boolean))],
    recipient: [...new Set(orders.map((o) => o.recipient?.name).filter(Boolean))],
  }

  const filtered = orders.filter((o) =>
    (o.goNumber || '').toLowerCase().includes(filters.goNumber.toLowerCase()) &&
    (o.recipient?.name || '').toLowerCase().includes(filters.recipient.toLowerCase()) && inDrop('recipient', o.recipient?.name) &&
    (o.direction || '').includes(filters.direction) && inDrop('direction', o.direction) &&
    (o.status || '').includes(filters.status) && inDrop('status', o.status)
  )

  const onSubmit = async (data) => {
    const errs = data.items.map((it) => !it.product ? 'Please select a product from the catalog' : '')
    setItemErrors(errs)
    if (errs.some(Boolean)) return

    const items = data.items.map((it, i) => ({
      ...(it.product ? { product: it.product } : {}),
      description: it.description,
      qty:       parseFloat(it.qty) || 1,
      unit:      it.unit || '',
      unitPrice: parseFloat(it.unitPrice) || 0,
      taxRate:   parseFloat(it.taxRate) || 0,
      amount:    calcAmount(i),
    }))
    const subtotal  = items.reduce((s, i) => s + i.amount, 0)
    const taxAmount = items.reduce((s, i) => s + i.amount * i.taxRate / 100, 0)

    try {
      await createOrder.mutateAsync({ ...data, items, subtotal, taxAmount, grandTotal: subtotal + taxAmount })
      setSheetOpen(false)
    } catch (e) { console.error(e) }
  }

  const onStatusChange = async (s) => {
    await updateOrder.mutateAsync({ id: statusSheet._id, data: { status: s } })
    setStatusSheet(null)
  }

  const onDelete = (id) => { if (confirm('Delete this order?')) deleteOrder.mutate(id) }

  const toggleExpand = (id) => setExpanded((e) => ({ ...e, [id]: !e[id] }))

  if (isLoading) return <Spinner className="py-12" />

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {orders.length === 0 ? (
        <EmptyState title="No general orders" description="Create your first general order"
          action={<Button size="sm" onClick={openCreate}><Plus size={16} /> Create GO</Button>} />
      ) : (
        <DataTable
          columns={ORDER_COLS}
          data={filtered}
          filters={filters}
          onFilterChange={setFilter}
          dropOpts={dropOpts}
          dropSel={dropSel}
          onDropChange={setDrop}
          isLoading={isLoading}
          emptyMessage="No general orders match filters"
          leadingCol={true}
          renderRow={(o) => (
            <React.Fragment key={o._id}>
              <tr className="border-b border-zinc-100 hover:bg-zinc-50 transition-colors cursor-pointer" onClick={() => toggleExpand(o._id)}>
                <td className="px-3 py-3 border-r border-zinc-100 text-zinc-400">
                  <ChevronDown size={14} className={`transition-transform ${expanded[o._id] ? '' : '-rotate-90'}`} />
                </td>
                <td className="px-4 py-3 border-r border-zinc-100 font-mono text-sm font-semibold text-zinc-900">{o.goNumber}</td>
                <td className="px-4 py-3 border-r border-zinc-100 text-sm text-zinc-700">{o.recipient?.name || '—'}</td>
                <td className="px-4 py-3 border-r border-zinc-100">
                  <Badge variant={o.direction === 'payable' ? 'warning' : 'info'}>{o.direction}</Badge>
                </td>
                <td className="px-4 py-3 border-r border-zinc-100">
                  <Badge variant={ORD_STATUS_VARIANT[o.status] || 'default'}>{o.status}</Badge>
                </td>
                <td className="px-4 py-3 border-r border-zinc-100 text-sm text-center text-zinc-500">{o.items?.length || 0}</td>
                <td className="px-4 py-3 border-r border-zinc-100 text-sm font-semibold text-zinc-900">{sym}{(o.grandTotal || 0).toFixed(2)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5 whitespace-nowrap">
                    <button onClick={(e) => { e.stopPropagation(); setStatusSheet(o) }} className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 active:bg-zinc-100" title="Update status"><RefreshCw size={14} /></button>
                    <button onClick={(e) => { e.stopPropagation(); onDelete(o._id) }} className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 active:bg-zinc-100" title="Delete"><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
              {expanded[o._id] && (
                <tr className="border-b border-zinc-100 bg-zinc-50">
                  <td /><td colSpan={7} className="px-4 py-3">
                    <table className="w-full text-xs border-collapse rounded-xl overflow-hidden border border-zinc-200">
                      <thead>
                        <tr className="border-b border-zinc-200">
                          {['Product / Description', 'Qty', 'Unit Price', 'Tax %', 'Amount', 'Unit'].map((h, i, arr) => (
                            <th key={h} className={`px-3 py-2 text-left text-xs font-semibold text-zinc-500 ${i < arr.length - 1 ? 'border-r border-zinc-200' : ''}`}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {(o.items || []).map((it, idx, arr) => (
                          <tr key={idx} className={idx < arr.length - 1 ? 'border-b border-zinc-100' : ''}>
                            <td className="px-3 py-2 border-r border-zinc-100 font-medium text-zinc-800">{it.product?.name || it.description || '—'}</td>
                            <td className="px-3 py-2 border-r border-zinc-100 text-zinc-600">{it.qty ?? '—'}</td>
                            <td className="px-3 py-2 border-r border-zinc-100 text-zinc-600">{sym}{(it.unitPrice ?? 0).toFixed(2)}</td>
                            <td className="px-3 py-2 border-r border-zinc-100 text-zinc-600">{it.taxRate ?? 0}%</td>
                            <td className="px-3 py-2 border-r border-zinc-100 text-zinc-600">{sym}{(it.amount ?? 0).toFixed(2)}</td>
                            <td className="px-3 py-2 text-zinc-600">{it.unit || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </td>
                </tr>
              )}
            </React.Fragment>
          )}
        />
      )}

      {/* Create GO Sheet */}
      <BottomSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Create General Order"
        footer={<Button fullWidth loading={createOrder.isPending} onClick={handleSubmit(onSubmit)}>Create GO</Button>}
      >
        <div className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700">Recipient *</label>
            <select {...register('recipient', { required: 'Recipient is required' })}
              className="h-11 w-full rounded-xl border border-zinc-300 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900">
              <option value="">Select recipient…</option>
              {recipients.map((r) => <option key={r._id} value={r._id}>{r.name}</option>)}
            </select>
            {errors.recipient && <p className="text-xs text-red-500">{errors.recipient.message}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700">Direction</label>
            <select {...register('direction')}
              className="h-11 w-full rounded-xl border border-zinc-300 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900">
              <option value="payable">Payable (we pay)</option>
              <option value="receivable">Receivable (we receive)</option>
            </select>
          </div>

          {/* Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-zinc-700">Items</label>
              <button type="button"
                onClick={() => append({ product: '', description: '', qty: 1, unit: '', unitPrice: 0, taxRate: 0 })}
                className="text-xs font-medium text-zinc-600 flex items-center gap-1 hover:text-zinc-900">
                <Plus size={13} /> Add Item
              </button>
            </div>
            <div className="space-y-3">
              {fields.map((field, idx) => (
                <div key={field.id} className="border border-zinc-200 rounded-xl p-3 space-y-2 relative overflow-visible">
                  {fields.length > 1 && (
                    <button type="button" onClick={() => remove(idx)} className="absolute top-2 right-2 p-1 text-zinc-400 hover:text-red-500">
                      <Minus size={14} />
                    </button>
                  )}
                  <ProductPicker
                    products={products}
                    value={watchItems?.[idx]?.product || ''}
                    onChange={(id) => { handleProductSelect(idx, id); setItemErrors((e) => { const n = [...e]; n[idx] = ''; return n }) }}
                    sym={sym}
                    error={itemErrors[idx]}
                  />
                  <input type="hidden" {...register(`items.${idx}.unit`)} />
                  <Input label="Description" {...register(`items.${idx}.description`)} placeholder="Item description" />
                  <div className="grid grid-cols-3 gap-2">
                    <Input label="Qty"        type="number" min="0" step="0.01"  {...register(`items.${idx}.qty`)} />
                    <Input label="Unit Price" type="number" min="0" step="0.01"  {...register(`items.${idx}.unitPrice`)} />
                    <Input label="Tax %"      type="number" min="0" step="0.1"   {...register(`items.${idx}.taxRate`)} />
                  </div>
                  <p className="text-xs text-zinc-500 text-right">
                    Amount: <span className="font-semibold text-zinc-900">{sym}{calcAmount(idx).toFixed(2)}</span>
                  </p>
                </div>
              ))}
            </div>
          </div>

          <Input label="Order Date" type="date" {...register('orderDate')} />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700">Notes</label>
            <textarea {...register('notes')} rows={2} placeholder="Optional notes…"
              className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 resize-none" />
          </div>
        </div>
      </BottomSheet>

      {/* Status Sheet */}
      <BottomSheet open={!!statusSheet} onClose={() => setStatusSheet(null)} title="Update Status">
        <div className="grid grid-cols-2 gap-2 pb-2">
          {(statusSheet?.direction === 'payable'
            ? ['draft', 'sent', 'partial', 'received', 'cancelled']
            : ['draft', 'confirmed', 'partial', 'delivered', 'cancelled']
          ).map((s) => (
            <button key={s} onClick={() => onStatusChange(s)}
              className={['py-3 rounded-xl text-sm font-medium capitalize border transition-colors',
                statusSheet?.status === s ? 'bg-zinc-900 text-white border-zinc-900' : 'border-zinc-200 text-zinc-700 hover:bg-zinc-50',
              ].join(' ')}>
              {s}
            </button>
          ))}
        </div>
      </BottomSheet>
    </div>
  )
}

// ── Invoices Tab ──────────────────────────────────────────────────────────────
const INVOICE_COLS = [
  { key: 'invoiceNumber', label: 'Invoice #',  filterable: true, noDropdown: true },
  { key: 'go',            label: 'GO #',       filterable: true, noDropdown: true },
  { key: 'recipient',     label: 'Recipient',  filterable: true  },
  { key: 'direction',     label: 'Direction',  filterable: true  },
  { key: 'status',        label: 'Status',     filterable: true  },
  { key: 'dueDate',       label: 'Due Date',   filterable: false },
  { key: 'grandTotal',    label: 'Total',      filterable: false },
  { key: 'action',        label: 'Action'                        },
]

function InvoicesTab({ mobileFiltersOpen, onAdd, recipients, orders, products, sym }) {
  const { data: invoices = [], isLoading } = useGeneralInvoices()
  const createInvoice = useCreateGeneralInvoice()
  const updateInvoice = useUpdateGeneralInvoice()
  const deleteInvoice = useDeleteGeneralInvoice()

  const [sheetOpen, setSheetOpen]   = useState(false)
  const [editing, setEditing]       = useState(null)
  const [statusSheet, setStatusSheet] = useState(null)
  const [expanded, setExpanded]     = useState({})
  const [filters, setFilters]       = useState({ invoiceNumber: '', recipient: '', direction: '', status: '' })
  const [sourceType, setSourceType] = useState('go') // 'go' | 'manual'
  const [formError, setFormError]   = useState('')

  const { register, handleSubmit, reset, control, watch, setValue, formState: { errors } } = useForm({
    defaultValues: { direction: 'expense', status: 'draft', items: [{ product: '', description: '', qty: 1, unit: '', unitPrice: 0, taxRate: 0 }] },
  })
  const { fields: invFields, append: appendInvItem, remove: removeInvItem } = useFieldArray({ control, name: 'items' })
  const watchItems = watch('items')
  const watchGoId  = watch('generalOrder')
  const calcInvAmount = (idx) => (parseFloat(watchItems?.[idx]?.qty) || 0) * (parseFloat(watchItems?.[idx]?.unitPrice) || 0)

  // When a GO is selected in "From GO" mode, auto-fill recipient + items
  const handleGoSelect = (goId) => {
    setValue('generalOrder', goId)
    const go = orders.find((o) => o._id === goId)
    if (go) {
      setValue('recipient', go.recipient?._id || go.recipient || '')
      setValue('direction', go.direction === 'payable' ? 'expense' : 'income')
      // replace items with GO items
      const goItems = (go.items || []).map((it) => ({
        product:     it.product?._id || it.product || '',
        description: it.product?.name || it.description || '',
        qty:         it.qty ?? 1,
        unit:        it.unit || '',
        unitPrice:   it.unitPrice ?? 0,
        taxRate:     it.taxRate ?? 0,
      }))
      reset((prev) => ({ ...prev, generalOrder: goId, recipient: go.recipient?._id || go.recipient || '', direction: go.direction === 'payable' ? 'expense' : 'income', items: goItems }))
    }
  }

  const openCreate = () => {
    setEditing(null)
    setSourceType('go')
    setFormError('')
    reset({ generalOrder: '', direction: 'expense', status: 'draft', items: [{ product: '', description: '', qty: 1, unit: '', unitPrice: 0, taxRate: 0 }] })
    setSheetOpen(true)
  }
  const openEdit   = (inv) => {
    setEditing(inv)
    setSourceType(inv.generalOrder ? 'go' : 'manual')
    setFormError('')
    reset({
      ...inv,
      recipient:    inv.recipient?._id || inv.recipient,
      generalOrder: inv.generalOrder?._id || inv.generalOrder,
      items:        inv.items || [],
    })
    setSheetOpen(true)
  }
  const close = () => { setSheetOpen(false); setEditing(null); setFormError('') }

  onAdd.current = openCreate

  const setFilter = (k, v) => setFilters((f) => ({ ...f, [k]: v }))

  const calcTotals = (items = []) => {
    const mappedItems = items.map((i) => ({
      ...(i.product ? { product: i.product } : {}),
      description: i.description,
      qty:       parseFloat(i.qty) || 1,
      unit:      i.unit || '',
      unitPrice: parseFloat(i.unitPrice) || 0,
      taxRate:   parseFloat(i.taxRate) || 0,
      amount:    (parseFloat(i.qty) || 0) * (parseFloat(i.unitPrice) || 0) * (1 + (parseFloat(i.taxRate) || 0) / 100),
    }))
    const subtotal  = mappedItems.reduce((s, i) => s + i.amount, 0)
    const taxAmount = mappedItems.reduce((s, i) => s + i.amount * i.taxRate / 100, 0)
    return { items: mappedItems, subtotal, taxAmount, grandTotal: subtotal + taxAmount }
  }

  const onSubmit = async (data) => {
    if (sourceType === 'go' && !data.generalOrder) { setFormError('Please select a General Order'); return }
    setFormError('')
    try {
      const payload = { ...data, ...calcTotals(data.items) }
      if (!payload.generalOrder) delete payload.generalOrder
      if (editing) await updateInvoice.mutateAsync({ id: editing._id, data: payload })
      else         await createInvoice.mutateAsync(payload)
      close()
    } catch (e) { console.error(e) }
  }

  const filtered = invoices.filter((inv) =>
    (inv.invoiceNumber || '').toLowerCase().includes(filters.invoiceNumber.toLowerCase()) &&
    (inv.recipient?.name || '').toLowerCase().includes(filters.recipient.toLowerCase()) &&
    (inv.direction || '').toLowerCase().includes(filters.direction.toLowerCase()) &&
    (inv.status || '').toLowerCase().includes(filters.status.toLowerCase())
  )

  const toggleExpand = (id) => setExpanded((e) => ({ ...e, [id]: !e[id] }))

  const renderRow = (inv) => (
    <React.Fragment key={inv._id}>
      <tr className="border-b border-zinc-100 hover:bg-zinc-50 transition-colors cursor-pointer" onClick={() => toggleExpand(inv._id)}>
        <td className="px-3 py-3 border-r border-zinc-100 text-zinc-400">
          <ChevronDown size={14} className={`transition-transform ${expanded[inv._id] ? '' : '-rotate-90'}`} />
        </td>
        <td className="px-4 py-3 font-mono text-sm text-zinc-900">{inv.invoiceNumber}</td>
        <td className="px-4 py-3 font-mono text-sm text-zinc-500">{inv.generalOrder?.goNumber || '—'}</td>
        <td className="px-4 py-3 font-medium text-zinc-900">{inv.recipient?.name || '—'}</td>
        <td className="px-4 py-3">
          <Badge variant={inv.direction === 'income' ? 'info' : 'warning'}>{inv.direction}</Badge>
        </td>
        <td className="px-4 py-3">
          <Badge variant={INV_STATUS_VARIANT[inv.status] || 'default'}>{inv.status}</Badge>
        </td>
        <td className="px-4 py-3 text-sm text-zinc-500">{fmtDate(inv.dueDate)}</td>
        <td className="px-4 py-3 font-semibold text-zinc-900">{fmt(inv.grandTotal, sym)}</td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setStatusSheet(inv)} className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 active:bg-zinc-100" title="Update status">
              <RefreshCw size={14} />
            </button>
            <button onClick={() => deleteInvoice.mutate(inv._id)} className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 active:bg-zinc-100" title="Delete">
              <Trash2 size={14} />
            </button>
          </div>
        </td>
      </tr>
      {expanded[inv._id] && (
        <tr className="border-b border-zinc-100 bg-zinc-50">
          <td /><td colSpan={8} className="px-4 py-3">
            <div className="flex gap-6 text-xs text-zinc-500 mb-2">
              <span>Subtotal: <strong className="text-zinc-800">{sym}{(inv.subtotal || 0).toFixed(2)}</strong></span>
              <span>Tax: <strong className="text-zinc-800">{sym}{(inv.taxAmount || 0).toFixed(2)}</strong></span>
              <span>Total: <strong className="text-zinc-900">{sym}{(inv.grandTotal || 0).toFixed(2)}</strong></span>
              {inv.dueDate && <span>Due: <strong className="text-zinc-800">{fmtDate(inv.dueDate)}</strong></span>}
            </div>
            <table className="w-full text-xs border-collapse rounded-xl overflow-hidden border border-zinc-200">
              <thead>
                <tr className="border-b border-zinc-200">
                  {['Product / Description', 'Qty', 'Unit Price', 'Tax %', 'Amount', 'Unit'].map((h, i, arr) => (
                    <th key={h} className={`px-3 py-2 text-left text-xs font-semibold text-zinc-500 ${i < arr.length - 1 ? 'border-r border-zinc-200' : ''}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(inv.items || []).map((it, i, arr) => (
                  <tr key={i} className={i < arr.length - 1 ? 'border-b border-zinc-100' : ''}>
                    <td className="px-3 py-2 border-r border-zinc-100 font-medium text-zinc-800">{it.product?.name || it.description || '—'}</td>
                    <td className="px-3 py-2 border-r border-zinc-100 text-zinc-600">{it.qty}</td>
                    <td className="px-3 py-2 border-r border-zinc-100 text-zinc-600">{sym}{(it.unitPrice ?? 0).toFixed(2)}</td>
                    <td className="px-3 py-2 border-r border-zinc-100 text-zinc-600">{it.taxRate ?? 0}%</td>
                    <td className="px-3 py-2 border-r border-zinc-100 text-zinc-600">{sym}{(it.amount ?? 0).toFixed(2)}</td>
                    <td className="px-3 py-2 text-zinc-600">{it.unit || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </td>
        </tr>
      )}
    </React.Fragment>
  )

  if (isLoading) return <Spinner className="py-12" />

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {invoices.length === 0 ? (
        <EmptyState title="No invoices" description="Create your first general invoice"
          action={<Button size="sm" onClick={openCreate}><Plus size={16} /> Create Invoice</Button>} />
      ) : (
        <DataTable
          columns={INVOICE_COLS}
          data={filtered}
          filters={filters}
          onFilterChange={setFilter}
          isLoading={isLoading}
          renderRow={renderRow}
          leadingCol={true}
          emptyMessage="No invoices match filters"
        />
      )}

      <BottomSheet open={sheetOpen} onClose={close} title={editing ? 'Edit Invoice' : 'New General Invoice'}
        footer={
          <Button fullWidth loading={createInvoice.isPending || updateInvoice.isPending} onClick={handleSubmit(onSubmit)}>
            {editing ? 'Save' : 'Create Invoice'}
          </Button>
        }
      >
        <div className="flex flex-col gap-4">
          {/* Source type toggle (only on create) */}
          {!editing && (
            <div className="flex gap-1 bg-zinc-100 rounded-xl p-0.5">
              {[['go', 'From GO'], ['manual', 'Manual']].map(([k, label]) => (
                <button key={k} type="button"
                  onClick={() => { setSourceType(k); setFormError(''); reset({ generalOrder: '', direction: 'expense', status: 'draft', items: [{ product: '', description: '', qty: 1, unit: '', unitPrice: 0, taxRate: 0 }] }) }}
                  className={['flex-1 py-1.5 text-xs font-semibold rounded-[10px] transition-all', sourceType === k ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-400'].join(' ')}>
                  {label}
                </button>
              ))}
            </div>
          )}

          {/* From GO: GO selector (auto-fills recipient + items) */}
          {sourceType === 'go' && (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-zinc-700">General Order <span className="text-red-500">*</span></label>
              <select value={watchGoId || ''} onChange={(e) => handleGoSelect(e.target.value)}
                className="h-11 px-3 rounded-xl border border-zinc-300 bg-white text-sm outline-none focus:border-zinc-900">
                <option value="">Select GO…</option>
                {orders.map((o) => <option key={o._id} value={o._id}>{o.goNumber} — {o.recipient?.name || '?'}</option>)}
              </select>
            </div>
          )}

          {/* Manual: recipient picker */}
          {sourceType === 'manual' && (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-zinc-700">Recipient <span className="text-red-500">*</span></label>
              <select {...register('recipient', { required: 'Recipient required' })}
                className="h-11 px-3 rounded-xl border border-zinc-300 bg-white text-sm outline-none focus:border-zinc-900">
                <option value="">Select recipient…</option>
                {recipients.map((r) => <option key={r._id} value={r._id}>{r.name}</option>)}
              </select>
              {errors.recipient && <p className="text-xs text-red-500">{errors.recipient.message}</p>}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-zinc-700">Direction</label>
              <select {...register('direction')} className="h-11 px-3 rounded-xl border border-zinc-300 bg-white text-sm outline-none focus:border-zinc-900">
                <option value="expense">Expense (we pay)</option>
                <option value="income">Income (we receive)</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-zinc-700">Status</label>
              <select {...register('status')} className="h-11 px-3 rounded-xl border border-zinc-300 bg-white text-sm outline-none focus:border-zinc-900">
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <Input label="Due Date" type="date" {...register('dueDate')} />

          <Input label="Notes" placeholder="Optional notes" {...register('notes')} />

          {/* Items — only shown in Manual mode */}
          {sourceType === 'manual' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-zinc-700">Items</label>
                <button type="button"
                  onClick={() => appendInvItem({ product: '', description: '', qty: 1, unit: '', unitPrice: 0, taxRate: 0 })}
                  className="text-xs font-medium text-zinc-600 flex items-center gap-1 hover:text-zinc-900 outline-none focus:outline-none">
                  <Plus size={13} /> Add Item
                </button>
              </div>
              <div className="space-y-3">
                {invFields.map((field, idx) => (
                  <div key={field.id} className="border border-zinc-200 rounded-xl p-3 space-y-2 relative">
                    {invFields.length > 1 && (
                      <button type="button" onClick={() => removeInvItem(idx)} className="absolute top-2 right-2 p-1 text-zinc-400 hover:text-red-500"><Minus size={14} /></button>
                    )}
                    <input {...register(`items.${idx}.description`)} placeholder="Description *"
                      className="w-full h-9 rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900" />
                    <div className="grid grid-cols-4 gap-2">
                      <div className="flex flex-col gap-1">
                        <label className="text-xs text-zinc-500">Qty</label>
                        <input type="number" min="0" step="0.01" {...register(`items.${idx}.qty`)}
                          className="h-9 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs text-zinc-500">Unit</label>
                        <input placeholder="pcs" {...register(`items.${idx}.unit`)}
                          className="h-9 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs text-zinc-500">Unit Price</label>
                        <input type="number" min="0" step="0.01" {...register(`items.${idx}.unitPrice`)}
                          className="h-9 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs text-zinc-500">Tax %</label>
                        <input type="number" min="0" step="0.1" {...register(`items.${idx}.taxRate`)}
                          className="h-9 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900" />
                      </div>
                    </div>
                    <p className="text-xs text-zinc-400 text-right">
                      Amount: <span className="font-semibold text-zinc-800">{sym}{calcInvAmount(idx).toFixed(2)}</span>
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {formError && <p className="text-xs text-red-500 font-medium">{formError}</p>}
        </div>
      </BottomSheet>

      <BottomSheet open={!!statusSheet} onClose={() => setStatusSheet(null)} title="Update Invoice Status">
        <div className="grid grid-cols-2 gap-2 pb-2">
          {['draft', 'sent', 'paid', 'overdue', 'cancelled'].map((s) => (
            <button key={s} onClick={async () => { await updateInvoice.mutateAsync({ id: statusSheet._id, data: { status: s } }); setStatusSheet(null) }}
              className={['py-3 rounded-xl text-sm font-medium capitalize border transition-colors',
                statusSheet?.status === s ? 'bg-zinc-900 text-white border-zinc-900' : 'border-zinc-200 text-zinc-700 hover:bg-zinc-50',
              ].join(' ')}>
              {s}
            </button>
          ))}
        </div>
      </BottomSheet>
    </div>
  )
}

// ── Recurring Tab ─────────────────────────────────────────────────────────────
const RECURRING_COLS = [
  { key: 'name',        label: 'Name',        filterable: true  },
  { key: 'recipient',   label: 'Recipient',   filterable: true  },
  { key: 'frequency',   label: 'Frequency',   filterable: true  },
  { key: 'nextRunDate', label: 'Next Run',    filterable: false },
  { key: 'status',      label: 'Status',      filterable: true  },
  { key: 'items',       label: 'Items',       filterable: false },
  { key: 'grandTotal',  label: 'Total',       filterable: false },
  { key: 'action',      label: 'Action'                         },
]

const FREQ_LABELS = {
  daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly', quarterly: 'Quarterly', yearly: 'Yearly',
}

function RecurringTab({ mobileFiltersOpen, onAdd, recipients, sym }) {
  const { data: recurrings = [], isLoading } = useRecurring()
  const createRecurring = useCreateRecurring()
  const updateRecurring = useUpdateRecurring()
  const deleteRecurring = useDeleteRecurring()

  const [sheetOpen, setSheetOpen] = useState(false)
  const [editing, setEditing]     = useState(null)
  const [statusSheet, setStatusSheet] = useState(null)
  const [filters, setFilters]     = useState({ name: '', recipient: '', frequency: '', status: '' })

  const { register, handleSubmit, reset, control, watch, formState: { errors } } = useForm({
    defaultValues: { frequency: 'monthly', status: 'active', direction: 'payable', autoCreate: false, items: [] },
  })
  const { fields: recFields, append: recAppend, remove: recRemove } = useFieldArray({ control, name: 'items' })
  const recItems = watch('items') || []
  const calcRecAmount = (idx) => {
    const it = recItems[idx] || {}
    return (parseFloat(it.qty) || 0) * (parseFloat(it.unitPrice) || 0)
  }
  const recGrandTotal = recItems.reduce((s, it, i) => s + calcRecAmount(i), 0)

  const openCreate = () => { setEditing(null); reset({ frequency: 'monthly', status: 'active', direction: 'payable', autoCreate: false, items: [] }); setSheetOpen(true) }
  const openEdit   = (r) => {
    setEditing(r)
    reset({
      ...r,
      recipient:   r.recipient?._id || r.recipient,
      nextRunDate: r.nextRunDate ? new Date(r.nextRunDate).toISOString().slice(0, 10) : '',
      items:       r.items || [],
    })
    setSheetOpen(true)
  }
  const close = () => { setSheetOpen(false); setEditing(null) }

  onAdd.current = openCreate

  const setFilter = (k, v) => setFilters((f) => ({ ...f, [k]: v }))

  const onSubmit = async (data) => {
    try {
      const items = (data.items || []).map((it) => ({
        description: it.description || '',
        qty:         parseFloat(it.qty)       || 0,
        unit:        it.unit || '',
        unitPrice:   parseFloat(it.unitPrice) || 0,
        taxRate:     parseFloat(it.taxRate)   || 0,
        amount:      (parseFloat(it.qty) || 0) * (parseFloat(it.unitPrice) || 0),
      }))
      const grandTotal = items.reduce((s, it) => s + it.amount, 0)
      const payload = { ...data, items, grandTotal }
      if (!payload.recipient) delete payload.recipient
      if (editing) await updateRecurring.mutateAsync({ id: editing._id, data: payload })
      else         await createRecurring.mutateAsync(payload)
      close()
    } catch (e) { console.error(e) }
  }

  const filtered = recurrings.filter((r) =>
    (r.name || '').toLowerCase().includes(filters.name.toLowerCase()) &&
    (r.recipient?.name || '').toLowerCase().includes(filters.recipient.toLowerCase()) &&
    (r.frequency || '').toLowerCase().includes(filters.frequency.toLowerCase()) &&
    (r.status || '').toLowerCase().includes(filters.status.toLowerCase())
  )

  const renderRow = (r) => (
    <tr key={r._id} className="border-b border-zinc-100 hover:bg-zinc-50 transition-colors">
      <td className="px-4 py-3 font-medium text-zinc-900">{r.name}</td>
      <td className="px-4 py-3 text-zinc-600">{r.recipient?.name || '—'}</td>
      <td className="px-4 py-3">
        <Badge variant="default">{FREQ_LABELS[r.frequency] || r.frequency}</Badge>
      </td>
      <td className="px-4 py-3 text-sm text-zinc-500">{fmtDate(r.nextRunDate)}</td>
      <td className="px-4 py-3">
        <Badge variant={REC_STATUS_VARIANT[r.status] || 'default'}>{r.status}</Badge>
      </td>
      <td className="px-4 py-3 text-sm text-zinc-500">{(r.items || []).length || '—'}</td>
      <td className="px-4 py-3 font-semibold text-zinc-900">{fmt(r.grandTotal, sym)}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1">
          <button
            title="Update status"
            onClick={() => setStatusSheet(r)}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 active:bg-zinc-100 transition-colors"
          >
            <RefreshCw size={14} />
          </button>
          <button onClick={() => openEdit(r)} className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900 transition-colors">
            <Pencil size={14} />
          </button>
          <button onClick={() => deleteRecurring.mutate(r._id)} className="p-1.5 rounded-lg hover:bg-red-50 text-zinc-500 hover:text-red-600 transition-colors">
            <Trash2 size={14} />
          </button>
        </div>
      </td>
    </tr>
  )

  if (isLoading) return <Spinner className="py-12" />

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {recurrings.length === 0 ? (
        <EmptyState title="No recurring entries" description="Set up subscriptions and renewals"
          action={<Button size="sm" onClick={openCreate}><Plus size={16} /> Add Recurring</Button>} />
      ) : (
        <DataTable
          columns={RECURRING_COLS}
          data={filtered}
          filters={filters}
          onFilterChange={setFilter}
          isLoading={isLoading}
          renderRow={renderRow}
          emptyMessage="No recurring entries match filters"
        />
      )}

      <BottomSheet open={!!statusSheet} onClose={() => setStatusSheet(null)} title="Update Status">
        <div className="grid grid-cols-2 gap-2 pb-2">
          {['active', 'paused', 'cancelled'].map((s) => (
            <button
              key={s}
              onClick={async () => {
                await updateRecurring.mutateAsync({ id: statusSheet._id, data: { status: s } })
                setStatusSheet(null)
              }}
              className={[
                'py-3 rounded-xl text-sm font-medium capitalize border transition-colors',
                statusSheet?.status === s
                  ? 'bg-zinc-900 text-white border-zinc-900'
                  : 'border-zinc-200 text-zinc-700 hover:bg-zinc-50',
              ].join(' ')}
            >
              {s}
            </button>
          ))}
        </div>
      </BottomSheet>

      <BottomSheet open={sheetOpen} onClose={close} title={editing ? 'Edit Recurring' : 'New Recurring'}>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Input label="Name" placeholder="e.g. Monthly SaaS subscription" error={errors.name?.message}
            {...register('name', { required: 'Name required' })} />

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700">Recipient</label>
            <select {...register('recipient')} className="h-11 px-3 rounded-xl border border-zinc-300 bg-white text-sm outline-none focus:border-zinc-900">
              <option value="">No recipient</option>
              {recipients.map((r) => <option key={r._id} value={r._id}>{r.name}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-zinc-700">Direction</label>
              <select {...register('direction')} className="h-11 px-3 rounded-xl border border-zinc-300 bg-white text-sm outline-none focus:border-zinc-900">
                <option value="payable">Payable (we pay)</option>
                <option value="receivable">Receivable (we receive)</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-zinc-700">Frequency</label>
              <select {...register('frequency', { required: true })} className="h-11 px-3 rounded-xl border border-zinc-300 bg-white text-sm outline-none focus:border-zinc-900">
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input label="Next Run Date" type="date" error={errors.nextRunDate?.message}
              {...register('nextRunDate', { required: 'Next run date required' })} />
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-zinc-700">Status</label>
              <select {...register('status')} className="h-11 px-3 rounded-xl border border-zinc-300 bg-white text-sm outline-none focus:border-zinc-900">
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Items */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-zinc-700">Items</label>
              <button
                type="button"
                onClick={() => recAppend({ description: '', qty: 1, unit: '', unitPrice: 0, taxRate: 0 })}
                className="text-xs text-zinc-500 hover:text-zinc-900 flex items-center gap-1 outline-none focus:outline-none focus-visible:outline-none"
              >
                <Plus size={13} /> Add Item
              </button>
            </div>
            {recFields.length === 0 && (
              <p className="text-xs text-zinc-400 text-center py-3 border border-dashed border-zinc-200 rounded-xl">No items yet — click Add Item</p>
            )}
            {recFields.map((field, idx) => (
              <div key={field.id} className="border border-zinc-200 rounded-xl p-3 space-y-2 relative">
                <button type="button" onClick={() => recRemove(idx)} className="absolute top-2 right-2 p-1 rounded text-zinc-300 hover:text-red-500 outline-none focus:outline-none">
                  <Minus size={13} />
                </button>
                <input
                  {...register(`items.${idx}.description`)}
                  placeholder="Description *"
                  className="w-full h-9 rounded-lg border border-zinc-300 bg-white px-3 text-sm outline-none focus:border-zinc-900 pr-6"
                />
                <div className="grid grid-cols-4 gap-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-zinc-500">Qty</label>
                    <input type="number" min="0" step="any" {...register(`items.${idx}.qty`)}
                      className="h-9 rounded-lg border border-zinc-300 bg-white px-3 text-sm outline-none focus:border-zinc-900" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-zinc-500">Unit</label>
                    <input placeholder="pcs" {...register(`items.${idx}.unit`)}
                      className="h-9 rounded-lg border border-zinc-300 bg-white px-3 text-sm outline-none focus:border-zinc-900" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-zinc-500">Unit Price</label>
                    <input type="number" min="0" step="any" {...register(`items.${idx}.unitPrice`)}
                      className="h-9 rounded-lg border border-zinc-300 bg-white px-3 text-sm outline-none focus:border-zinc-900" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-zinc-500">Tax %</label>
                    <input type="number" min="0" step="any" {...register(`items.${idx}.taxRate`)}
                      className="h-9 rounded-lg border border-zinc-300 bg-white px-3 text-sm outline-none focus:border-zinc-900" />
                  </div>
                </div>
                <p className="text-xs text-zinc-400 text-right">
                  Amount: <span className="font-semibold text-zinc-800">{sym}{calcRecAmount(idx).toFixed(2)}</span>
                </p>
              </div>
            ))}
            {recFields.length > 0 && (
              <p className="text-xs text-zinc-500 text-right pr-1">
                Total: <span className="font-semibold text-zinc-900">{sym}{recGrandTotal.toFixed(2)}</span>
              </p>
            )}
          </div>

          <div className="flex items-center gap-3 py-1">
            <input type="checkbox" id="autoCreate" {...register('autoCreate')} className="w-4 h-4 rounded border-zinc-300 accent-zinc-900" />
            <label htmlFor="autoCreate" className="text-sm text-zinc-700">Auto-create order on schedule</label>
          </div>

          <Input label="Notes" placeholder="Optional notes" {...register('notes')} />

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={close}>Cancel</Button>
            <Button type="submit" className="flex-1" disabled={createRecurring.isPending || updateRecurring.isPending}>
              {editing ? 'Save' : 'Create'}
            </Button>
          </div>
        </form>
      </BottomSheet>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function General() {
  const [tab, setTab]                         = useState('orders')
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const onAddRef = useRef(null)
  const sym      = useCurrencySymbol()

  const { data: recipients = [] } = useRecipients()
  const { data: orders = [] }     = useGeneralOrders()
  const { data: products = [] }   = useProducts()

  const addBtn =
    tab === 'orders'     ? <Button size="sm" onClick={() => onAddRef.current?.()}><Plus size={16} /> Create GO</Button>
    : tab === 'invoices'  ? <Button size="sm" onClick={() => onAddRef.current?.()}><Plus size={16} /> Create Invoice</Button>
    : tab === 'recipients'? <Button size="sm" onClick={() => onAddRef.current?.()}><Plus size={16} /> Add Recipient</Button>
    : tab === 'recurring' ? <Button size="sm" onClick={() => onAddRef.current?.()}><Plus size={16} /> Add Recurring</Button>
    : null

  const renderTab = () => {
    switch (tab) {
      case 'orders':     return <OrdersTab     mobileFiltersOpen={mobileFiltersOpen} onAdd={onAddRef} recipients={recipients} products={products} sym={sym} />
      case 'invoices':   return <InvoicesTab   mobileFiltersOpen={mobileFiltersOpen} onAdd={onAddRef} recipients={recipients} orders={orders} products={products} sym={sym} />
      case 'recipients': return <RecipientsTab mobileFiltersOpen={mobileFiltersOpen} onAdd={onAddRef} />
      case 'recurring':  return <RecurringTab  mobileFiltersOpen={mobileFiltersOpen} onAdd={onAddRef} recipients={recipients} sym={sym} />
      default:           return null
    }
  }

  return (
    <>
      <TopBar
        title="General"
        filterIcon={<DataTableFilterIcon open={mobileFiltersOpen} onChange={setMobileFiltersOpen} />}
        right={
          <button onClick={() => onAddRef.current?.()} className="p-2 rounded-xl active:bg-zinc-100">
            <Plus size={20} />
          </button>
        }
      />

      <div className="px-4 pt-0 pb-5 md:px-0 md:py-0 md:pb-4 md:flex md:flex-col md:flex-1 md:min-h-0">
        <div className="flex items-center justify-between gap-4 flex-shrink-0 py-4 md:py-0 md:mb-4">
          <Tabs tabs={TABS} active={tab} onChange={setTab} />
          <PageActions add={addBtn} />
        </div>

        <div className="md:flex-1 md:min-h-0 md:flex md:flex-col">
          {renderTab()}
        </div>
      </div>
    </>
  )
}
