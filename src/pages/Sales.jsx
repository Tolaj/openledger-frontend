import { useState, useRef } from 'react'
import { Construction, Plus, Pencil, Trash2, Users, TrendingUp, Minus, Truck, RefreshCw, ChevronDown, FileText, Mail, Download, Eye } from 'lucide-react'
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
import { useSalesOrders, useCreateSalesOrder, useUpdateSalesOrder, useDeleteSalesOrder, useSendSalesOrder } from '../hooks/useSalesOrders'
import { getSalesOrderPDF } from '../api/salesOrders'
import useGroupStore from '../store/groupStore'
import { useDeliveries, useCreateDelivery, useUpdateDelivery, useDeleteDelivery } from '../hooks/useDeliveries'
import { useSalesInvoices, useCreateSalesInvoice, useUpdateSalesInvoice, useDeleteSalesInvoice, useSendSalesInvoice } from '../hooks/useSalesInvoices'
import { getSalesInvoicePDF } from '../api/salesInvoices'
import { useProducts } from '../hooks/useProducts'
import { useCurrencySymbol } from '../hooks/useCurrency'
import ProductPicker from '../components/features/ProductPicker'
import Tabs from '../components/ui/Tabs'
import { usePermission } from '../hooks/usePermission'
import { useEmailEnabled } from '../hooks/useEmailEnabled'

const ALL_TABS = [
  { key: 'so',        label: 'Sales Orders', mobileLabel: 'Sales Order'       },
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

function CustomerMobileCard({ c, onEdit, onDelete }) {
  const [isOpen, setIsOpen] = useState(false)
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.07)]">
      <div className="px-3 py-3 flex items-center gap-2.5">
        <div className="w-10 h-10 rounded-xl bg-zinc-900 flex items-center justify-center flex-shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-white">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0" onClick={() => setIsOpen((v) => !v)}>
          <p className="text-sm font-semibold text-zinc-900 truncate">{c.name}</p>
          <p className="text-xs text-zinc-400 mt-0.5">{c.contactPerson || c.phone || c.email || '—'}</p>
        </div>
        <div className="flex gap-0 flex-shrink-0">
          {onEdit && <button onClick={() => onEdit(c)} className="px-1 py-2 rounded-xl text-zinc-400 active:bg-zinc-100 hover:text-zinc-700"><Pencil size={17} /></button>}
          {onDelete && <button onClick={() => onDelete(c._id)} className="px-1 py-2 rounded-xl text-zinc-400 active:bg-zinc-100 hover:text-red-500"><Trash2 size={17} /></button>}
          <button onClick={() => setIsOpen((v) => !v)} className="px-1 py-2 rounded-xl text-zinc-400 active:bg-zinc-100">
            <ChevronDown size={17} className={`transition-transform ${isOpen ? '' : '-rotate-90'}`} />
          </button>
        </div>
      </div>
      {isOpen && (
        <div className="border-t border-zinc-100 divide-y divide-zinc-100">
          {c.contactPerson && <div className="flex items-center px-4 py-2.5"><span className="text-xs text-zinc-400 w-24 flex-shrink-0">Contact</span><span className="text-sm text-zinc-900">{c.contactPerson}</span></div>}
          {c.phone && <div className="flex items-center px-4 py-2.5"><span className="text-xs text-zinc-400 w-24 flex-shrink-0">Phone</span><span className="text-sm text-zinc-900">{c.phone}</span></div>}
          {c.email && <div className="flex items-center px-4 py-2.5"><span className="text-xs text-zinc-400 w-24 flex-shrink-0">Email</span><span className="text-sm text-zinc-900">{c.email}</span></div>}
          {c.gstin && <div className="flex items-center px-4 py-2.5"><span className="text-xs text-zinc-400 w-24 flex-shrink-0">GSTIN</span><span className="text-sm text-zinc-900">{c.gstin}</span></div>}
          {c.address && <div className="flex items-center px-4 py-2.5"><span className="text-xs text-zinc-400 w-24 flex-shrink-0">Address</span><span className="text-sm text-zinc-900">{c.address}</span></div>}
          {c.notes && <div className="flex items-center px-4 py-2.5"><span className="text-xs text-zinc-400 w-24 flex-shrink-0">Notes</span><span className="text-sm text-zinc-900">{c.notes}</span></div>}
        </div>
      )}
    </div>
  )
}

function CustomersTab({ mobileFiltersOpen, onAdd }) {
  const { data: customers = [], isLoading } = useCustomers()
  const createCustomer = useCreateCustomer()
  const updateCustomer = useUpdateCustomer()
  const deleteCustomer = useDeleteCustomer()
  const canAdd    = usePermission('sales_orders', 'customers', 'add')
  const canEdit   = usePermission('sales_orders', 'customers', 'edit')
  const canDelete = usePermission('sales_orders', 'customers', 'delete')

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
          action={canAdd ? <Button size="sm" onClick={openCreate}><Plus size={16} /> Add Customer</Button> : null} />
      ) : (
        <>
          <DataTableMobileFilters columns={CUSTOMER_COLS} filters={filters} onFilterChange={setFilter} open={mobileFiltersOpen} />

          {/* Mobile cards */}
          <div className="flex flex-col gap-2 md:hidden">
            {filtered.map((c) => (
              <CustomerMobileCard key={c._id} c={c} onEdit={canEdit ? openEdit : null} onDelete={canDelete ? onDelete : null} />
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
                    {canEdit && <button onClick={() => openEdit(c)} className="p-2 rounded-lg text-zinc-400 hover:text-zinc-700 active:bg-zinc-100" title="Edit"><Pencil size={14} /></button>}
                    {canDelete && <button onClick={() => onDelete(c._id)} className="p-2 rounded-lg text-zinc-400 hover:text-red-500 active:bg-zinc-100" title="Delete"><Trash2 size={14} /></button>}
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

function SOMobileCard({ o, sym, onDelete, onStatusSheet, onSend, updatingId }) {
  const [isOpen, setIsOpen] = useState(false)
  const [itemsOpen, setItemsOpen] = useState(false)
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.07)]">
      <div className="px-3 py-3 flex items-center gap-2.5">
        <div className="w-10 h-10 rounded-xl bg-zinc-900 flex items-center justify-center flex-shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-white">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0" onClick={() => setIsOpen((v) => !v)}>
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="text-sm font-semibold text-zinc-900 font-mono">{o.soNumber}</p>
            <Badge variant={STATUS_VARIANT[o.status] || 'default'}>{o.status}</Badge>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">{sym}{(o.grandTotal || 0).toFixed(2)}&nbsp;|&nbsp;{o.customer?.name || '—'}</p>
        </div>
        <div className="flex gap-0 flex-shrink-0">
          {onSend && <button onClick={() => onSend(o)} className="px-1 py-2 rounded-xl text-zinc-400 active:bg-zinc-100 hover:text-blue-500"><Mail size={17} /></button>}
          <button onClick={() => o.status !== 'delivered' && onStatusSheet(o)} disabled={o.status === 'delivered' || updatingId === o._id} className="px-1 py-2 rounded-xl text-zinc-400 active:bg-zinc-100 hover:text-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed">
            {updatingId === o._id ? <span className="h-3.5 w-3.5 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin inline-block" /> : <RefreshCw size={17} />}
          </button>
          <button onClick={() => onDelete(o._id)} className="px-1 py-2 rounded-xl text-zinc-400 active:bg-zinc-100 hover:text-red-500"><Trash2 size={17} /></button>
          <button onClick={() => setIsOpen((v) => !v)} className="px-1 py-2 rounded-xl text-zinc-400 active:bg-zinc-100">
            <ChevronDown size={17} className={`transition-transform ${isOpen ? '' : '-rotate-90'}`} />
          </button>
        </div>
      </div>
      {isOpen && (
        <div className="border-t border-zinc-100 divide-y divide-zinc-100">
          {o.customer?.name && <div className="flex items-center px-4 py-2.5"><span className="text-xs text-zinc-400 w-24 flex-shrink-0">Customer</span><span className="text-sm text-zinc-900">{o.customer.name}</span></div>}
          <div className="flex items-center px-4 py-2.5"><span className="text-xs text-zinc-400 w-24 flex-shrink-0">Total</span><span className="text-sm font-semibold text-zinc-900">{sym}{(o.grandTotal || 0).toFixed(2)}</span></div>
          {o.deliveryDate && <div className="flex items-center px-4 py-2.5"><span className="text-xs text-zinc-400 w-24 flex-shrink-0">Delivery</span><span className="text-sm text-zinc-900">{new Date(o.deliveryDate).toLocaleDateString()}</span></div>}
          {o.notes && <div className="flex items-center px-4 py-2.5"><span className="text-xs text-zinc-400 w-24 flex-shrink-0">Notes</span><span className="text-sm text-zinc-900">{o.notes}</span></div>}
          <div className="px-4 py-2.5">
            <button onClick={() => setItemsOpen((v) => !v)} className="w-full flex items-center justify-between">
              <span className="text-xs text-zinc-400">items ({o.items?.length ?? 0})</span>
              <ChevronDown size={14} className={`text-zinc-400 transition-transform ${itemsOpen ? '' : '-rotate-90'}`} />
            </button>
            {itemsOpen && (
              <div className="mt-2 rounded-xl border border-zinc-100 overflow-hidden">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-100 bg-zinc-50">
                      {['Product', 'Qty', 'Price', 'Tax%'].map((h, i, arr) => (
                        <th key={h} className={`px-2 py-1.5 text-left font-semibold text-zinc-500 ${i < arr.length - 1 ? 'border-r border-zinc-100' : ''}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(o.items || []).map((it, idx, arr) => (
                      <tr key={idx} className={idx < arr.length - 1 ? 'border-b border-zinc-100' : ''}>
                        <td className="px-2 py-1.5 border-r border-zinc-100 text-zinc-800 font-medium">{it.product?.name || it.description || '—'}</td>
                        <td className="px-2 py-1.5 border-r border-zinc-100 text-zinc-600">{it.qty}</td>
                        <td className="px-2 py-1.5 border-r border-zinc-100 text-zinc-600">{sym}{(it.unitPrice || 0).toFixed(2)}</td>
                        <td className="px-2 py-1.5 text-zinc-600">{it.taxRate ?? 0}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function SalesOrdersTab({ mobileFiltersOpen, onAdd }) {
  const { data: orders = [], isLoading } = useSalesOrders()
  const { data: customers = [] } = useCustomers()
  const { data: products = [] } = useProducts()
  const createSO = useCreateSalesOrder()
  const updateSO = useUpdateSalesOrder()
  const deleteSO = useDeleteSalesOrder()
  const sendSO = useSendSalesOrder()
  const sym = useCurrencySymbol()
  const activeGroupId = useGroupStore((s) => s.activeGroupId)
  const canEmail = usePermission('sales_orders', 'so', 'email')
  const { enabled: emailEnabled } = useEmailEnabled()

  const [sheetOpen, setSheetOpen] = useState(false)
  const [statusSheet, setStatusSheet] = useState(null)
  const [updatingId, setUpdatingId] = useState(null)
  const [sendSheet, setSendSheet] = useState(null)
  const [sendEmail, setSendEmail] = useState('')
  const [sendError, setSendError] = useState('')
  const [pdfLoading, setPdfLoading] = useState({})
  const [expanded, setExpanded] = useState({})
  const [filters, setFilters] = useState({ soNumber: '', customer: '', status: '' })
  const [dropSel, setDropSel] = useState({})
  const [itemErrors, setItemErrors] = useState([])
  const toggleExpand = (id) => setExpanded((e) => ({ ...e, [id]: !e[id] }))

  const { register, handleSubmit, reset, watch, control, setValue, formState: { errors } } = useForm({
    defaultValues: { customer: '', items: [{ product: '', description: '', qty: 1, unit: '', unitPrice: 0, taxRate: 0 }], deliveryDate: '', notes: '' }
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
      setValue(`items.${idx}.unit`, p.unit || '')
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
    const errs = data.items.map((it) => !it.product ? 'Please select a product from the catalog' : '')
    setItemErrors(errs)
    if (errs.some(Boolean)) return
    const items = data.items.map((it, i) => {
      const { product, ...rest } = it
      return { ...(product ? { product } : {}), ...rest, qty: parseFloat(it.qty), unitPrice: parseFloat(it.unitPrice), taxRate: parseFloat(it.taxRate) || 0, amount: calcAmount(i) }
    })
    await createSO.mutateAsync({ ...data, items })
    setSheetOpen(false)
  }

  const onDelete = async (id) => { if (confirm('Delete this sales order?')) await deleteSO.mutateAsync(id) }
  const onStatusChange = async (s) => { const id = statusSheet._id; setStatusSheet(null); setUpdatingId(id); try { await updateSO.mutateAsync({ id, data: { status: s } }) } finally { setUpdatingId(null) } }

  const handlePDFAction = async (id, soNumber, disposition) => {
    const key = `${id}-${disposition}`
    setPdfLoading((p) => ({ ...p, [key]: true }))
    try {
      const res = await getSalesOrderPDF(id, activeGroupId, disposition)
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
      if (disposition === 'inline') {
        window.open(url, '_blank')
      } else {
        const a = document.createElement('a')
        a.href = url
        a.download = `${soNumber}.pdf`
        a.click()
      }
      setTimeout(() => URL.revokeObjectURL(url), 10000)
    } catch (e) {
      alert('Failed to generate PDF')
    } finally {
      setPdfLoading((p) => ({ ...p, [key]: false }))
    }
  }

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
              <SOMobileCard key={o._id} o={o} sym={sym} onDelete={onDelete} onStatusSheet={setStatusSheet} onSend={canEmail ? (o) => { setSendEmail(o.customer?.email || ''); setSendError(''); setSendSheet(o) } : null} updatingId={updatingId} />
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
                      {canEmail && <button onClick={(e) => { e.stopPropagation(); setSendEmail(o.customer?.email || ''); setSendError(''); setSendSheet(o) }} className="p-2 rounded-lg text-zinc-400 hover:text-blue-500 active:bg-zinc-100" title="Send to customer"><Mail size={14} /></button>}
                      <button onClick={(e) => { e.stopPropagation(); if (o.status !== 'delivered') setStatusSheet(o) }} disabled={o.status === 'delivered' || updatingId === o._id} className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 active:bg-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:text-zinc-400" title="Update status">{updatingId === o._id ? <span className="h-3.5 w-3.5 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin inline-block" /> : <RefreshCw size={14} />}</button>
                      <button onClick={(e) => { e.stopPropagation(); onDelete(o._id) }} className="p-2 rounded-lg text-zinc-400 hover:text-red-500 active:bg-zinc-100" title="Delete"><Trash2 size={14} /></button>
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
              <button type="button" onClick={() => append({ product: '', description: '', qty: 1, unit: '', unitPrice: 0, taxRate: 0 })}
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
                    onChange={(id) => { handleProductSelect(idx, id); setItemErrors((e) => { const n = [...e]; n[idx] = ''; return n }) }}
                    sym={sym}
                    error={itemErrors[idx]}
                  />
                  <input type="hidden" {...register(`items.${idx}.unit`)} />
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
          {['draft', 'sent', 'confirmed', 'delivered', 'cancelled'].map((s) => (
            <button key={s} onClick={() => onStatusChange(s)}
              className={['py-3 rounded-xl text-sm font-medium capitalize border transition-colors',
                statusSheet?.status === s ? 'bg-zinc-900 text-white border-zinc-900' : 'border-zinc-200 text-zinc-700 hover:bg-zinc-50',
              ].join(' ')}>
              {s}
            </button>
          ))}
        </div>
      </BottomSheet>

      {/* Send SO Sheet */}
      <BottomSheet
        open={!!sendSheet}
        onClose={() => setSendSheet(null)}
        title={`Send ${sendSheet?.soNumber || 'SO'} to Customer`}
        footer={
          <div className="flex flex-col gap-2">
            {!emailEnabled && (
              <p className="text-xs text-center text-amber-600 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                Email sending is disabled. Enable it in <strong>Settings → Configuration → Email Sending</strong>.
              </p>
            )}
            <Button
              fullWidth
              disabled={!emailEnabled}
              loading={sendSO.isPending}
              onClick={async () => {
                setSendError('')
                try {
                  await sendSO.mutateAsync({ id: sendSheet._id, recipientEmail: sendEmail })
                  setSendSheet(null)
                } catch (e) {
                  setSendError(e?.response?.data?.error || e?.response?.data?.message || 'Failed to send')
                }
              }}
            >
              <Mail size={15} /> Send SO
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="bg-zinc-50 rounded-xl border border-zinc-200 p-4 space-y-1">
            <div className="flex justify-between text-sm"><span className="text-zinc-500">SO Number</span><span className="font-mono font-semibold text-zinc-900">{sendSheet?.soNumber}</span></div>
            <div className="flex justify-between text-sm"><span className="text-zinc-500">Customer</span><span className="font-semibold text-zinc-900">{sendSheet?.customer?.name || '—'}</span></div>
            <div className="flex justify-between text-sm"><span className="text-zinc-500">Grand Total</span><span className="font-semibold text-zinc-900">{sym}{(sendSheet?.grandTotal || 0).toFixed(2)}</span></div>
            <div className="flex justify-between text-sm"><span className="text-zinc-500">Items</span><span className="text-zinc-700">{sendSheet?.items?.length || 0} line items</span></div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700">Recipient Email *</label>
            <input
              type="email"
              value={sendEmail}
              onChange={(e) => setSendEmail(e.target.value)}
              placeholder="customer@example.com"
              className="h-11 w-full rounded-xl border border-zinc-300 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
            />
            {!sendSheet?.customer?.email && (
              <p className="text-xs text-amber-600">This customer has no email on file. Enter one above to send.</p>
            )}
          </div>

          <div className="flex gap-2">
            <button onClick={() => handlePDFAction(sendSheet._id, sendSheet.soNumber, 'inline')} disabled={pdfLoading[`${sendSheet?._id}-inline`]} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-zinc-200 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors disabled:opacity-50">
              {pdfLoading[`${sendSheet?._id}-inline`] ? <span className="block w-3.5 h-3.5 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" /> : <Eye size={14} />} Preview PDF
            </button>
            <button onClick={() => handlePDFAction(sendSheet._id, sendSheet.soNumber, 'attachment')} disabled={pdfLoading[`${sendSheet?._id}-attachment`]} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-zinc-200 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors disabled:opacity-50">
              {pdfLoading[`${sendSheet?._id}-attachment`] ? <span className="block w-3.5 h-3.5 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" /> : <Download size={14} />} Download PDF
            </button>
          </div>

          <p className="text-xs text-zinc-400">A PDF of the sales order will be attached and the SO status will be updated to <strong>Sent</strong>.</p>
          {sendError && <p className="text-sm text-red-500">{sendError}</p>}
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

function DeliveryMobileCard({ d, onDelete, onStatusSheet, updatingId }) {
  const [isOpen, setIsOpen] = useState(false)
  const [itemsOpen, setItemsOpen] = useState(false)
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.07)]">
      <div className="px-3 py-3 flex items-center gap-2.5">
        <div className="w-10 h-10 rounded-xl bg-zinc-900 flex items-center justify-center flex-shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-white">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
          </svg>
        </div>
        <div className="flex-1 min-w-0" onClick={() => setIsOpen((v) => !v)}>
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="text-sm font-semibold text-zinc-900 font-mono">{d.deliveryNumber}</p>
            <Badge variant={DEL_STATUS_VARIANT[d.status] || 'default'}>{d.status}</Badge>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">{d.salesOrder?.soNumber || '—'}&nbsp;·&nbsp;{d.salesOrder?.customer?.name || '—'}</p>
        </div>
        <div className="flex gap-0 flex-shrink-0">
          <button onClick={() => d.status !== 'complete' && onStatusSheet(d)} disabled={d.status === 'complete' || updatingId === d._id} className="px-1 py-2 rounded-xl text-zinc-400 active:bg-zinc-100 hover:text-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed">
            {updatingId === d._id ? <span className="h-3.5 w-3.5 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin inline-block" /> : <RefreshCw size={17} />}
          </button>
          <button onClick={() => onDelete(d._id)} className="px-1 py-2 rounded-xl text-zinc-400 active:bg-zinc-100 hover:text-red-500"><Trash2 size={17} /></button>
          <button onClick={() => setIsOpen((v) => !v)} className="px-1 py-2 rounded-xl text-zinc-400 active:bg-zinc-100">
            <ChevronDown size={17} className={`transition-transform ${isOpen ? '' : '-rotate-90'}`} />
          </button>
        </div>
      </div>
      {isOpen && (
        <div className="border-t border-zinc-100 divide-y divide-zinc-100">
          {d.salesOrder?.soNumber && <div className="flex items-center px-4 py-2.5"><span className="text-xs text-zinc-400 w-24 flex-shrink-0">SO</span><span className="text-sm text-zinc-900">{d.salesOrder.soNumber}</span></div>}
          {d.salesOrder?.customer?.name && <div className="flex items-center px-4 py-2.5"><span className="text-xs text-zinc-400 w-24 flex-shrink-0">Customer</span><span className="text-sm text-zinc-900">{d.salesOrder.customer.name}</span></div>}
          {d.deliveredDate && <div className="flex items-center px-4 py-2.5"><span className="text-xs text-zinc-400 w-24 flex-shrink-0">Delivered</span><span className="text-sm text-zinc-900">{new Date(d.deliveredDate).toLocaleDateString()}</span></div>}
          {d.notes && <div className="flex items-center px-4 py-2.5"><span className="text-xs text-zinc-400 w-24 flex-shrink-0">Notes</span><span className="text-sm text-zinc-900">{d.notes}</span></div>}
          <div className="px-4 py-2.5">
            <button onClick={() => setItemsOpen((v) => !v)} className="w-full flex items-center justify-between">
              <span className="text-xs text-zinc-400">items ({d.items?.length ?? 0})</span>
              <ChevronDown size={14} className={`text-zinc-400 transition-transform ${itemsOpen ? '' : '-rotate-90'}`} />
            </button>
            {itemsOpen && (
              <div className="mt-2 rounded-xl border border-zinc-100 overflow-hidden">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-100 bg-zinc-50">
                      {['Product', 'Delivered', 'Ordered', 'Unit'].map((h, i, arr) => (
                        <th key={h} className={`px-2 py-1.5 text-left font-semibold text-zinc-500 ${i < arr.length - 1 ? 'border-r border-zinc-100' : ''}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(d.items || []).map((it, idx, arr) => (
                      <tr key={idx} className={idx < arr.length - 1 ? 'border-b border-zinc-100' : ''}>
                        <td className="px-2 py-1.5 border-r border-zinc-100 text-zinc-800 font-medium">{it.product?.name || it.description || '—'}</td>
                        <td className="px-2 py-1.5 border-r border-zinc-100 text-zinc-600">{it.qtyDelivered}</td>
                        <td className="px-2 py-1.5 border-r border-zinc-100 text-zinc-600">{it.qtyOrdered}</td>
                        <td className="px-2 py-1.5 text-zinc-600">{it.unit || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function DeliveryTab({ mobileFiltersOpen, onAdd }) {
  const { data: deliveries = [], isLoading } = useDeliveries()
  const { data: salesOrders = [] } = useSalesOrders()
  const createDelivery = useCreateDelivery()
  const updateDelivery = useUpdateDelivery()
  const deleteDelivery = useDeleteDelivery()
  const sym = useCurrencySymbol()

  const [sheetOpen, setSheetOpen] = useState(false)
  const [selectedSO, setSelectedSO] = useState('')
  const [delItems, setDelItems] = useState([])
  const [deliveredDate, setDeliveredDate] = useState('')
  const [notes, setNotes] = useState('')
  const [formError, setFormError] = useState('')
  const [expanded, setExpanded] = useState({})
  const [delStatusSheet, setDelStatusSheet] = useState(null)
  const [delUpdatingId, setDelUpdatingId] = useState(null)
  const [filters, setFilters] = useState({ deliveryNumber: '', so: '', customer: '', status: '' })
  const [dropSel, setDropSel] = useState({})
  const toggleExpand = (id) => setExpanded((e) => ({ ...e, [id]: !e[id] }))

  const handleSOChange = (soId) => {
    setSelectedSO(soId)
    const so = salesOrders.find((s) => s._id === soId)
    if (so?.items) {
      // Sum qty already delivered across all prior deliveries for this SO
      const priorDeliveries = deliveries.filter((d) => (d.salesOrder?._id || d.salesOrder) === soId)
      const alreadyDelivered = {}
      for (const d of priorDeliveries) {
        for (const it of d.items) {
          const key = it.product?._id || it.product || it.description
          alreadyDelivered[key] = (alreadyDelivered[key] || 0) + (it.qtyDelivered || 0)
        }
      }

      setDelItems(so.items.map((it) => {
        const productKey = it.product?._id || it.product || ''
        const delivered = alreadyDelivered[productKey] || 0
        const remaining = Math.max(0, (it.qty || 0) - delivered)
        return {
          product: productKey,
          description: it.description || it.product?.name || '',
          qtyOrdered: it.qty || 0,
          qtyDelivered: remaining,
          unit: it.unit || it.product?.unit || '',
          unitPrice: it.unitPrice || 0,
        }
      }).filter((it) => it.qtyDelivered > 0)) // hide fully delivered lines
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
  const eligibleSOs = salesOrders.filter((s) => ['draft', 'sent', 'confirmed', 'partial'].includes(s.status))

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
              <DeliveryMobileCard key={d._id} d={d} onDelete={onDelete} onStatusSheet={setDelStatusSheet} updatingId={delUpdatingId} />
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
            leadingCol={true}
            renderRow={(d) => (
              <React.Fragment key={d._id}>
                <tr className="border-b border-zinc-100 hover:bg-zinc-50 transition-colors cursor-pointer" onClick={() => toggleExpand(d._id)}>
                  <td className="px-3 py-3 border-r border-zinc-100 text-zinc-400">
                    <ChevronDown size={14} className={`transition-transform ${expanded[d._id] ? '' : '-rotate-90'}`} />
                  </td>
                  <td className="px-4 py-3 border-r border-zinc-100 font-mono text-sm font-semibold text-zinc-900">{d.deliveryNumber}</td>
                  <td className="px-4 py-3 border-r border-zinc-100 text-sm text-zinc-700">{d.salesOrder?.soNumber || '—'}</td>
                  <td className="px-4 py-3 border-r border-zinc-100 text-sm text-zinc-700">{d.salesOrder?.customer?.name || '—'}</td>
                  <td className="px-4 py-3 border-r border-zinc-100"><Badge variant={DEL_STATUS_VARIANT[d.status] || 'default'}>{d.status}</Badge></td>
                  <td className="px-4 py-3 border-r border-zinc-100 text-sm text-zinc-500 text-center">{d.items?.length || 0}</td>
                  <td className="px-4 py-3 border-r border-zinc-100 text-sm text-zinc-500">{d.deliveredDate ? new Date(d.deliveredDate).toLocaleDateString() : '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={(e) => { e.stopPropagation(); onDelete(d._id) }} className="p-2 rounded-lg text-zinc-400 hover:text-red-500 active:bg-zinc-100" title="Delete"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
                {expanded[d._id] && (
                  <tr className="border-b border-zinc-100 bg-zinc-50">
                    <td /><td colSpan={7} className="px-4 py-3">
                      <table className="w-full text-xs border-collapse rounded-xl overflow-hidden border border-zinc-200">
                        <thead>
                          <tr className="border-b border-zinc-200">
                            {['Product / Description', 'Qty Delivered', 'Qty Ordered', 'Unit'].map((h, i, arr) => (
                              <th key={h} className={`px-3 py-2 text-left text-xs font-semibold text-zinc-500 ${i < arr.length - 1 ? 'border-r border-zinc-200' : ''}`}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {(d.items || []).map((item, idx, arr) => (
                            <tr key={idx} className={idx < arr.length - 1 ? 'border-b border-zinc-100' : ''}>
                              <td className="px-3 py-2 border-r border-zinc-100 font-medium text-zinc-800">{item.product?.name || item.description || '—'}</td>
                              <td className="px-3 py-2 border-r border-zinc-100 text-zinc-600">{item.qtyDelivered ?? '—'}</td>
                              <td className="px-3 py-2 border-r border-zinc-100 text-zinc-600">{item.qtyOrdered ?? '—'}</td>
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

      {/* Delivery Status Sheet */}
      <BottomSheet open={!!delStatusSheet} onClose={() => setDelStatusSheet(null)} title="Update Delivery Status">
        <div className="space-y-2 pb-2">
          {['partial', 'complete'].map((s) => (
            <button key={s} onClick={async () => { const id = delStatusSheet._id; setDelStatusSheet(null); setDelUpdatingId(id); try { await updateDelivery.mutateAsync({ id, data: { status: s } }) } finally { setDelUpdatingId(null) } }}
              className={['w-full py-3 rounded-xl border text-sm font-semibold capitalize transition-all',
                delStatusSheet?.status === s ? 'bg-zinc-900 text-white border-zinc-900' : 'border-zinc-200 text-zinc-700 hover:bg-zinc-50'].join(' ')}>
              {s}
            </button>
          ))}
          <p className="text-xs text-zinc-400 text-center pt-1">Marking complete will update all deliveries for this SO to complete.</p>
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

function SInvoiceMobileCard({ inv, sym, getRef, onDelete, onStatusSheet, onSend, updatingId }) {
  const [isOpen, setIsOpen] = useState(false)
  const [itemsOpen, setItemsOpen] = useState(false)
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.07)]">
      <div className="px-3 py-3 flex items-center gap-2.5">
        <div className="w-10 h-10 rounded-xl bg-zinc-900 flex items-center justify-center flex-shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-white">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 9h3.75m-4.5 2.625h4.5M12 18.75 9.75 16.5h.375a2.625 2.625 0 0 0 0-5.25H9.75m.75-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0" onClick={() => setIsOpen((v) => !v)}>
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="text-sm font-semibold text-zinc-900 font-mono">{inv.invoiceNumber}</p>
            <Badge variant={SINV_STATUS_VARIANT[inv.status] || 'default'}>{inv.status}</Badge>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">{sym}{(inv.grandTotal || 0).toFixed(2)}&nbsp;|&nbsp;{inv.customer?.name || '—'}</p>
        </div>
        <div className="flex gap-0 flex-shrink-0">
          {onSend && <button onClick={() => onSend(inv)} className="px-1 py-2 rounded-xl text-zinc-400 active:bg-zinc-100 hover:text-blue-500"><Mail size={17} /></button>}
          <button onClick={() => inv.status !== 'paid' && onStatusSheet(inv)} disabled={inv.status === 'paid' || updatingId === inv._id} className="px-1 py-2 rounded-xl text-zinc-400 active:bg-zinc-100 hover:text-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed">
            {updatingId === inv._id ? <span className="h-3.5 w-3.5 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin inline-block" /> : <RefreshCw size={17} />}
          </button>
          <button onClick={() => onDelete(inv._id)} className="px-1 py-2 rounded-xl text-zinc-400 active:bg-zinc-100 hover:text-red-500"><Trash2 size={17} /></button>
          <button onClick={() => setIsOpen((v) => !v)} className="px-1 py-2 rounded-xl text-zinc-400 active:bg-zinc-100">
            <ChevronDown size={17} className={`transition-transform ${isOpen ? '' : '-rotate-90'}`} />
          </button>
        </div>
      </div>
      {isOpen && (
        <div className="border-t border-zinc-100 divide-y divide-zinc-100">
          {inv.customer?.name && <div className="flex items-center px-4 py-2.5"><span className="text-xs text-zinc-400 w-24 flex-shrink-0">Customer</span><span className="text-sm text-zinc-900">{inv.customer.name}</span></div>}
          {(inv.salesOrder || inv.delivery) && <div className="flex items-center px-4 py-2.5"><span className="text-xs text-zinc-400 w-24 flex-shrink-0">Ref</span><span className="text-sm text-zinc-900">{getRef(inv)}</span></div>}
          <div className="flex items-center px-4 py-2.5"><span className="text-xs text-zinc-400 w-24 flex-shrink-0">Subtotal</span><span className="text-sm text-zinc-900">{sym}{(inv.subtotal || 0).toFixed(2)}</span></div>
          <div className="flex items-center px-4 py-2.5"><span className="text-xs text-zinc-400 w-24 flex-shrink-0">Tax</span><span className="text-sm text-zinc-900">{sym}{(inv.taxAmount || 0).toFixed(2)}</span></div>
          <div className="flex items-center px-4 py-2.5"><span className="text-xs text-zinc-400 w-24 flex-shrink-0">Total</span><span className="text-sm font-semibold text-zinc-900">{sym}{(inv.grandTotal || 0).toFixed(2)}</span></div>
          {inv.dueDate && <div className="flex items-center px-4 py-2.5"><span className="text-xs text-zinc-400 w-24 flex-shrink-0">Due</span><span className="text-sm text-zinc-900">{new Date(inv.dueDate).toLocaleDateString()}</span></div>}
          <div className="px-4 py-2.5">
            <button onClick={() => setItemsOpen((v) => !v)} className="w-full flex items-center justify-between">
              <span className="text-xs text-zinc-400">items ({inv.items?.length ?? 0})</span>
              <ChevronDown size={14} className={`text-zinc-400 transition-transform ${itemsOpen ? '' : '-rotate-90'}`} />
            </button>
            {itemsOpen && (
              <div className="mt-2 rounded-xl border border-zinc-100 overflow-hidden">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-100 bg-zinc-50">
                      {['Product', 'Qty', 'Price', 'Tax%'].map((h, i, arr) => (
                        <th key={h} className={`px-2 py-1.5 text-left font-semibold text-zinc-500 ${i < arr.length - 1 ? 'border-r border-zinc-100' : ''}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(inv.items || []).map((it, idx, arr) => (
                      <tr key={idx} className={idx < arr.length - 1 ? 'border-b border-zinc-100' : ''}>
                        <td className="px-2 py-1.5 border-r border-zinc-100 text-zinc-800 font-medium">{it.product?.name || it.description || '—'}</td>
                        <td className="px-2 py-1.5 border-r border-zinc-100 text-zinc-600">{it.qty}</td>
                        <td className="px-2 py-1.5 border-r border-zinc-100 text-zinc-600">{sym}{(it.unitPrice || 0).toFixed(2)}</td>
                        <td className="px-2 py-1.5 text-zinc-600">{it.taxRate ?? 0}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function SalesInvoicesTab({ mobileFiltersOpen, onAdd }) {
  const { data: invoices = [], isLoading } = useSalesInvoices()
  const { data: salesOrders = [] } = useSalesOrders()
  const { data: deliveries = [] } = useDeliveries()
  const { data: customers = [] } = useCustomers()
  const createInvoice = useCreateSalesInvoice()
  const updateInvoice = useUpdateSalesInvoice()
  const deleteInvoice = useDeleteSalesInvoice()
  const sendInvoice   = useSendSalesInvoice()
  const sym = useCurrencySymbol()
  const activeGroupId = useGroupStore((s) => s.activeGroupId)
  const canEmail = usePermission('sales_orders', 'so_inv', 'email')
  const { enabled: emailEnabled } = useEmailEnabled()

  const [sheetOpen, setSheetOpen] = useState(false)
  const [statusSheet, setStatusSheet] = useState(null)
  const [updatingId, setUpdatingId] = useState(null)
  const [invUpdatingId, setInvUpdatingId] = useState(null)
  const [sendSheet, setSendSheet]   = useState(null)
  const [sendEmail, setSendEmail]   = useState('')
  const [sendError, setSendError]   = useState('')
  const [pdfLoading, setPdfLoading] = useState({})

  const handlePDFAction = async (id, invoiceNumber, disposition) => {
    const key = `${id}-${disposition}`
    setPdfLoading((p) => ({ ...p, [key]: true }))
    try {
      const res = await getSalesInvoicePDF(id, activeGroupId, disposition)
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
      if (disposition === 'inline') { window.open(url, '_blank') }
      else { const a = document.createElement('a'); a.href = url; a.download = `${invoiceNumber}.pdf`; a.click() }
      setTimeout(() => URL.revokeObjectURL(url), 10000)
    } catch { alert('Failed to generate PDF') }
    finally { setPdfLoading((p) => ({ ...p, [key]: false })) }
  }
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

  // Build SO/DEL ref string
  const getInvoiceRef = (inv) => {
    const soNumber = inv.salesOrder?.soNumber
    // Created via Delivery → show single DEL as before
    if (inv.delivery) return [soNumber, inv.delivery?.deliveryNumber].filter(Boolean).join(' / ') || '—'
    // Created via SO → show all deliveries under that SO
    if (!soNumber) return '—'
    const soId = inv.salesOrder?._id || inv.salesOrder
    const linkedDels = deliveries.filter((d) => (d.salesOrder?._id || d.salesOrder) === soId)
    if (linkedDels.length === 0) return soNumber
    if (linkedDels.length === 1) return `${soNumber} / ${linkedDels[0].deliveryNumber}`
    const prefix = linkedDels[0].deliveryNumber.replace(/\d+$/, '')
    const nums = linkedDels.map((d) => d.deliveryNumber.replace(/\D/g, ''))
    return `${soNumber} / ${prefix}${nums.join(', ')}`
  }

  const dropOpts = {
    customer: [...new Set(invoices.map((i) => i.customer?.name).filter(Boolean))],
    status:   ['draft', 'sent', 'paid', 'overdue', 'cancelled'],
  }

  const filtered = invoices.filter((inv) => {
    const customerName = inv.customer?.name || ''
    const ref = getInvoiceRef(inv)
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
    const id = statusSheet._id; setStatusSheet(null); setInvUpdatingId(id)
    try { await updateInvoice.mutateAsync({ id, data: { status: s } }) } finally { setInvUpdatingId(null) }
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
              <SInvoiceMobileCard key={inv._id} inv={inv} sym={sym} getRef={getInvoiceRef} onDelete={onDelete} onStatusSheet={setStatusSheet} onSend={canEmail ? (inv) => { setSendEmail(inv.customer?.email || ''); setSendError(''); setSendSheet(inv) } : null} updatingId={invUpdatingId} />
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
                    {getInvoiceRef(inv)}
                  </td>
                  <td className="px-4 py-3 border-r border-zinc-100">
                    <Badge variant={SINV_STATUS_VARIANT[inv.status] || 'default'}>{inv.status}</Badge>
                  </td>
                  <td className="px-4 py-3 border-r border-zinc-100 text-sm font-semibold text-zinc-900">{sym}{(inv.grandTotal || 0).toFixed(2)}</td>
                  <td className="px-4 py-3 border-r border-zinc-100 text-sm text-zinc-500">{inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 whitespace-nowrap">
                      {canEmail && <button onClick={(e) => { e.stopPropagation(); setSendEmail(inv.customer?.email || ''); setSendError(''); setSendSheet(inv) }} className="p-2 rounded-lg text-zinc-400 hover:text-blue-500 active:bg-zinc-100" title="Send invoice"><Mail size={14} /></button>}
                      <button onClick={(e) => { e.stopPropagation(); if (inv.status !== 'paid') setStatusSheet(inv) }} disabled={inv.status === 'paid' || invUpdatingId === inv._id} className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 active:bg-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:text-zinc-400" title="Update status">{invUpdatingId === inv._id ? <span className="h-3.5 w-3.5 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin inline-block" /> : <RefreshCw size={14} />}</button>
                      <button onClick={(e) => { e.stopPropagation(); onDelete(inv._id) }} className="p-2 rounded-lg text-zinc-400 hover:text-red-500 active:bg-zinc-100" title="Delete"><Trash2 size={14} /></button>
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

          {sourceType === 'delivery' && (() => {
            // SOs that have a direct (non-delivery) invoice are fully covered — hide their deliveries
            const invoicedSoIds = new Set(
              invoices
                .filter((inv) => (inv.salesOrder?._id || inv.salesOrder) && !inv.delivery)
                .map((inv) => inv.salesOrder?._id || inv.salesOrder)
            )
            const availableDeliveries = deliveries.filter((d) => {
              if (invoices.some((inv) => inv.delivery?._id === d._id || inv.delivery === d._id)) return false
              const soId = d.salesOrder?._id || d.salesOrder
              if (soId && invoicedSoIds.has(soId)) return false
              return true
            })
            return (
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-zinc-700">Delivery *</label>
                <select value={selectedSource} onChange={(e) => {
                  setSelectedSource(e.target.value)
                  const del = deliveries.find((d) => d._id === e.target.value)
                  if (del?.salesOrder?.customer) setCustomerId(del.salesOrder.customer._id || del.salesOrder.customer)
                }}
                  className="h-11 w-full rounded-xl border border-zinc-300 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900">
                  <option value="">Select Delivery...</option>
                  {availableDeliveries.map((d) => <option key={d._id} value={d._id}>{d.deliveryNumber} — {d.salesOrder?.soNumber || '?'} · {d.salesOrder?.customer?.name || '?'}</option>)}
                </select>
                {availableDeliveries.length === 0 && (
                  <p className="text-xs text-zinc-500 bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2">
                    All deliveries have been invoiced already.
                  </p>
                )}
              </div>
            )
          })()}

          {sourceType === 'so' && (() => {
            // Hide SOs with status partial, and SOs that already have any invoice
            const availableSos = salesOrders.filter((s) =>
              s.status !== 'partial' &&
              !invoices.some((inv) => inv.salesOrder?._id === s._id || inv.salesOrder === s._id)
            )
            return (
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-zinc-700">Sales Order *</label>
                <select value={selectedSource} onChange={(e) => {
                  setSelectedSource(e.target.value)
                  const so = salesOrders.find((s) => s._id === e.target.value)
                  if (so?.customer) setCustomerId(so.customer._id || so.customer)
                }}
                  className="h-11 w-full rounded-xl border border-zinc-300 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900">
                  <option value="">Select SO...</option>
                  {availableSos.map((s) => <option key={s._id} value={s._id}>{s.soNumber} — {s.customer?.name || '?'}</option>)}
                </select>
                {availableSos.length === 0 && (
                  <p className="text-xs text-zinc-500 bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2">
                    All sales orders have been invoiced already.
                  </p>
                )}
              </div>
            )
          })()}

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

      {/* Send Invoice Sheet */}
      <BottomSheet open={!!sendSheet} onClose={() => setSendSheet(null)} title={`Send ${sendSheet?.invoiceNumber || 'Invoice'} to Customer`}>
        <div className="flex flex-col gap-4 pb-2">
          <div className="bg-zinc-50 rounded-2xl p-4 flex flex-col gap-2">
            <div className="flex justify-between text-sm"><span className="text-zinc-500">Invoice #</span><span className="font-mono font-semibold text-zinc-900">{sendSheet?.invoiceNumber}</span></div>
            <div className="flex justify-between text-sm"><span className="text-zinc-500">Customer</span><span className="font-semibold text-zinc-900">{sendSheet?.customer?.name || '—'}</span></div>
            <div className="flex justify-between text-sm"><span className="text-zinc-500">Grand Total</span><span className="font-semibold text-zinc-900">{sym}{(sendSheet?.grandTotal || 0).toFixed(2)}</span></div>
            {sendSheet?.dueDate && <div className="flex justify-between text-sm"><span className="text-zinc-500">Due Date</span><span className="text-zinc-700">{new Date(sendSheet.dueDate).toLocaleDateString()}</span></div>}
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700">Customer Email</label>
            <input value={sendEmail} onChange={(e) => setSendEmail(e.target.value)} type="email" placeholder="customer@email.com"
              className="h-11 px-3 rounded-xl border border-zinc-300 bg-white text-sm outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900" />
          </div>
          {!sendSheet?.customer?.email && <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">Customer has no saved email. Enter one above to send.</p>}
          <div className="flex gap-2">
            <button onClick={() => handlePDFAction(sendSheet._id, sendSheet.invoiceNumber, 'inline')} disabled={pdfLoading[`${sendSheet?._id}-inline`]} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-zinc-200 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors disabled:opacity-50">
              {pdfLoading[`${sendSheet?._id}-inline`] ? <span className="block w-3.5 h-3.5 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" /> : <Eye size={14} />} Preview PDF
            </button>
            <button onClick={() => handlePDFAction(sendSheet._id, sendSheet.invoiceNumber, 'attachment')} disabled={pdfLoading[`${sendSheet?._id}-attachment`]} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-zinc-200 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors disabled:opacity-50">
              {pdfLoading[`${sendSheet?._id}-attachment`] ? <span className="block w-3.5 h-3.5 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" /> : <Download size={14} />} Download PDF
            </button>
          </div>
          <p className="text-xs text-zinc-400">A PDF of the invoice will be attached and the invoice status will be updated to <strong>Sent</strong>.</p>
          {sendError && <p className="text-sm text-red-500">{sendError}</p>}
          {!emailEnabled && (
            <p className="text-xs text-center text-amber-600 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
              Email sending is disabled. Enable it in <strong>Settings → Configuration → Email Sending</strong>.
            </p>
          )}
          <button
            disabled={!sendEmail || sendInvoice.isPending || !emailEnabled}
            onClick={async () => {
              setSendError('')
              try {
                await sendInvoice.mutateAsync({ id: sendSheet._id, recipientEmail: sendEmail })
                setSendSheet(null)
              } catch (e) { setSendError(e?.response?.data?.message || 'Failed to send') }
            }}
            className="w-full py-3 rounded-xl bg-zinc-900 text-white text-sm font-semibold disabled:opacity-50 hover:bg-zinc-800 transition-colors"
          >
            {sendInvoice.isPending ? 'Sending…' : 'Send Invoice'}
          </button>
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

  const canSeeSO        = usePermission('sales_orders', 'so',        'view')
  const canSeeDelivery  = usePermission('sales_orders', 'delivery',  'view')
  const canSeeInvoices  = usePermission('sales_orders', 'so_inv',    'view')
  const canSeeCustomers = usePermission('sales_orders', 'customers', 'view')
  const canAddSO        = usePermission('sales_orders', 'so',        'add')
  const canAddDelivery  = usePermission('sales_orders', 'delivery',  'add')
  const canAddInvoices  = usePermission('sales_orders', 'so_inv',    'add')
  const canAddCustomers = usePermission('sales_orders', 'customers', 'add')

  const TABS = ALL_TABS.filter((t) => {
    if (t.key === 'so')        return canSeeSO
    if (t.key === 'delivery')  return canSeeDelivery
    if (t.key === 'invoices')  return canSeeInvoices
    if (t.key === 'customers') return canSeeCustomers
    return true
  })

  const hasFilters = ['so', 'delivery', 'invoices', 'customers'].includes(tab)
  const hasAdd     = (tab === 'so' && canAddSO) || (tab === 'delivery' && canAddDelivery) ||
                     (tab === 'invoices' && canAddInvoices) || (tab === 'customers' && canAddCustomers)

  const addBtn = tab === 'so' && canAddSO
    ? <Button size="sm" onClick={() => onAddRef.current?.()}><Plus size={16} /> Create SO</Button>
    : tab === 'delivery' && canAddDelivery
    ? <Button size="sm" onClick={() => onAddRef.current?.()}><Plus size={16} /> Create Delivery</Button>
    : tab === 'invoices' && canAddInvoices
    ? <Button size="sm" onClick={() => onAddRef.current?.()}><Plus size={16} /> Create Invoice</Button>
    : tab === 'customers' && canAddCustomers
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
          <button onClick={() => onAddRef.current?.()} className="w-9 h-9 flex items-center justify-center rounded-full bg-zinc-900 text-white active:bg-zinc-700 transition-colors">
            <Plus size={20} />
          </button>
        )}
      />

      <div className="px-4 pt-0 pb-4 md:px-0 md:py-0 md:pb-4 md:flex md:flex-col md:flex-1 md:min-h-0">
        <div className="flex items-center gap-3 flex-shrink-0 py-2 md:py-0 md:mb-4 md:justify-between">
          <Tabs tabs={TABS} active={tab} onChange={(key) => { if (TABS.find(t => t.key === key)) setTab(key) }} />
          <PageActions add={addBtn} />
        </div>

        <div className="md:flex-1 md:min-h-0 md:flex md:flex-col">
          {renderTab()}
        </div>
      </div>
    </>
  )
}
