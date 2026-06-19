import { useState, useRef } from 'react'
import { Construction, Plus, Pencil, Trash2, Users, TrendingUp, Minus, Truck, RefreshCw, ChevronDown, FileText } from 'lucide-react'
import React from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import TopBar from '../components/layout/TopBar'
import PageActions from '../components/layout/PageActions'
import BottomSheet from '../components/ui/BottomSheet'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Badge from '../components/ui/Badge'
import EmptyState from '../components/ui/EmptyState'
import DataTable, { DataTableFilterIcon, DataTableMobileFilters } from '../components/ui/DataTable'
import { useCustomers, useCreateCustomer, useUpdateCustomer, useDeleteCustomer } from '../hooks/useCustomers'
import { useSalesOrders, useCreateSalesOrder, useUpdateSalesOrder, useDeleteSalesOrder } from '../hooks/useSalesOrders'
import { useDeliveries, useCreateDelivery, useDeleteDelivery } from '../hooks/useDeliveries'
import { useSalesInvoices, useCreateSalesInvoice, useUpdateSalesInvoice, useDeleteSalesInvoice } from '../hooks/useSalesInvoices'
import { useProducts } from '../hooks/useProducts'
import { useCurrencySymbol } from '../hooks/useCurrency'
import ProductPicker from '../components/features/ProductPicker'

const TABS = [
  { key: 'so',        label: 'Sales Orders', mobileLabel: 'SO'       },
  { key: 'delivery',  label: 'Delivery',     mobileLabel: 'Delivery' },
  { key: 'invoices',  label: 'Invoices',     mobileLabel: 'Invoices' },
  { key: 'customers', label: 'Customers',    mobileLabel: 'Customers'},
]

const STATUS_VARIANT = {
  draft: 'default', confirmed: 'warning', partial: 'warning', delivered: 'success', cancelled: 'danger',
}

function ComingSoonTab() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4 pb-20">
      <div className="w-16 h-16 rounded-2xl bg-zinc-100 flex items-center justify-center">
        <Construction size={28} className="text-zinc-400" />
      </div>
      <div className="text-center">
        <p className="text-base font-semibold text-zinc-900">Coming Soon</p>
        <p className="text-sm text-zinc-400 mt-1">This module is under construction</p>
      </div>
    </div>
  )
}

/* ─── Customers Tab ───────────────────────────────────────────────────────── */
const CUSTOMER_COLS = [
  { key: 'name',          label: 'Customer',       filterable: true },
  { key: 'contactPerson', label: 'Contact Person', filterable: true, noDropdown: true },
  { key: 'phone',         label: 'Phone',          filterable: true, noDropdown: true },
  { key: 'email',         label: 'Email',          filterable: true, noDropdown: true },
  { key: 'gstin',         label: 'GSTIN',          filterable: true, noDropdown: true },
  { key: 'action',        label: 'action' },
]

function CustomersTab({ mobileFiltersOpen, onAdd }) {
  const { data: customers = [], isLoading } = useCustomers()
  const createCustomer = useCreateCustomer()
  const updateCustomer = useUpdateCustomer()
  const deleteCustomer = useDeleteCustomer()

  const [sheetOpen, setSheetOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [filters, setFilters] = useState({ name: '', contactPerson: '', phone: '', email: '', gstin: '' })

  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  const openCreate = () => { setEditing(null); reset({}); setSheetOpen(true) }
  const openEdit   = (c) => { setEditing(c); reset(c); setSheetOpen(true) }
  const close      = () => { setSheetOpen(false); setEditing(null); reset({}) }

  onAdd.current = openCreate

  const setFilter = (key, val) => setFilters((f) => ({ ...f, [key]: val }))

  const filtered = customers.filter((c) =>
    (c.name || '').toLowerCase().includes(filters.name.toLowerCase()) &&
    (c.contactPerson || '').toLowerCase().includes(filters.contactPerson.toLowerCase()) &&
    (c.phone || '').includes(filters.phone) &&
    (c.email || '').toLowerCase().includes(filters.email.toLowerCase()) &&
    (c.gstin || '').toLowerCase().includes(filters.gstin.toLowerCase())
  )

  const onSubmit = async (data) => {
    if (editing) await updateCustomer.mutateAsync({ id: editing._id, data })
    else await createCustomer.mutateAsync(data)
    close()
  }

  const onDelete = async (id) => {
    if (confirm('Delete this customer?')) await deleteCustomer.mutateAsync(id)
  }

  if (isLoading) return <div className="flex-1 flex items-center justify-center"><span className="h-6 w-6 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {customers.length === 0 ? (
        <EmptyState icon={Users} title="No customers yet" description="Add customers to use in sales orders"
          action={<Button size="sm" onClick={openCreate}><Plus size={16} /> Add Customer</Button>} />
      ) : (
        <>
          <DataTableMobileFilters columns={CUSTOMER_COLS} filters={filters} onFilterChange={setFilter} open={mobileFiltersOpen} />

          {/* Mobile cards */}
          <div className="flex flex-col gap-2 md:hidden">
            {filtered.map((c) => (
              <div key={c._id} className="bg-white rounded-2xl border border-zinc-200 p-4 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-zinc-900 truncate">{c.name}</p>
                  {c.contactPerson && <p className="text-sm text-zinc-500 truncate">{c.contactPerson}</p>}
                  <div className="flex flex-wrap gap-x-3 mt-1">
                    {c.phone && <span className="text-xs text-zinc-400">{c.phone}</span>}
                    {c.email && <span className="text-xs text-zinc-400">{c.email}</span>}
                    {c.gstin && <span className="text-xs text-zinc-400">GST: {c.gstin}</span>}
                  </div>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => openEdit(c)} className="p-2 rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 transition-colors"><Pencil size={15} /></button>
                  <button onClick={() => onDelete(c._id)} className="p-2 rounded-lg hover:bg-red-50 text-zinc-400 hover:text-red-500 transition-colors"><Trash2 size={15} /></button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop DataTable */}
          <DataTable
            columns={CUSTOMER_COLS}
            data={filtered}
            filters={filters}
            onFilterChange={setFilter}
            emptyMessage="No customers match the filter"
            renderRow={(c) => (
              <tr key={c._id} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50 transition-colors">
                <td className="px-4 py-3 border-r border-zinc-100 text-sm font-medium text-zinc-900">{c.name}</td>
                <td className="px-4 py-3 border-r border-zinc-100 text-sm text-zinc-600">{c.contactPerson || '—'}</td>
                <td className="px-4 py-3 border-r border-zinc-100 text-sm text-zinc-600">{c.phone || '—'}</td>
                <td className="px-4 py-3 border-r border-zinc-100 text-sm text-zinc-600">{c.email || '—'}</td>
                <td className="px-4 py-3 border-r border-zinc-100 text-sm text-zinc-600">{c.gstin || '—'}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5 whitespace-nowrap">
                    <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 active:bg-zinc-100" title="Edit"><Pencil size={14} /></button>
                    <button onClick={() => onDelete(c._id)} className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 active:bg-zinc-100" title="Delete"><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            )}
          />
        </>
      )}

      {/* Form Sheet — always mounted */}
      <BottomSheet
        open={sheetOpen} onClose={close}
        title={editing ? 'Edit Customer' : 'Add Customer'}
        footer={
          <Button fullWidth loading={createCustomer.isPending || updateCustomer.isPending} onClick={handleSubmit(onSubmit)}>
            {editing ? 'Save Changes' : 'Add Customer'}
          </Button>
        }
      >
        <div className="space-y-3">
          <Input label="Customer Name *" {...register('name', { required: 'Required' })} error={errors.name?.message} placeholder="e.g. Raj Enterprises" />
          <Input label="Contact Person" {...register('contactPerson')} placeholder="e.g. Raj Kumar" />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Phone" {...register('phone')} placeholder="+91 98765 43210" />
            <Input label="Email" type="email" {...register('email')} placeholder="customer@email.com" />
          </div>
          <Input label="GSTIN" {...register('gstin')} placeholder="22AAAAA0000A1Z5" />
          <Input label="Address" {...register('address')} placeholder="Street, City, State" />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700">Notes</label>
            <textarea {...register('notes')} rows={3} placeholder="Any additional notes..."
              className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 resize-none" />
          </div>
        </div>
      </BottomSheet>
    </div>
  )
}

/* ─── Sales Orders Tab ────────────────────────────────────────────────────── */
const SO_COLS = [
  { key: 'soNumber',  label: 'SO #',     filterable: true, noDropdown: true, width: 'w-28' },
  { key: 'customer',  label: 'Customer', filterable: true },
  { key: 'status',    label: 'Status',   filterable: true },
  { key: 'items',     label: 'Items',    width: 'w-16' },
  { key: 'total',     label: 'Total',    width: 'w-32' },
  { key: 'action',    label: 'action' },
]

function SalesOrdersTab({ mobileFiltersOpen, onAdd }) {
  const { data: orders = [], isLoading } = useSalesOrders()
  const { data: customers = [] } = useCustomers()
  const { data: products = [] } = useProducts()
  const createSO = useCreateSalesOrder()
  const updateSO = useUpdateSalesOrder()
  const deleteSO = useDeleteSalesOrder()
  const sym = useCurrencySymbol()

  const [sheetOpen, setSheetOpen] = useState(false)
  const [statusSheet, setStatusSheet] = useState(null)
  const [expanded, setExpanded] = useState({})
  const [filters, setFilters] = useState({ soNumber: '', customer: '', status: '' })
  const [dropSel, setDropSel] = useState({})
  const toggleExpand = (id) => setExpanded((e) => ({ ...e, [id]: !e[id] }))

  const { register, handleSubmit, reset, watch, control, setValue, formState: { errors } } = useForm({
    defaultValues: { customer: '', items: [{ product: '', description: '', qty: 1, unitPrice: 0, taxRate: 0 }], deliveryDate: '', notes: '' }
  })
  const { fields, append, remove } = useFieldArray({ control, name: 'items' })
  const watchItems = watch('items')
  const calcAmount = (idx) => (parseFloat(watchItems?.[idx]?.qty) || 0) * (parseFloat(watchItems?.[idx]?.unitPrice) || 0)

  const handleProductSelect = (idx, productId) => {
    const p = products.find((p) => p._id === productId)
    setValue(`items.${idx}.product`, productId)
    if (p) {
      setValue(`items.${idx}.description`, p.name)
      setValue(`items.${idx}.unitPrice`, p.price ?? 0)
    }
  }

  const openCreate = () => {
    reset({ customer: '', items: [{ product: '', description: '', qty: 1, unitPrice: 0, taxRate: 0 }], deliveryDate: '', notes: '' })
    setSheetOpen(true)
  }
  onAdd.current = openCreate

  const setFilter = (key, val) => setFilters((f) => ({ ...f, [key]: val }))
  const setDrop   = (key, vals) => setDropSel((p) => ({ ...p, [key]: vals }))
  const getDrop   = (key) => dropSel[key] || []
  const inDrop    = (key, val) => getDrop(key).length === 0 || getDrop(key).includes(val)

  const dropOpts = {
    status:   [...new Set(orders.map((o) => o.status).filter(Boolean))],
    customer: [...new Set(orders.map((o) => o.customer?.name).filter(Boolean))],
  }

  const filtered = orders.filter((o) => {
    const customerName = o.customer?.name || ''
    return (
      (o.soNumber || '').toLowerCase().includes(filters.soNumber.toLowerCase()) &&
      customerName.toLowerCase().includes(filters.customer.toLowerCase()) && inDrop('customer', customerName) &&
      (o.status || '').includes(filters.status) && inDrop('status', o.status)
    )
  })

  const onSubmit = async (data) => {
    const items = data.items.map((it, i) => {
      const { product, ...rest } = it
      return { ...(product ? { product } : {}), ...rest, qty: parseFloat(it.qty), unitPrice: parseFloat(it.unitPrice), taxRate: parseFloat(it.taxRate) || 0, amount: calcAmount(i) }
    })
    await createSO.mutateAsync({ ...data, items })
    setSheetOpen(false)
  }

  const onDelete = async (id) => { if (confirm('Delete this sales order?')) await deleteSO.mutateAsync(id) }
  const onStatusChange = async (s) => { await updateSO.mutateAsync({ id: statusSheet._id, data: { status: s } }); setStatusSheet(null) }

  if (isLoading) return <div className="flex-1 flex items-center justify-center"><span className="h-6 w-6 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {orders.length === 0 ? (
        <EmptyState icon={TrendingUp} title="No sales orders" description="Create your first sales order"
          action={<Button size="sm" onClick={openCreate}><Plus size={16} /> Create SO</Button>} />
      ) : (
        <>
          <DataTableMobileFilters columns={SO_COLS} filters={filters} onFilterChange={setFilter} dropOpts={dropOpts} dropSel={dropSel} onDropChange={setDrop} open={mobileFiltersOpen} />

          {/* Mobile cards */}
          <div className="flex flex-col gap-2 md:hidden">
            {filtered.map((o) => (
              <div key={o._id} className="bg-white rounded-2xl border border-zinc-200 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-sm font-semibold text-zinc-900">{o.soNumber}</span>
                      <Badge variant={STATUS_VARIANT[o.status] || 'default'}>{o.status}</Badge>
                    </div>
                    <p className="text-sm text-zinc-600 mt-0.5">{o.customer?.name || '—'}</p>
                    {o.deliveryDate && <p className="text-xs text-zinc-400 mt-0.5">Delivery: {new Date(o.deliveryDate).toLocaleDateString()}</p>}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <span className="text-sm font-semibold text-zinc-900">{sym}{(o.grandTotal || 0).toFixed(2)}</span>
                    <button onClick={() => setStatusSheet(o)} className="p-2 rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 transition-colors" title="Update status"><RefreshCw size={14} /></button>
                    <button onClick={() => onDelete(o._id)} className="p-2 rounded-lg hover:bg-red-50 text-zinc-400 hover:text-red-500 transition-colors"><Trash2 size={15} /></button>
                  </div>
                </div>
                {o.items?.length > 0 && (
                  <div className="mt-3 border-t border-zinc-100 pt-3 space-y-1">
                    {o.items.map((it, i) => (
                      <div key={i} className="flex justify-between text-xs text-zinc-500">
                        <span className="truncate max-w-[60%]">{it.description || it.product?.name || 'Item'} × {it.qty}</span>
                        <span>{sym}{(it.amount || 0).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Desktop DataTable */}
          <DataTable
            columns={SO_COLS}
            data={filtered}
            filters={filters}
            onFilterChange={setFilter}
            dropOpts={dropOpts}
            dropSel={dropSel}
            onDropChange={setDrop}
            emptyMessage="No sales orders match the filter"
            leadingCol={true}
            renderRow={(o) => (
              <React.Fragment key={o._id}>
                <tr className="border-b border-zinc-100 hover:bg-zinc-50 transition-colors cursor-pointer" onClick={() => toggleExpand(o._id)}>
                  <td className="px-3 py-3 border-r border-zinc-100 text-zinc-400">
                    <ChevronDown size={14} className={`transition-transform ${expanded[o._id] ? '' : '-rotate-90'}`} />
                  </td>
                  <td className="px-4 py-3 border-r border-zinc-100 font-mono text-sm font-semibold text-zinc-900">{o.soNumber}</td>
                  <td className="px-4 py-3 border-r border-zinc-100 text-sm text-zinc-700">{o.customer?.name || '—'}</td>
                  <td className="px-4 py-3 border-r border-zinc-100">
                    <Badge variant={STATUS_VARIANT[o.status] || 'default'}>{o.status}</Badge>
                  </td>
                  <td className="px-4 py-3 border-r border-zinc-100 text-sm text-zinc-500 text-center">{o.items?.length || 0}</td>
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
                    <td /><td colSpan={6} className="px-4 py-3">
                      <table className="w-full text-xs border-collapse rounded-xl overflow-hidden border border-zinc-200">
                        <thead>
                          <tr className="border-b border-zinc-200">
                            {['Product / Description', 'Qty', 'Unit Price', 'Tax %', 'Amount', 'Unit'].map((h, i, arr) => (
                              <th key={h} className={`px-3 py-2 text-left text-xs font-semibold text-zinc-500 ${i < arr.length - 1 ? 'border-r border-zinc-200' : ''}`}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {(o.items || []).map((item, idx, arr) => (
                            <tr key={idx} className={idx < arr.length - 1 ? 'border-b border-zinc-100' : ''}>
                              <td className="px-3 py-2 border-r border-zinc-100 font-medium text-zinc-800">{item.product?.name || item.description || '—'}</td>
                              <td className="px-3 py-2 border-r border-zinc-100 text-zinc-600">{item.qty ?? '—'}</td>
                              <td className="px-3 py-2 border-r border-zinc-100 text-zinc-600">{sym}{(item.unitPrice ?? 0).toFixed(2)}</td>
                              <td className="px-3 py-2 border-r border-zinc-100 text-zinc-600">{item.taxRate ?? 0}%</td>
                              <td className="px-3 py-2 border-r border-zinc-100 text-zinc-600">{sym}{(item.amount ?? 0).toFixed(2)}</td>
                              <td className="px-3 py-2 text-zinc-600">{item.unit || '—'}</td>
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
        </>
      )}

      {/* Create SO Sheet — always mounted */}
      <BottomSheet
        open={sheetOpen} onClose={() => setSheetOpen(false)}
        title="Create Sales Order"
        footer={<Button fullWidth loading={createSO.isPending} onClick={handleSubmit(onSubmit)}>Create SO</Button>}
      >
        <div className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700">Customer *</label>
            <select {...register('customer', { required: 'Customer is required' })}
              className="h-11 w-full rounded-xl border border-zinc-300 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900">
              <option value="">Select customer...</option>
              {customers.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
            {errors.customer && <p className="text-xs text-red-500">{errors.customer.message}</p>}
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-zinc-700">Items</label>
              <button type="button" onClick={() => append({ product: '', description: '', qty: 1, unitPrice: 0, taxRate: 0 })}
                className="text-xs font-medium text-zinc-600 flex items-center gap-1 hover:text-zinc-900">
                <Plus size={13} /> Add Item
              </button>
            </div>
            <div className="space-y-3">
              {fields.map((field, idx) => (
                <div key={field.id} className="border border-zinc-200 rounded-xl p-3 space-y-2 relative overflow-visible">
                  {fields.length > 1 && (
                    <button type="button" onClick={() => remove(idx)} className="absolute top-2 right-2 p-1 text-zinc-400 hover:text-red-500"><Minus size={14} /></button>
                  )}
                  {/* Product picker */}
                  <ProductPicker
                    products={products}
                    value={watchItems?.[idx]?.product || ''}
                    onChange={(id) => handleProductSelect(idx, id)}
                    sym={sym}
                  />
                  <Input label="Description" {...register(`items.${idx}.description`)} placeholder="Item description" />
                  <div className="grid grid-cols-3 gap-2">
                    <Input label="Qty" type="number" min="0" step="0.01" {...register(`items.${idx}.qty`)} />
                    <Input label="Unit Price" type="number" min="0" step="0.01" {...register(`items.${idx}.unitPrice`)} />
                    <Input label="Tax %" type="number" min="0" step="0.1" {...register(`items.${idx}.taxRate`)} />
                  </div>
                  <p className="text-xs text-zinc-500 text-right">Amount: <span className="font-semibold text-zinc-900">{sym}{calcAmount(idx).toFixed(2)}</span></p>
                </div>
              ))}
            </div>
          </div>

          <Input label="Delivery Date" type="date" {...register('deliveryDate')} />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700">Notes</label>
            <textarea {...register('notes')} rows={2} placeholder="Optional notes..."
              className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 resize-none" />
          </div>
        </div>
      </BottomSheet>

      {/* Status Sheet — always mounted */}
      <BottomSheet open={!!statusSheet} onClose={() => setStatusSheet(null)} title="Update Status">
        <div className="grid grid-cols-2 gap-2 pb-2">
          {['draft', 'confirmed', 'partial', 'delivered', 'cancelled'].map((s) => (
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

/* ─── Delivery Tab ────────────────────────────────────────────────────────── */
const DEL_STATUS_VARIANT = { complete: 'success', partial: 'warning' }

const DEL_COLS = [
  { key: 'deliveryNumber', label: 'DEL #',    filterable: true, noDropdown: true, width: 'w-28' },
  { key: 'so',             label: 'SO #',     filterable: true, noDropdown: true },
  { key: 'customer',       label: 'Customer', filterable: true },
  { key: 'status',         label: 'Status',   filterable: true },
  { key: 'items',          label: 'Items',    width: 'w-16' },
  { key: 'date',           label: 'Date',     width: 'w-28' },
  { key: 'action',         label: 'action' },
]

function DeliveryTab({ mobileFiltersOpen, onAdd }) {
  const { data: deliveries = [], isLoading } = useDeliveries()
  const { data: salesOrders = [] } = useSalesOrders()
  const createDelivery = useCreateDelivery()
  const deleteDelivery = useDeleteDelivery()
  const sym = useCurrencySymbol()

  const [sheetOpen, setSheetOpen] = useState(false)
  const [selectedSO, setSelectedSO] = useState('')
  const [delItems, setDelItems] = useState([])
  const [deliveredDate, setDeliveredDate] = useState('')
  const [notes, setNotes] = useState('')
  const [formError, setFormError] = useState('')
  const [filters, setFilters] = useState({ deliveryNumber: '', so: '', customer: '', status: '' })
  const [dropSel, setDropSel] = useState({})

  const handleSOChange = (soId) => {
    setSelectedSO(soId)
    const so = salesOrders.find((s) => s._id === soId)
    if (so?.items) {
      setDelItems(so.items.map((it) => ({
        product: it.product?._id || it.product || '',
        description: it.description || it.product?.name || '',
        qtyOrdered: it.qty || 0,
        qtyDelivered: it.qty || 0,
        unit: it.unit || it.product?.unit || '',
        unitPrice: it.unitPrice || 0,
      })))
    } else {
      setDelItems([])
    }
  }

  const openCreate = () => {
    setSelectedSO('')
    setDelItems([])
    setDeliveredDate(new Date().toISOString().slice(0, 10))
    setNotes('')
    setFormError('')
    setSheetOpen(true)
  }
  onAdd.current = openCreate

  const handleSubmit = async () => {
    if (!selectedSO) return setFormError('Please select a sales order')
    if (delItems.length === 0) return setFormError('No items to deliver')
    setFormError('')
    try {
      await createDelivery.mutateAsync({
        salesOrder: selectedSO,
        items: delItems,
        deliveredDate,
        notes,
      })
      setSheetOpen(false)
    } catch (e) {
      setFormError(e?.response?.data?.error || e?.response?.data?.message || 'Failed to create delivery')
    }
  }

  const setFilter = (key, val) => setFilters((f) => ({ ...f, [key]: val }))
  const setDrop   = (key, vals) => setDropSel((p) => ({ ...p, [key]: vals }))
  const getDrop   = (key) => dropSel[key] || []
  const inDrop    = (key, val) => getDrop(key).length === 0 || getDrop(key).includes(val)

  const dropOpts = {
    status:   [...new Set(deliveries.map((d) => d.status).filter(Boolean))],
    customer: [...new Set(deliveries.map((d) => d.salesOrder?.customer?.name).filter(Boolean))],
  }

  const filtered = deliveries.filter((d) => {
    const soNum = d.salesOrder?.soNumber || ''
    const customerName = d.salesOrder?.customer?.name || ''
    return (
      (d.deliveryNumber || '').toLowerCase().includes(filters.deliveryNumber.toLowerCase()) &&
      soNum.toLowerCase().includes(filters.so.toLowerCase()) &&
      customerName.toLowerCase().includes(filters.customer.toLowerCase()) && inDrop('customer', customerName) &&
      (d.status || '').includes(filters.status) && inDrop('status', d.status)
    )
  })

  const onDelete = async (id) => { if (confirm('Delete this delivery? Note: stock will not be reversed automatically.')) await deleteDelivery.mutateAsync(id) }

  // Eligible SOs: not yet fully delivered
  const eligibleSOs = salesOrders.filter((s) => ['draft', 'confirmed', 'partial'].includes(s.status))

  if (isLoading) return <div className="flex-1 flex items-center justify-center"><span className="h-6 w-6 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {deliveries.length === 0 ? (
        <EmptyState icon={Truck} title="No deliveries yet" description="Record stock delivered against a sales order"
          action={<Button size="sm" onClick={openCreate}><Plus size={16} /> Create Delivery</Button>} />
      ) : (
        <>
          <DataTableMobileFilters columns={DEL_COLS} filters={filters} onFilterChange={setFilter} dropOpts={dropOpts} dropSel={dropSel} onDropChange={setDrop} open={mobileFiltersOpen} />

          {/* Mobile cards */}
          <div className="flex flex-col gap-2 md:hidden">
            {filtered.map((d) => (
              <div key={d._id} className="bg-white rounded-2xl border border-zinc-200 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-sm font-semibold text-zinc-900">{d.deliveryNumber}</span>
                      <Badge variant={DEL_STATUS_VARIANT[d.status] || 'default'}>{d.status}</Badge>
                    </div>
                    <p className="text-sm text-zinc-600 mt-0.5">SO: {d.salesOrder?.soNumber || '—'} · {d.salesOrder?.customer?.name || '—'}</p>
                    {d.deliveredDate && <p className="text-xs text-zinc-400 mt-0.5">{new Date(d.deliveredDate).toLocaleDateString()}</p>}
                  </div>
                  <button onClick={() => onDelete(d._id)} className="p-2 rounded-lg hover:bg-red-50 text-zinc-400 hover:text-red-500 transition-colors flex-shrink-0"><Trash2 size={15} /></button>
                </div>
                {d.items?.length > 0 && (
                  <div className="mt-3 border-t border-zinc-100 pt-3 space-y-1">
                    {d.items.map((it, i) => (
                      <div key={i} className="flex justify-between text-xs text-zinc-500">
                        <span className="truncate max-w-[60%]">{it.description || it.product?.name || 'Item'}</span>
                        <span>{it.qtyDelivered} / {it.qtyOrdered} {it.unit}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Desktop DataTable */}
          <DataTable
            columns={DEL_COLS}
            data={filtered}
            filters={filters}
            onFilterChange={setFilter}
            dropOpts={dropOpts}
            dropSel={dropSel}
            onDropChange={setDrop}
            emptyMessage="No deliveries match the filter"
            renderRow={(d) => (
              <tr key={d._id} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50 transition-colors">
                <td className="px-4 py-3 border-r border-zinc-100 font-mono text-sm font-semibold text-zinc-900">{d.deliveryNumber}</td>
                <td className="px-4 py-3 border-r border-zinc-100 text-sm text-zinc-700">{d.salesOrder?.soNumber || '—'}</td>
                <td className="px-4 py-3 border-r border-zinc-100 text-sm text-zinc-700">{d.salesOrder?.customer?.name || '—'}</td>
                <td className="px-4 py-3 border-r border-zinc-100"><Badge variant={DEL_STATUS_VARIANT[d.status] || 'default'}>{d.status}</Badge></td>
                <td className="px-4 py-3 border-r border-zinc-100 text-sm text-zinc-500 text-center">{d.items?.length || 0}</td>
                <td className="px-4 py-3 border-r border-zinc-100 text-sm text-zinc-500">{d.deliveredDate ? new Date(d.deliveredDate).toLocaleDateString() : '—'}</td>
                <td className="px-4 py-3">
                  <button onClick={() => onDelete(d._id)} className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 active:bg-zinc-100" title="Delete"><Trash2 size={14} /></button>
                </td>
              </tr>
            )}
          />
        </>
      )}

      {/* Create Delivery Sheet */}
      <BottomSheet
        open={sheetOpen} onClose={() => setSheetOpen(false)}
        title="Create Delivery"
        footer={<Button fullWidth loading={createDelivery.isPending} onClick={handleSubmit}>Record Delivery</Button>}
      >
        <div className="space-y-4">
          {/* SO selector */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700">Sales Order *</label>
            <select value={selectedSO} onChange={(e) => handleSOChange(e.target.value)}
              className="h-11 w-full rounded-xl border border-zinc-300 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900">
              <option value="">Select SO...</option>
              {eligibleSOs.map((s) => (
                <option key={s._id} value={s._id}>{s.soNumber} — {s.customer?.name || 'Unknown customer'}</option>
              ))}
            </select>
          </div>

          {/* Items */}
          {delItems.length > 0 && (
            <div>
              <label className="text-sm font-medium text-zinc-700 mb-2 block">Items to Deliver</label>
              <div className="space-y-2">
                {delItems.map((item, idx) => (
                  <div key={idx} className="border border-zinc-200 rounded-xl p-3 space-y-2">
                    <p className="text-sm font-medium text-zinc-800 truncate">{item.description || 'Item'}</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex flex-col gap-1">
                        <label className="text-xs text-zinc-500">Ordered</label>
                        <input readOnly value={item.qtyOrdered}
                          className="h-9 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-500 outline-none" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs text-zinc-500">Delivering *</label>
                        <input
                          type="number" min="0" max={item.qtyOrdered} step="0.01"
                          value={item.qtyDelivered}
                          onChange={(e) => {
                            const updated = [...delItems]
                            updated[idx] = { ...updated[idx], qtyDelivered: parseFloat(e.target.value) || 0 }
                            setDelItems(updated)
                          }}
                          className="h-9 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
                        />
                      </div>
                    </div>
                    {item.unit && <p className="text-xs text-zinc-400">Unit: {item.unit}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          <Input label="Delivered Date" type="date" value={deliveredDate} onChange={(e) => setDeliveredDate(e.target.value)} />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700">Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Optional notes..."
              className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 resize-none" />
          </div>

          {formError && <p className="text-sm text-red-500">{formError}</p>}
        </div>
      </BottomSheet>
    </div>
  )
}

/* ─── Sales Invoices Tab ──────────────────────────────────────────────────── */
const SINV_STATUS_VARIANT = { draft: 'default', sent: 'warning', paid: 'success', overdue: 'danger', cancelled: 'danger' }

const SINV_COLS = [
  { key: 'invoiceNumber', label: 'Invoice #',   filterable: true, noDropdown: true, width: 'w-32' },
  { key: 'customer',      label: 'Customer',    filterable: true },
  { key: 'ref',           label: 'SO / DEL',    filterable: true, noDropdown: true },
  { key: 'status',        label: 'Status',      filterable: true },
  { key: 'total',         label: 'Total',       width: 'w-32' },
  { key: 'due',           label: 'Due Date',    width: 'w-28' },
  { key: 'action',        label: 'action' },
]

function SalesInvoicesTab({ mobileFiltersOpen, onAdd }) {
  const { data: invoices = [], isLoading } = useSalesInvoices()
  const { data: salesOrders = [] } = useSalesOrders()
  const { data: deliveries = [] } = useDeliveries()
  const { data: customers = [] } = useCustomers()
  const createInvoice = useCreateSalesInvoice()
  const updateInvoice = useUpdateSalesInvoice()
  const deleteInvoice = useDeleteSalesInvoice()
  const sym = useCurrencySymbol()

  const [sheetOpen, setSheetOpen] = useState(false)
  const [statusSheet, setStatusSheet] = useState(null)
  const [expanded, setExpanded] = useState({})
  const [sourceType, setSourceType] = useState('delivery')
  const [selectedSource, setSelectedSource] = useState('')
  const [customerId, setCustomerId] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [notes, setNotes] = useState('')
  const [formError, setFormError] = useState('')
  const [manualItems, setManualItems] = useState([{ description: '', qty: 1, unitPrice: 0, taxRate: 0 }])
  const addManualItem = () => setManualItems((p) => [...p, { description: '', qty: 1, unit: '', unitPrice: 0, taxRate: 0 }])
  const removeManualItem = (i) => setManualItems((p) => p.filter((_, idx) => idx !== i))
  const updateManualItem = (i, field, val) => setManualItems((p) => p.map((it, idx) => idx === i ? { ...it, [field]: val } : it))
  const [filters, setFilters] = useState({ invoiceNumber: '', customer: '', ref: '', status: '' })
  const [dropSel, setDropSel] = useState({})

  const toggleExpand = (id) => setExpanded((e) => ({ ...e, [id]: !e[id] }))
  const setFilter = (key, val) => setFilters((f) => ({ ...f, [key]: val }))
  const setDrop   = (key, vals) => setDropSel((p) => ({ ...p, [key]: vals }))
  const getDrop   = (key) => dropSel[key] || []
  const inDrop    = (key, val) => getDrop(key).length === 0 || getDrop(key).includes(val)

  const dropOpts = {
    customer: [...new Set(invoices.map((i) => i.customer?.name).filter(Boolean))],
    status:   ['draft', 'sent', 'paid', 'overdue', 'cancelled'],
  }

  const filtered = invoices.filter((inv) => {
    const customerName = inv.customer?.name || ''
    const ref = [inv.salesOrder?.soNumber, inv.delivery?.deliveryNumber].filter(Boolean).join(' / ')
    return (
      (inv.invoiceNumber || '').toLowerCase().includes(filters.invoiceNumber.toLowerCase()) &&
      customerName.toLowerCase().includes(filters.customer.toLowerCase()) && inDrop('customer', customerName) &&
      ref.toLowerCase().includes(filters.ref.toLowerCase()) &&
      (filters.status === '' || inv.status === filters.status) && inDrop('status', inv.status)
    )
  })

  const openCreate = () => {
    setSourceType('delivery')
    setSelectedSource('')
    setCustomerId('')
    setDueDate('')
    setNotes('')
    setFormError('')
    setManualItems([{ description: '', qty: 1, unitPrice: 0, taxRate: 0 }])
    setSheetOpen(true)
  }
  onAdd.current = openCreate

  const handleSubmit = async () => {
    if (sourceType === 'manual') {
      if (!customerId) return setFormError('Please select a customer')
      if (manualItems.every((it) => !it.description)) return setFormError('Add at least one item')
    } else if (!selectedSource) {
      return setFormError(`Please select a ${sourceType === 'delivery' ? 'Delivery' : 'Sales Order'}`)
    }
    setFormError('')
    const items = sourceType === 'manual'
      ? manualItems.filter((it) => it.description).map((it) => ({
          description: it.description,
          qty: parseFloat(it.qty) || 0,
          unitPrice: parseFloat(it.unitPrice) || 0,
          taxRate: parseFloat(it.taxRate) || 0,
          amount: (parseFloat(it.qty) || 0) * (parseFloat(it.unitPrice) || 0),
        }))
      : []
    try {
      await createInvoice.mutateAsync({
        customer:   customerId || undefined,
        delivery:   sourceType === 'delivery' ? selectedSource : undefined,
        salesOrder: sourceType === 'so'       ? selectedSource : undefined,
        items,
        dueDate,
        notes,
      })
      setSheetOpen(false)
    } catch (e) {
      setFormError(e?.response?.data?.error || e?.response?.data?.message || 'Failed to create invoice')
    }
  }

  const onStatusChange = async (s) => {
    await updateInvoice.mutateAsync({ id: statusSheet._id, data: { status: s } })
    setStatusSheet(null)
  }
  const onDelete = async (id) => { if (confirm('Delete this invoice?')) await deleteInvoice.mutateAsync(id) }

  if (isLoading) return <div className="flex-1 flex items-center justify-center"><span className="h-6 w-6 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {invoices.length === 0 ? (
        <EmptyState icon={FileText} title="No sales invoices" description="Create invoices from a delivery or sales order"
          action={<Button size="sm" onClick={openCreate}><Plus size={16} /> Create Invoice</Button>} />
      ) : (
        <>
          <DataTableMobileFilters columns={SINV_COLS} filters={filters} onFilterChange={setFilter} dropOpts={dropOpts} dropSel={dropSel} onDropChange={setDrop} open={mobileFiltersOpen} />

          {/* Mobile cards */}
          <div className="flex flex-col gap-2 md:hidden">
            {filtered.map((inv) => (
              <div key={inv._id} className="bg-white rounded-2xl border border-zinc-200 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-sm font-semibold text-zinc-900">{inv.invoiceNumber}</span>
                      <Badge variant={SINV_STATUS_VARIANT[inv.status] || 'default'}>{inv.status}</Badge>
                    </div>
                    <p className="text-sm text-zinc-600 mt-0.5">{inv.customer?.name || '—'}</p>
                    {(inv.salesOrder || inv.delivery) && (
                      <p className="text-xs text-zinc-400 mt-0.5">
                        {[inv.salesOrder?.soNumber, inv.delivery?.deliveryNumber].filter(Boolean).join(' · ')}
                      </p>
                    )}
                    {inv.dueDate && <p className="text-xs text-zinc-400">Due: {new Date(inv.dueDate).toLocaleDateString()}</p>}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <span className="text-sm font-semibold text-zinc-900">{sym}{(inv.grandTotal || 0).toFixed(2)}</span>
                    <button onClick={() => setStatusSheet(inv)} className="p-2 rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 transition-colors"><RefreshCw size={14} /></button>
                    <button onClick={() => onDelete(inv._id)} className="p-2 rounded-lg hover:bg-red-50 text-zinc-400 hover:text-red-500 transition-colors"><Trash2 size={15} /></button>
                  </div>
                </div>
                {inv.items?.length > 0 && (
                  <div className="mt-3 border-t border-zinc-100 pt-3 space-y-1">
                    {inv.items.map((it, i) => (
                      <div key={i} className="flex justify-between text-xs text-zinc-500">
                        <span className="truncate max-w-[60%]">{it.description || it.product?.name || 'Item'} × {it.qty}</span>
                        <span>{sym}{(it.amount || 0).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Desktop DataTable */}
          <DataTable
            columns={SINV_COLS}
            data={filtered}
            filters={filters}
            onFilterChange={setFilter}
            dropOpts={dropOpts}
            dropSel={dropSel}
            onDropChange={setDrop}
            emptyMessage="No invoices match the filter"
            leadingCol={true}
            renderRow={(inv) => (
              <React.Fragment key={inv._id}>
                <tr className="border-b border-zinc-100 hover:bg-zinc-50 transition-colors cursor-pointer" onClick={() => toggleExpand(inv._id)}>
                  <td className="px-3 py-3 border-r border-zinc-100 text-zinc-400">
                    <ChevronDown size={14} className={`transition-transform ${expanded[inv._id] ? '' : '-rotate-90'}`} />
                  </td>
                  <td className="px-4 py-3 border-r border-zinc-100 font-mono text-sm font-semibold text-zinc-900">{inv.invoiceNumber}</td>
                  <td className="px-4 py-3 border-r border-zinc-100 text-sm text-zinc-700">{inv.customer?.name || '—'}</td>
                  <td className="px-4 py-3 border-r border-zinc-100 text-xs text-zinc-500">
                    {[inv.salesOrder?.soNumber, inv.delivery?.deliveryNumber].filter(Boolean).join(' / ') || '—'}
                  </td>
                  <td className="px-4 py-3 border-r border-zinc-100">
                    <Badge variant={SINV_STATUS_VARIANT[inv.status] || 'default'}>{inv.status}</Badge>
                  </td>
                  <td className="px-4 py-3 border-r border-zinc-100 text-sm font-semibold text-zinc-900">{sym}{(inv.grandTotal || 0).toFixed(2)}</td>
                  <td className="px-4 py-3 border-r border-zinc-100 text-sm text-zinc-500">{inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 whitespace-nowrap">
                      <button onClick={(e) => { e.stopPropagation(); setStatusSheet(inv) }} className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 active:bg-zinc-100" title="Update status"><RefreshCw size={14} /></button>
                      <button onClick={(e) => { e.stopPropagation(); onDelete(inv._id) }} className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 active:bg-zinc-100" title="Delete"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
                {expanded[inv._id] && (
                  <tr className="border-b border-zinc-100 bg-zinc-50">
                    <td /><td colSpan={7} className="px-4 py-3">
                      <div className="flex gap-6 text-xs text-zinc-500 mb-2">
                        <span>Subtotal: <strong className="text-zinc-800">{sym}{(inv.subtotal || 0).toFixed(2)}</strong></span>
                        <span>Tax: <strong className="text-zinc-800">{sym}{(inv.taxAmount || 0).toFixed(2)}</strong></span>
                        <span>Total: <strong className="text-zinc-900">{sym}{(inv.grandTotal || 0).toFixed(2)}</strong></span>
                        {inv.invoiceDate && <span>Issued: <strong className="text-zinc-800">{new Date(inv.invoiceDate).toLocaleDateString()}</strong></span>}
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
                          {(inv.items || []).map((item, idx, arr) => (
                            <tr key={idx} className={idx < arr.length - 1 ? 'border-b border-zinc-100' : ''}>
                              <td className="px-3 py-2 border-r border-zinc-100 font-medium text-zinc-800">{item.product?.name || item.description || '—'}</td>
                              <td className="px-3 py-2 border-r border-zinc-100 text-zinc-600">{item.qty}</td>
                              <td className="px-3 py-2 border-r border-zinc-100 text-zinc-600">{sym}{(item.unitPrice ?? 0).toFixed(2)}</td>
                              <td className="px-3 py-2 border-r border-zinc-100 text-zinc-600">{item.taxRate ?? 0}%</td>
                              <td className="px-3 py-2 border-r border-zinc-100 text-zinc-600">{sym}{(item.amount ?? 0).toFixed(2)}</td>
                              <td className="px-3 py-2 text-zinc-600">{item.unit || '—'}</td>
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
        </>
      )}

      {/* Create Invoice Sheet */}
      <BottomSheet
        open={sheetOpen} onClose={() => setSheetOpen(false)}
        title="Create Sales Invoice"
        footer={<Button fullWidth loading={createInvoice.isPending} onClick={handleSubmit}>Create Invoice</Button>}
      >
        <div className="space-y-4">
          {/* Source type tabs */}
          <div className="flex gap-1 bg-zinc-100 rounded-xl p-0.5">
            {[['delivery', 'From Delivery'], ['so', 'From SO'], ['manual', 'Manual']].map(([k, label]) => (
              <button key={k} onClick={() => { setSourceType(k); setSelectedSource('') }}
                className={['flex-1 py-1.5 text-xs font-semibold rounded-[10px] transition-all',
                  sourceType === k ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-400'].join(' ')}>
                {label}
              </button>
            ))}
          </div>

          {sourceType === 'delivery' && (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-zinc-700">Delivery *</label>
              <select value={selectedSource} onChange={(e) => {
                setSelectedSource(e.target.value)
                const del = deliveries.find((d) => d._id === e.target.value)
                if (del?.salesOrder?.customer) setCustomerId(del.salesOrder.customer._id || del.salesOrder.customer)
              }}
                className="h-11 w-full rounded-xl border border-zinc-300 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900">
                <option value="">Select Delivery...</option>
                {deliveries.map((d) => <option key={d._id} value={d._id}>{d.deliveryNumber} — {d.salesOrder?.customer?.name || '?'}</option>)}
              </select>
            </div>
          )}

          {sourceType === 'so' && (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-zinc-700">Sales Order *</label>
              <select value={selectedSource} onChange={(e) => {
                setSelectedSource(e.target.value)
                const so = salesOrders.find((s) => s._id === e.target.value)
                if (so?.customer) setCustomerId(so.customer._id || so.customer)
              }}
                className="h-11 w-full rounded-xl border border-zinc-300 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900">
                <option value="">Select SO...</option>
                {salesOrders.map((s) => <option key={s._id} value={s._id}>{s.soNumber} — {s.customer?.name || '?'}</option>)}
              </select>
            </div>
          )}

          {sourceType === 'manual' && (
            <>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-zinc-700">Customer *</label>
                <select value={customerId} onChange={(e) => setCustomerId(e.target.value)}
                  className="h-11 w-full rounded-xl border border-zinc-300 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900">
                  <option value="">Select customer...</option>
                  {customers.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-zinc-700">Items *</label>
                  <button type="button" onClick={addManualItem} className="text-xs font-medium text-zinc-600 flex items-center gap-1 hover:text-zinc-900">
                    <Plus size={13} /> Add Item
                  </button>
                </div>
                <div className="space-y-2">
                  {manualItems.map((item, idx) => (
                    <div key={idx} className="border border-zinc-200 rounded-xl p-3 space-y-2 relative">
                      {manualItems.length > 1 && (
                        <button type="button" onClick={() => removeManualItem(idx)} className="absolute top-2 right-2 p-1 text-zinc-400 hover:text-red-500"><Minus size={14} /></button>
                      )}
                      <input
                        placeholder="Description *"
                        value={item.description}
                        onChange={(e) => updateManualItem(idx, 'description', e.target.value)}
                        className="w-full h-9 rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
                      />
                      <div className="grid grid-cols-4 gap-2">
                        <div className="flex flex-col gap-1">
                          <label className="text-xs text-zinc-500">Qty</label>
                          <input type="number" min="0" step="0.01" value={item.qty} onChange={(e) => updateManualItem(idx, 'qty', e.target.value)}
                            className="h-9 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900" />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-xs text-zinc-500">Unit</label>
                          <input placeholder="pcs" value={item.unit} onChange={(e) => updateManualItem(idx, 'unit', e.target.value)}
                            className="h-9 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900" />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-xs text-zinc-500">Unit Price</label>
                          <input type="number" min="0" step="0.01" value={item.unitPrice} onChange={(e) => updateManualItem(idx, 'unitPrice', e.target.value)}
                            className="h-9 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900" />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-xs text-zinc-500">Tax %</label>
                          <input type="number" min="0" step="0.1" value={item.taxRate} onChange={(e) => updateManualItem(idx, 'taxRate', e.target.value)}
                            className="h-9 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900" />
                        </div>
                      </div>
                      <p className="text-xs text-zinc-400 text-right">
                        Amount: <span className="font-semibold text-zinc-800">{sym}{((parseFloat(item.qty) || 0) * (parseFloat(item.unitPrice) || 0)).toFixed(2)}</span>
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          <Input label="Due Date" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700">Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Optional notes..."
              className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 resize-none" />
          </div>
          {formError && <p className="text-sm text-red-500">{formError}</p>}
        </div>
      </BottomSheet>

      {/* Status Sheet */}
      <BottomSheet open={!!statusSheet} onClose={() => setStatusSheet(null)} title="Update Invoice Status">
        <div className="grid grid-cols-2 gap-2 pb-2">
          {['draft', 'sent', 'paid', 'overdue', 'cancelled'].map((s) => (
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

/* ─── Page ────────────────────────────────────────────────────────────────── */
export default function Sales() {
  const [tab, setTab] = useState('so')
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const onAddRef = useRef(null)

  const hasFilters = ['so', 'delivery', 'invoices', 'customers'].includes(tab)
  const hasAdd     = ['so', 'delivery', 'invoices', 'customers'].includes(tab)

  const addBtn = tab === 'so'
    ? <Button size="sm" onClick={() => onAddRef.current?.()}><Plus size={16} /> Create SO</Button>
    : tab === 'delivery'
    ? <Button size="sm" onClick={() => onAddRef.current?.()}><Plus size={16} /> Create Delivery</Button>
    : tab === 'invoices'
    ? <Button size="sm" onClick={() => onAddRef.current?.()}><Plus size={16} /> Create Invoice</Button>
    : tab === 'customers'
    ? <Button size="sm" onClick={() => onAddRef.current?.()}><Plus size={16} /> Add Customer</Button>
    : null

  const renderTab = () => {
    switch (tab) {
      case 'so':        return <SalesOrdersTab mobileFiltersOpen={mobileFiltersOpen} onAdd={onAddRef} />
      case 'delivery':  return <DeliveryTab mobileFiltersOpen={mobileFiltersOpen} onAdd={onAddRef} />
      case 'invoices':  return <SalesInvoicesTab mobileFiltersOpen={mobileFiltersOpen} onAdd={onAddRef} />
      case 'customers': return <CustomersTab mobileFiltersOpen={mobileFiltersOpen} onAdd={onAddRef} />
      default:          return <ComingSoonTab />
    }
  }

  return (
    <>
      <TopBar
        title="Sales"
        filterIcon={hasFilters && <DataTableFilterIcon open={mobileFiltersOpen} onChange={setMobileFiltersOpen} />}
        right={hasAdd && (
          <button onClick={() => onAddRef.current?.()} className="p-2 rounded-xl active:bg-zinc-100">
            <Plus size={20} />
          </button>
        )}
      />

      <div className="px-4 pt-0 pb-5 md:px-0 md:py-0 md:pb-4 md:flex md:flex-col md:flex-1 md:min-h-0">
        {/* Mobile tab pill */}
        <div className="md:hidden sticky z-30 bg-zinc-50 -mx-4 px-4 py-4 flex-shrink-0" style={{ top: 'calc(3.5rem + env(safe-area-inset-top))' }}>
          <div className="bg-zinc-100 rounded-xl p-0.5 flex">
            {TABS.map((t) => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={['flex-1 py-1.5 text-xs font-semibold rounded-[10px] transition-all duration-200 whitespace-nowrap',
                  tab === t.key ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-400 active:bg-zinc-200',
                ].join(' ')}>
                {t.mobileLabel}
              </button>
            ))}
          </div>
        </div>

        {/* Desktop tab bar */}
        <div className="hidden md:flex items-end border-b border-zinc-200 mb-5 flex-shrink-0">
          <div className="flex gap-x-6 flex-1">
            {TABS.map((t) => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={['pb-3 text-sm font-medium transition-colors whitespace-nowrap',
                  tab === t.key ? 'text-zinc-900 border-b-2 border-zinc-900 -mb-px' : 'text-zinc-400 hover:text-zinc-600',
                ].join(' ')}>
                {t.label}
              </button>
            ))}
          </div>
          <div className="pb-3">
            <PageActions add={addBtn} />
          </div>
        </div>

        <div className="md:flex-1 md:min-h-0 md:flex md:flex-col">
          {renderTab()}
        </div>
      </div>
    </>
  )
}
