import { useState, useRef } from 'react'
import { Construction, Plus, Pencil, Trash2, Users, ShoppingCart, Minus, PackageCheck, RefreshCw, ChevronDown, FileText, Send, Eye, Download } from 'lucide-react'
import React from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import TopBar from '../components/layout/TopBar'
import PageHeader from '../components/layout/PageHeader'
import PageActions from '../components/layout/PageActions'
import BottomSheet from '../components/ui/BottomSheet'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Badge from '../components/ui/Badge'
import EmptyState from '../components/ui/EmptyState'
import DataTable, { DataTableFilterIcon, DataTableMobileFilters } from '../components/ui/DataTable'
import { useVendors, useCreateVendor, useUpdateVendor, useDeleteVendor } from '../hooks/useVendors'
import { usePurchaseOrders, useCreatePurchaseOrder, useUpdatePurchaseOrder, useDeletePurchaseOrder, useSendPurchaseOrder } from '../hooks/usePurchaseOrders'
import { getPurchaseOrderPDF } from '../api/purchaseOrders'
import useGroupStore from '../store/groupStore'
import { useGRNs, useCreateGRN, useDeleteGRN } from '../hooks/useGRNs'
import { usePurchaseInvoices, useCreatePurchaseInvoice, useUpdatePurchaseInvoice, useDeletePurchaseInvoice } from '../hooks/usePurchaseInvoices'
import { useProducts } from '../hooks/useProducts'
import { useCurrencySymbol } from '../hooks/useCurrency'
import ProductPicker from '../components/features/ProductPicker'
import Tabs from '../components/ui/Tabs'

const TABS = [
  { key: 'po',       label: 'Purchase Orders', mobileLabel: 'PO'      },
  { key: 'grn',      label: 'Goods Receipt',   mobileLabel: 'GRN'     },
  { key: 'invoices', label: 'Invoices',         mobileLabel: 'Invoices'},
  { key: 'vendors',  label: 'Vendors',          mobileLabel: 'Vendors' },
]

const STATUS_VARIANT = {
  draft: 'default', sent: 'warning', partial: 'warning', received: 'success', cancelled: 'danger',
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

/* ─── Vendors Tab ─────────────────────────────────────────────────────────── */
const VENDOR_COLS = [
  { key: 'name',          label: 'Vendor',         filterable: true },
  { key: 'contactPerson', label: 'Contact Person',  filterable: true, noDropdown: true },
  { key: 'phone',         label: 'Phone',           filterable: true, noDropdown: true },
  { key: 'email',         label: 'Email',           filterable: true, noDropdown: true },
  { key: 'gstin',         label: 'GSTIN',           filterable: true, noDropdown: true },
  { key: 'action',        label: 'action' },
]

function VendorsTab({ mobileFiltersOpen, onAdd }) {
  const { data: vendors = [], isLoading } = useVendors()
  const createVendor = useCreateVendor()
  const updateVendor = useUpdateVendor()
  const deleteVendor = useDeleteVendor()

  const [sheetOpen, setSheetOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [filters, setFilters] = useState({ name: '', contactPerson: '', phone: '', email: '', gstin: '' })

  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  const openCreate = () => { setEditing(null); reset({}); setSheetOpen(true) }
  const openEdit   = (v) => { setEditing(v); reset(v); setSheetOpen(true) }
  const close      = () => { setSheetOpen(false); setEditing(null); reset({}) }

  // expose openCreate for TopBar right button
  onAdd.current = openCreate

  const setFilter = (key, val) => setFilters((f) => ({ ...f, [key]: val }))

  const filtered = vendors.filter((v) =>
    (v.name || '').toLowerCase().includes(filters.name.toLowerCase()) &&
    (v.contactPerson || '').toLowerCase().includes(filters.contactPerson.toLowerCase()) &&
    (v.phone || '').includes(filters.phone) &&
    (v.email || '').toLowerCase().includes(filters.email.toLowerCase()) &&
    (v.gstin || '').toLowerCase().includes(filters.gstin.toLowerCase())
  )

  const onSubmit = async (data) => {
    if (editing) await updateVendor.mutateAsync({ id: editing._id, data })
    else await createVendor.mutateAsync(data)
    close()
  }

  const onDelete = async (id) => {
    if (confirm('Delete this vendor?')) await deleteVendor.mutateAsync(id)
  }

  if (isLoading) return <div className="flex-1 flex items-center justify-center"><span className="h-6 w-6 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {vendors.length === 0 ? (
        <EmptyState icon={Users} title="No vendors yet" description="Add vendors to use in purchase orders"
          action={<Button size="sm" onClick={openCreate}><Plus size={16} /> Add Vendor</Button>} />
      ) : (
        <>
          <DataTableMobileFilters columns={VENDOR_COLS} filters={filters} onFilterChange={setFilter} open={mobileFiltersOpen} />

          {/* Mobile cards */}
          <div className="flex flex-col gap-2 md:hidden">
            {filtered.map((v) => (
          <div key={v._id} className="bg-white rounded-2xl border border-zinc-200 p-4 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-semibold text-zinc-900 truncate">{v.name}</p>
              {v.contactPerson && <p className="text-sm text-zinc-500 truncate">{v.contactPerson}</p>}
              <div className="flex flex-wrap gap-x-3 mt-1">
                {v.phone && <span className="text-xs text-zinc-400">{v.phone}</span>}
                {v.email && <span className="text-xs text-zinc-400">{v.email}</span>}
                {v.gstin && <span className="text-xs text-zinc-400">GST: {v.gstin}</span>}
              </div>
            </div>
            <div className="flex gap-1 flex-shrink-0">
              <button onClick={() => openEdit(v)} className="p-2 rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 transition-colors"><Pencil size={15} /></button>
              <button onClick={() => onDelete(v._id)} className="p-2 rounded-lg hover:bg-red-50 text-zinc-400 hover:text-red-500 transition-colors"><Trash2 size={15} /></button>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop DataTable */}
      <DataTable
        columns={VENDOR_COLS}
        data={filtered}
        filters={filters}
        onFilterChange={setFilter}
        emptyMessage="No vendors match the filter"
        renderRow={(v) => (
          <tr key={v._id} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50 transition-colors">
            <td className="px-4 py-3 border-r border-zinc-100 text-sm font-medium text-zinc-900">{v.name}</td>
            <td className="px-4 py-3 border-r border-zinc-100 text-sm text-zinc-600">{v.contactPerson || '—'}</td>
            <td className="px-4 py-3 border-r border-zinc-100 text-sm text-zinc-600">{v.phone || '—'}</td>
            <td className="px-4 py-3 border-r border-zinc-100 text-sm text-zinc-600">{v.email || '—'}</td>
            <td className="px-4 py-3 border-r border-zinc-100 text-sm text-zinc-600">{v.gstin || '—'}</td>
            <td className="px-4 py-3">
              <div className="flex items-center gap-1.5 whitespace-nowrap">
                <button onClick={() => openEdit(v)} className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 active:bg-zinc-100" title="Edit"><Pencil size={14} /></button>
                <button onClick={() => onDelete(v._id)} className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 active:bg-zinc-100" title="Delete"><Trash2 size={14} /></button>
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
        title={editing ? 'Edit Vendor' : 'Add Vendor'}
        footer={
          <Button fullWidth loading={createVendor.isPending || updateVendor.isPending} onClick={handleSubmit(onSubmit)}>
            {editing ? 'Save Changes' : 'Add Vendor'}
          </Button>
        }
      >
        <div className="space-y-3">
          <Input label="Vendor Name *" {...register('name', { required: 'Required' })} error={errors.name?.message} placeholder="e.g. Sharma Traders" />
          <Input label="Contact Person" {...register('contactPerson')} placeholder="e.g. Rahul Sharma" />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Phone" {...register('phone')} placeholder="+91 98765 43210" />
            <Input label="Email" type="email" {...register('email')} placeholder="vendor@email.com" />
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

/* ─── Purchase Orders Tab ─────────────────────────────────────────────────── */
const PO_COLS = [
  { key: 'poNumber', label: 'PO #',    filterable: true, noDropdown: true, width: 'w-28' },
  { key: 'vendor',   label: 'Vendor',  filterable: true },
  { key: 'status',   label: 'Status',  filterable: true },
  { key: 'items',    label: 'Items',   width: 'w-16' },
  { key: 'total',    label: 'Total',   width: 'w-32' },
  { key: 'action',   label: 'action' },
]

function PurchaseOrdersTab({ mobileFiltersOpen, onAdd }) {
  const { data: orders = [], isLoading } = usePurchaseOrders()
  const { data: vendors = [] } = useVendors()
  const { data: products = [] } = useProducts()
  const createPO = useCreatePurchaseOrder()
  const updatePO = useUpdatePurchaseOrder()
  const deletePO = useDeletePurchaseOrder()
  const sendPO = useSendPurchaseOrder()
  const sym = useCurrencySymbol()
  const activeGroupId = useGroupStore((s) => s.activeGroupId)

  const [sheetOpen, setSheetOpen] = useState(false)
  const [statusSheet, setStatusSheet] = useState(null)
  const [sendSheet, setSendSheet] = useState(null) // PO object to send
  const [sendEmail, setSendEmail] = useState('')
  const [sendError, setSendError] = useState('')
  const [pdfLoading, setPdfLoading] = useState({})
  const [expanded, setExpanded] = useState({})
  const [filters, setFilters] = useState({ poNumber: '', vendor: '', status: '' })
  const [dropSel, setDropSel] = useState({})
  const [itemErrors, setItemErrors] = useState([])
  const toggleExpand = (id) => setExpanded((e) => ({ ...e, [id]: !e[id] }))

  const { register, handleSubmit, reset, watch, control, setValue, formState: { errors } } = useForm({
    defaultValues: { vendor: '', items: [{ product: '', description: '', qty: 1, unit: '', unitPrice: 0, taxRate: 0 }], expectedDate: '', notes: '' }
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
    reset({ vendor: '', items: [{ description: '', qty: 1, unitPrice: 0, taxRate: 0 }], expectedDate: '', notes: '' })
    setSheetOpen(true)
  }
  onAdd.current = openCreate

  const setFilter = (key, val) => setFilters((f) => ({ ...f, [key]: val }))
  const setDrop   = (key, vals) => setDropSel((p) => ({ ...p, [key]: vals }))
  const getDrop   = (key) => dropSel[key] || []
  const inDrop    = (key, val) => getDrop(key).length === 0 || getDrop(key).includes(val)

  const dropOpts = {
    status: [...new Set(orders.map((o) => o.status).filter(Boolean))],
    vendor: [...new Set(orders.map((o) => o.vendor?.name).filter(Boolean))],
  }

  const filtered = orders.filter((o) => {
    const vendorName = o.vendor?.name || ''
    return (
      (o.poNumber || '').toLowerCase().includes(filters.poNumber.toLowerCase()) &&
      vendorName.toLowerCase().includes(filters.vendor.toLowerCase()) && inDrop('vendor', vendorName) &&
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
    await createPO.mutateAsync({ ...data, items })
    setSheetOpen(false)
  }

  const onDelete = async (id) => { if (confirm('Delete this purchase order?')) await deletePO.mutateAsync(id) }
  const onStatusChange = async (s) => { await updatePO.mutateAsync({ id: statusSheet._id, data: { status: s } }); setStatusSheet(null) }

  const handlePDFAction = async (id, poNumber, disposition) => {
    setPdfLoading((p) => ({ ...p, [id]: true }))
    try {
      const res = await getPurchaseOrderPDF(id, activeGroupId, disposition)
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
      if (disposition === 'inline') {
        window.open(url, '_blank')
      } else {
        const a = document.createElement('a')
        a.href = url
        a.download = `${poNumber}.pdf`
        a.click()
      }
      setTimeout(() => URL.revokeObjectURL(url), 10000)
    } catch (e) {
      alert('Failed to generate PDF')
    } finally {
      setPdfLoading((p) => ({ ...p, [id]: false }))
    }
  }

  if (isLoading) return <div className="flex-1 flex items-center justify-center"><span className="h-6 w-6 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {orders.length === 0 ? (
        <EmptyState icon={ShoppingCart} title="No purchase orders" description="Create your first purchase order"
          action={<Button size="sm" onClick={openCreate}><Plus size={16} /> Create PO</Button>} />
      ) : (
        <>
          <DataTableMobileFilters columns={PO_COLS} filters={filters} onFilterChange={setFilter} dropOpts={dropOpts} dropSel={dropSel} onDropChange={setDrop} open={mobileFiltersOpen} />

          {/* Mobile cards */}
          <div className="flex flex-col gap-2 md:hidden">
            {filtered.map((o) => (
          <div key={o._id} className="bg-white rounded-2xl border border-zinc-200 p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-sm font-semibold text-zinc-900">{o.poNumber}</span>
                  <Badge variant={STATUS_VARIANT[o.status] || 'default'}>{o.status}</Badge>
                </div>
                <p className="text-sm text-zinc-600 mt-0.5">{o.vendor?.name || '—'}</p>
                {o.expectedDate && <p className="text-xs text-zinc-400 mt-0.5">Expected: {new Date(o.expectedDate).toLocaleDateString()}</p>}
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <span className="text-sm font-semibold text-zinc-900">{sym}{(o.grandTotal || 0).toFixed(2)}</span>
                <button onClick={() => o.status !== 'received' && setStatusSheet(o)} disabled={o.status === 'received'} className="p-2 rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent" title="Update status"><RefreshCw size={14} /></button>
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
        columns={PO_COLS}
        data={filtered}
        filters={filters}
        onFilterChange={setFilter}
        dropOpts={dropOpts}
        dropSel={dropSel}
        onDropChange={setDrop}
        emptyMessage="No purchase orders yet"
        leadingCol={true}
        renderRow={(o) => (
          <React.Fragment key={o._id}>
            <tr className="border-b border-zinc-100 hover:bg-zinc-50 transition-colors cursor-pointer" onClick={() => toggleExpand(o._id)}>
              <td className="px-3 py-3 border-r border-zinc-100 text-zinc-400">
                <ChevronDown size={14} className={`transition-transform ${expanded[o._id] ? '' : '-rotate-90'}`} />
              </td>
              <td className="px-4 py-3 border-r border-zinc-100 font-mono text-sm font-semibold text-zinc-900">{o.poNumber}</td>
              <td className="px-4 py-3 border-r border-zinc-100 text-sm text-zinc-700">{o.vendor?.name || '—'}</td>
              <td className="px-4 py-3 border-r border-zinc-100">
                <Badge variant={STATUS_VARIANT[o.status] || 'default'}>{o.status}</Badge>
              </td>
              <td className="px-4 py-3 border-r border-zinc-100 text-sm text-zinc-500 text-center">{o.items?.length || 0}</td>
              <td className="px-4 py-3 border-r border-zinc-100 text-sm font-semibold text-zinc-900">{sym}{(o.grandTotal || 0).toFixed(2)}</td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-1.5 whitespace-nowrap">
                  <button onClick={(e) => { e.stopPropagation(); setSendEmail(o.vendor?.email || ''); setSendError(''); setSendSheet(o) }} className="p-1.5 rounded-lg text-zinc-400 hover:text-blue-500 active:bg-zinc-100" title="Send to vendor"><Send size={14} /></button>
                  <button onClick={(e) => { e.stopPropagation(); if (o.status !== 'received') setStatusSheet(o) }} disabled={o.status === 'received'} className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 active:bg-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:text-zinc-400" title="Update status"><RefreshCw size={14} /></button>
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

      {/* Create PO Sheet — always mounted */}
      <BottomSheet
        open={sheetOpen} onClose={() => setSheetOpen(false)}
        title="Create Purchase Order"
        footer={<Button fullWidth loading={createPO.isPending} onClick={handleSubmit(onSubmit)}>Create PO</Button>}
      >
        <div className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700">Vendor *</label>
            <select {...register('vendor', { required: 'Vendor is required' })}
              className="h-11 w-full rounded-xl border border-zinc-300 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900">
              <option value="">Select vendor...</option>
              {vendors.map((v) => <option key={v._id} value={v._id}>{v.name}</option>)}
            </select>
            {errors.vendor && <p className="text-xs text-red-500">{errors.vendor.message}</p>}
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

          <Input label="Expected Date" type="date" {...register('expectedDate')} />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700">Notes</label>
            <textarea {...register('notes')} rows={2} placeholder="Optional notes..."
              className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 resize-none" />
          </div>
        </div>
      </BottomSheet>

      {/* Status Sheet */}
      <BottomSheet open={!!statusSheet} onClose={() => setStatusSheet(null)} title="Update Status">
        <div className="grid grid-cols-2 gap-2 pb-2">
          {['draft', 'sent', 'received', 'cancelled'].map((s) => (
            <button key={s} onClick={() => onStatusChange(s)}
              className={['py-3 rounded-xl text-sm font-medium capitalize border transition-colors',
                statusSheet?.status === s ? 'bg-zinc-900 text-white border-zinc-900' : 'border-zinc-200 text-zinc-700 hover:bg-zinc-50',
              ].join(' ')}>
              {s}
            </button>
          ))}
        </div>
      </BottomSheet>

      {/* Send PO Sheet */}
      <BottomSheet
        open={!!sendSheet}
        onClose={() => setSendSheet(null)}
        title={`Send ${sendSheet?.poNumber || 'PO'} to Vendor`}
        footer={
          <Button
            fullWidth
            loading={sendPO.isPending}
            onClick={async () => {
              setSendError('')
              try {
                await sendPO.mutateAsync({ id: sendSheet._id, recipientEmail: sendEmail })
                setSendSheet(null)
              } catch (e) {
                setSendError(e?.response?.data?.error || e?.response?.data?.message || 'Failed to send')
              }
            }}
          >
            <Send size={15} /> Send PO
          </Button>
        }
      >
        <div className="space-y-4">
          {/* PO summary */}
          <div className="bg-zinc-50 rounded-xl border border-zinc-200 p-4 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-zinc-500">PO Number</span>
              <span className="font-mono font-semibold text-zinc-900">{sendSheet?.poNumber}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-zinc-500">Vendor</span>
              <span className="font-semibold text-zinc-900">{sendSheet?.vendor?.name || '—'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-zinc-500">Grand Total</span>
              <span className="font-semibold text-zinc-900">{sym}{(sendSheet?.grandTotal || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-zinc-500">Items</span>
              <span className="text-zinc-700">{sendSheet?.items?.length || 0} line items</span>
            </div>
          </div>

          {/* Recipient email */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700">Recipient Email *</label>
            <input
              type="email"
              value={sendEmail}
              onChange={(e) => setSendEmail(e.target.value)}
              placeholder="vendor@example.com"
              className="h-11 w-full rounded-xl border border-zinc-300 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
            />
            {!sendSheet?.vendor?.email && (
              <p className="text-xs text-amber-600">This vendor has no email on file. Enter one above to send.</p>
            )}
          </div>

          {/* Preview / Download */}
          <div className="flex gap-2">
            <button
              onClick={() => handlePDFAction(sendSheet._id, sendSheet.poNumber, 'inline')}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-zinc-200 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
            >
              <Eye size={14} /> Preview PDF
            </button>
            <button
              onClick={() => handlePDFAction(sendSheet._id, sendSheet.poNumber, 'attachment')}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-zinc-200 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
            >
              <Download size={14} /> Download PDF
            </button>
          </div>

          <p className="text-xs text-zinc-400">A PDF of the purchase order will be attached and the PO status will be updated to <strong>Sent</strong>.</p>

          {sendError && <p className="text-sm text-red-500">{sendError}</p>}
        </div>
      </BottomSheet>
    </div>
  )
}

/* ─── GRN Tab ─────────────────────────────────────────────────────────────── */
const GRN_STATUS_VARIANT = { complete: 'success', partial: 'warning' }

const GRN_COLS = [
  { key: 'grnNumber',  label: 'GRN #',    filterable: true, noDropdown: true, width: 'w-28' },
  { key: 'po',         label: 'PO #',     filterable: true, noDropdown: true },
  { key: 'vendor',     label: 'Vendor',   filterable: true },
  { key: 'status',     label: 'Status',   filterable: true },
  { key: 'items',      label: 'Items',    width: 'w-16' },
  { key: 'date',       label: 'Date',     width: 'w-28' },
  { key: 'action',     label: 'action' },
]

function GRNTab({ mobileFiltersOpen, onAdd }) {
  const { data: grns = [], isLoading } = useGRNs()
  const { data: purchaseOrders = [] } = usePurchaseOrders()
  const createGRN = useCreateGRN()
  const deleteGRN = useDeleteGRN()
  const sym = useCurrencySymbol()

  const [sheetOpen, setSheetOpen] = useState(false)
  const [selectedPO, setSelectedPO] = useState('')
  const [grnItems, setGrnItems] = useState([])
  const [receivedDate, setReceivedDate] = useState('')
  const [notes, setNotes] = useState('')
  const [formError, setFormError] = useState('')
  const [expanded, setExpanded] = useState({})
  const [filters, setFilters] = useState({ grnNumber: '', po: '', vendor: '', status: '' })
  const [dropSel, setDropSel] = useState({})
  const toggleExpand = (id) => setExpanded((e) => ({ ...e, [id]: !e[id] }))

  // When PO changes, pre-populate items from the PO
  const handlePOChange = (poId) => {
    setSelectedPO(poId)
    const po = purchaseOrders.find((p) => p._id === poId)
    if (po?.items) {
      // Sum qty already received across all prior GRNs for this PO
      const priorGRNs = grns.filter((g) => (g.purchaseOrder?._id || g.purchaseOrder) === poId)
      const alreadyReceived = {}
      for (const g of priorGRNs) {
        for (const it of g.items) {
          const key = it.product?._id || it.product || it.description
          alreadyReceived[key] = (alreadyReceived[key] || 0) + (it.qtyReceived || 0)
        }
      }

      setGrnItems(po.items.map((it) => {
        const productKey = it.product?._id || it.product || ''
        const received = alreadyReceived[productKey] || 0
        const remaining = Math.max(0, (it.qty || 0) - received)
        return {
          product: productKey,
          description: it.description || it.product?.name || '',
          qtyOrdered: it.qty || 0,
          qtyReceived: remaining,
          unit: it.unit || it.product?.unit || '',
          unitPrice: it.unitPrice || 0,
        }
      }).filter((it) => it.qtyReceived > 0)) // hide fully received lines
    } else {
      setGrnItems([])
    }
  }

  const openCreate = () => {
    setSelectedPO('')
    setGrnItems([])
    setReceivedDate(new Date().toISOString().slice(0, 10))
    setNotes('')
    setFormError('')
    setSheetOpen(true)
  }
  onAdd.current = openCreate

  const handleSubmit = async () => {
    if (!selectedPO) return setFormError('Please select a purchase order')
    if (grnItems.length === 0) return setFormError('No items to receive')
    setFormError('')
    try {
      await createGRN.mutateAsync({
        purchaseOrder: selectedPO,
        items: grnItems,
        receivedDate,
        notes,
      })
      setSheetOpen(false)
    } catch (e) {
      setFormError(e?.response?.data?.error || e?.response?.data?.message || 'Failed to create GRN')
    }
  }

  const setFilter = (key, val) => setFilters((f) => ({ ...f, [key]: val }))
  const setDrop   = (key, vals) => setDropSel((p) => ({ ...p, [key]: vals }))
  const getDrop   = (key) => dropSel[key] || []
  const inDrop    = (key, val) => getDrop(key).length === 0 || getDrop(key).includes(val)

  const dropOpts = {
    status: [...new Set(grns.map((g) => g.status).filter(Boolean))],
    vendor: [...new Set(grns.map((g) => g.purchaseOrder?.vendor?.name).filter(Boolean))],
  }

  const filtered = grns.filter((g) => {
    const poNum = g.purchaseOrder?.poNumber || ''
    const vendorName = g.purchaseOrder?.vendor?.name || ''
    return (
      (g.grnNumber || '').toLowerCase().includes(filters.grnNumber.toLowerCase()) &&
      poNum.toLowerCase().includes(filters.po.toLowerCase()) &&
      vendorName.toLowerCase().includes(filters.vendor.toLowerCase()) && inDrop('vendor', vendorName) &&
      (g.status || '').includes(filters.status) && inDrop('status', g.status)
    )
  })

  const onDelete = async (id) => { if (confirm('Delete this GRN? Note: stock will not be reversed automatically.')) await deleteGRN.mutateAsync(id) }

  // Eligible POs: only those in sent / partial status (not yet fully received)
  const eligiblePOs = purchaseOrders.filter((p) => ['draft', 'sent', 'partial'].includes(p.status))

  if (isLoading) return <div className="flex-1 flex items-center justify-center"><span className="h-6 w-6 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {grns.length === 0 ? (
        <EmptyState icon={PackageCheck} title="No goods receipts yet" description="Record stock received against a purchase order"
          action={<Button size="sm" onClick={openCreate}><Plus size={16} /> Create GRN</Button>} />
      ) : (
        <>
          <DataTableMobileFilters columns={GRN_COLS} filters={filters} onFilterChange={setFilter} dropOpts={dropOpts} dropSel={dropSel} onDropChange={setDrop} open={mobileFiltersOpen} />

          {/* Mobile cards */}
          <div className="flex flex-col gap-2 md:hidden">
            {filtered.map((g) => (
              <div key={g._id} className="bg-white rounded-2xl border border-zinc-200 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-sm font-semibold text-zinc-900">{g.grnNumber}</span>
                      <Badge variant={GRN_STATUS_VARIANT[g.status] || 'default'}>{g.status}</Badge>
                    </div>
                    <p className="text-sm text-zinc-600 mt-0.5">PO: {g.purchaseOrder?.poNumber || '—'} · {g.purchaseOrder?.vendor?.name || '—'}</p>
                    {g.receivedDate && <p className="text-xs text-zinc-400 mt-0.5">{new Date(g.receivedDate).toLocaleDateString()}</p>}
                  </div>
                  <button onClick={() => onDelete(g._id)} className="p-2 rounded-lg hover:bg-red-50 text-zinc-400 hover:text-red-500 transition-colors flex-shrink-0"><Trash2 size={15} /></button>
                </div>
                {g.items?.length > 0 && (
                  <div className="mt-3 border-t border-zinc-100 pt-3 space-y-1">
                    {g.items.map((it, i) => (
                      <div key={i} className="flex justify-between text-xs text-zinc-500">
                        <span className="truncate max-w-[60%]">{it.description || it.product?.name || 'Item'}</span>
                        <span>{it.qtyReceived} / {it.qtyOrdered} {it.unit}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Desktop DataTable */}
          <DataTable
            columns={GRN_COLS}
            data={filtered}
            filters={filters}
            onFilterChange={setFilter}
            dropOpts={dropOpts}
            dropSel={dropSel}
            onDropChange={setDrop}
            emptyMessage="No GRNs match the filter"
            leadingCol={true}
            renderRow={(g) => (
              <React.Fragment key={g._id}>
                <tr className="border-b border-zinc-100 hover:bg-zinc-50 transition-colors cursor-pointer" onClick={() => toggleExpand(g._id)}>
                  <td className="px-3 py-3 border-r border-zinc-100 text-zinc-400">
                    <ChevronDown size={14} className={`transition-transform ${expanded[g._id] ? '' : '-rotate-90'}`} />
                  </td>
                  <td className="px-4 py-3 border-r border-zinc-100 font-mono text-sm font-semibold text-zinc-900">{g.grnNumber}</td>
                  <td className="px-4 py-3 border-r border-zinc-100 text-sm text-zinc-700">{g.purchaseOrder?.poNumber || '—'}</td>
                  <td className="px-4 py-3 border-r border-zinc-100 text-sm text-zinc-700">{g.purchaseOrder?.vendor?.name || '—'}</td>
                  <td className="px-4 py-3 border-r border-zinc-100"><Badge variant={GRN_STATUS_VARIANT[g.status] || 'default'}>{g.status}</Badge></td>
                  <td className="px-4 py-3 border-r border-zinc-100 text-sm text-zinc-500 text-center">{g.items?.length || 0}</td>
                  <td className="px-4 py-3 border-r border-zinc-100 text-sm text-zinc-500">{g.receivedDate ? new Date(g.receivedDate).toLocaleDateString() : '—'}</td>
                  <td className="px-4 py-3">
                    <button onClick={(e) => { e.stopPropagation(); onDelete(g._id) }} className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 active:bg-zinc-100" title="Delete"><Trash2 size={14} /></button>
                  </td>
                </tr>
                {expanded[g._id] && (
                  <tr className="border-b border-zinc-100 bg-zinc-50">
                    <td /><td colSpan={7} className="px-4 py-3">
                      <table className="w-full text-xs border-collapse rounded-xl overflow-hidden border border-zinc-200">
                        <thead>
                          <tr className="border-b border-zinc-200">
                            {['Product / Description', 'Qty Received', 'Qty Ordered', 'Unit Price', 'Unit'].map((h, i, arr) => (
                              <th key={h} className={`px-3 py-2 text-left text-xs font-semibold text-zinc-500 ${i < arr.length - 1 ? 'border-r border-zinc-200' : ''}`}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {(g.items || []).map((item, idx, arr) => (
                            <tr key={idx} className={idx < arr.length - 1 ? 'border-b border-zinc-100' : ''}>
                              <td className="px-3 py-2 border-r border-zinc-100 font-medium text-zinc-800">{item.product?.name || item.description || '—'}</td>
                              <td className="px-3 py-2 border-r border-zinc-100 text-zinc-600">{item.qtyReceived ?? '—'}</td>
                              <td className="px-3 py-2 border-r border-zinc-100 text-zinc-600">{item.qtyOrdered ?? '—'}</td>
                              <td className="px-3 py-2 border-r border-zinc-100 text-zinc-600">{item.unitPrice != null ? `${sym}${item.unitPrice.toFixed(2)}` : '—'}</td>
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

      {/* Create GRN Sheet */}
      <BottomSheet
        open={sheetOpen} onClose={() => setSheetOpen(false)}
        title="Create Goods Receipt (GRN)"
        footer={<Button fullWidth loading={createGRN.isPending} onClick={handleSubmit}>Record Receipt</Button>}
      >
        <div className="space-y-4">
          {/* PO selector */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700">Purchase Order *</label>
            <select value={selectedPO} onChange={(e) => handlePOChange(e.target.value)}
              className="h-11 w-full rounded-xl border border-zinc-300 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900">
              <option value="">Select PO...</option>
              {eligiblePOs.map((p) => (
                <option key={p._id} value={p._id}>{p.poNumber} — {p.vendor?.name || 'Unknown vendor'}</option>
              ))}
            </select>
          </div>

          {/* Items */}
          {grnItems.length > 0 && (
            <div>
              <label className="text-sm font-medium text-zinc-700 mb-2 block">Items Received</label>
              <div className="space-y-2">
                {grnItems.map((item, idx) => (
                  <div key={idx} className="border border-zinc-200 rounded-xl p-3 space-y-2">
                    <p className="text-sm font-medium text-zinc-800 truncate">{item.description || 'Item'}</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex flex-col gap-1">
                        <label className="text-xs text-zinc-500">Ordered</label>
                        <input readOnly value={item.qtyOrdered}
                          className="h-9 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-500 outline-none" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs text-zinc-500">Received *</label>
                        <input
                          type="number" min="0" max={item.qtyOrdered} step="0.01"
                          value={item.qtyReceived}
                          onChange={(e) => {
                            const updated = [...grnItems]
                            updated[idx] = { ...updated[idx], qtyReceived: parseFloat(e.target.value) || 0 }
                            setGrnItems(updated)
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

          <Input label="Received Date" type="date" value={receivedDate} onChange={(e) => setReceivedDate(e.target.value)} />
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

/* ─── Purchase Invoices Tab ───────────────────────────────────────────────── */
const PINV_STATUS_VARIANT = { draft: 'default', sent: 'warning', paid: 'success', overdue: 'danger', cancelled: 'danger' }

const PINV_COLS = [
  { key: 'invoiceNumber', label: 'Invoice #',  filterable: true, noDropdown: true, width: 'w-32' },
  { key: 'vendor',        label: 'Vendor',     filterable: true },
  { key: 'ref',           label: 'PO / GRN',   filterable: true, noDropdown: true },
  { key: 'status',        label: 'Status',     filterable: true },
  { key: 'total',         label: 'Total',      width: 'w-32' },
  { key: 'due',           label: 'Due Date',   width: 'w-28' },
  { key: 'action',        label: 'action' },
]

function PurchaseInvoicesTab({ mobileFiltersOpen, onAdd }) {
  const { data: invoices = [], isLoading } = usePurchaseInvoices()
  const { data: purchaseOrders = [] } = usePurchaseOrders()
  const { data: grns = [] } = useGRNs()
  const { data: vendors = [] } = useVendors()
  const createInvoice = useCreatePurchaseInvoice()
  const updateInvoice = useUpdatePurchaseInvoice()
  const deleteInvoice = useDeletePurchaseInvoice()
  const sym = useCurrencySymbol()

  const [sheetOpen, setSheetOpen] = useState(false)
  const [statusSheet, setStatusSheet] = useState(null)
  const [expanded, setExpanded] = useState({})
  const [sourceType, setSourceType] = useState('grn') // 'grn' | 'po' | 'manual'
  const [selectedSource, setSelectedSource] = useState('')
  const [vendorId, setVendorId] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [notes, setNotes] = useState('')
  const [formError, setFormError] = useState('')
  const [manualItems, setManualItems] = useState([{ description: '', qty: 1, unitPrice: 0, taxRate: 0 }])
  const addManualItem = () => setManualItems((p) => [...p, { description: '', qty: 1, unit: '', unitPrice: 0, taxRate: 0 }])
  const removeManualItem = (i) => setManualItems((p) => p.filter((_, idx) => idx !== i))
  const updateManualItem = (i, field, val) => setManualItems((p) => p.map((it, idx) => idx === i ? { ...it, [field]: val } : it))
  const [filters, setFilters] = useState({ invoiceNumber: '', vendor: '', ref: '', status: '' })
  const [dropSel, setDropSel] = useState({})

  const toggleExpand = (id) => setExpanded((e) => ({ ...e, [id]: !e[id] }))
  const setFilter = (key, val) => setFilters((f) => ({ ...f, [key]: val }))
  const setDrop   = (key, vals) => setDropSel((p) => ({ ...p, [key]: vals }))
  const getDrop   = (key) => dropSel[key] || []
  const inDrop    = (key, val) => getDrop(key).length === 0 || getDrop(key).includes(val)

  const dropOpts = {
    vendor: [...new Set(invoices.map((i) => i.vendor?.name).filter(Boolean))],
    status: ['draft', 'sent', 'paid', 'overdue', 'cancelled'],
  }

  const filtered = invoices.filter((inv) => {
    const vendorName = inv.vendor?.name || ''
    const ref = [inv.purchaseOrder?.poNumber, inv.grn?.grnNumber].filter(Boolean).join(' / ')
    return (
      (inv.invoiceNumber || '').toLowerCase().includes(filters.invoiceNumber.toLowerCase()) &&
      vendorName.toLowerCase().includes(filters.vendor.toLowerCase()) && inDrop('vendor', vendorName) &&
      ref.toLowerCase().includes(filters.ref.toLowerCase()) &&
      (filters.status === '' || inv.status === filters.status) && inDrop('status', inv.status)
    )
  })

  const openCreate = () => {
    setSourceType('grn')
    setSelectedSource('')
    setVendorId('')
    setDueDate('')
    setNotes('')
    setFormError('')
    setManualItems([{ description: '', qty: 1, unitPrice: 0, taxRate: 0 }])
    setSheetOpen(true)
  }
  onAdd.current = openCreate

  const handleSubmit = async () => {
    if (sourceType === 'manual') {
      if (!vendorId) return setFormError('Please select a vendor')
      if (manualItems.every((it) => !it.description)) return setFormError('Add at least one item')
    } else if (!selectedSource) {
      return setFormError(`Please select a ${sourceType === 'grn' ? 'GRN' : 'Purchase Order'}`)
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
        vendor: vendorId || undefined,
        grn:            sourceType === 'grn' ? selectedSource : undefined,
        purchaseOrder:  sourceType === 'po'  ? selectedSource : undefined,
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
        <EmptyState icon={FileText} title="No purchase invoices" description="Create invoices from a GRN or purchase order"
          action={<Button size="sm" onClick={openCreate}><Plus size={16} /> Create Invoice</Button>} />
      ) : (
        <>
          <DataTableMobileFilters columns={PINV_COLS} filters={filters} onFilterChange={setFilter} dropOpts={dropOpts} dropSel={dropSel} onDropChange={setDrop} open={mobileFiltersOpen} />

          {/* Mobile cards */}
          <div className="flex flex-col gap-2 md:hidden">
            {filtered.map((inv) => (
              <div key={inv._id} className="bg-white rounded-2xl border border-zinc-200 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-sm font-semibold text-zinc-900">{inv.invoiceNumber}</span>
                      <Badge variant={PINV_STATUS_VARIANT[inv.status] || 'default'}>{inv.status}</Badge>
                    </div>
                    <p className="text-sm text-zinc-600 mt-0.5">{inv.vendor?.name || '—'}</p>
                    {(inv.purchaseOrder || inv.grn) && (
                      <p className="text-xs text-zinc-400 mt-0.5">
                        {[inv.purchaseOrder?.poNumber, inv.grn?.grnNumber].filter(Boolean).join(' · ')}
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
            columns={PINV_COLS}
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
                  <td className="px-4 py-3 border-r border-zinc-100 text-sm text-zinc-700">{inv.vendor?.name || '—'}</td>
                  <td className="px-4 py-3 border-r border-zinc-100 text-xs text-zinc-500">
                    {[inv.purchaseOrder?.poNumber, inv.grn?.grnNumber].filter(Boolean).join(' / ') || '—'}
                  </td>
                  <td className="px-4 py-3 border-r border-zinc-100">
                    <Badge variant={PINV_STATUS_VARIANT[inv.status] || 'default'}>{inv.status}</Badge>
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
        title="Create Purchase Invoice"
        footer={<Button fullWidth loading={createInvoice.isPending} onClick={handleSubmit}>Create Invoice</Button>}
      >
        <div className="space-y-4">
          {/* Source type tabs */}
          <div className="flex gap-1 bg-zinc-100 rounded-xl p-0.5">
            {[['grn', 'From GRN'], ['po', 'From PO'], ['manual', 'Manual']].map(([k, label]) => (
              <button key={k} onClick={() => { setSourceType(k); setSelectedSource('') }}
                className={['flex-1 py-1.5 text-xs font-semibold rounded-[10px] transition-all',
                  sourceType === k ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-400'].join(' ')}>
                {label}
              </button>
            ))}
          </div>

          {sourceType === 'grn' && (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-zinc-700">GRN *</label>
              <select value={selectedSource} onChange={(e) => {
                setSelectedSource(e.target.value)
                const grn = grns.find((g) => g._id === e.target.value)
                if (grn?.purchaseOrder?.vendor) setVendorId(grn.purchaseOrder.vendor._id || grn.purchaseOrder.vendor)
              }}
                className="h-11 w-full rounded-xl border border-zinc-300 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900">
                <option value="">Select GRN...</option>
                {grns.map((g) => <option key={g._id} value={g._id}>{g.grnNumber} — {g.purchaseOrder?.vendor?.name || '?'}</option>)}
              </select>
            </div>
          )}

          {sourceType === 'po' && (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-zinc-700">Purchase Order *</label>
              <select value={selectedSource} onChange={(e) => {
                setSelectedSource(e.target.value)
                const po = purchaseOrders.find((p) => p._id === e.target.value)
                if (po?.vendor) setVendorId(po.vendor._id || po.vendor)
              }}
                className="h-11 w-full rounded-xl border border-zinc-300 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900">
                <option value="">Select PO...</option>
                {purchaseOrders.map((p) => <option key={p._id} value={p._id}>{p.poNumber} — {p.vendor?.name || '?'}</option>)}
              </select>
            </div>
          )}

          {sourceType === 'manual' && (
            <>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-zinc-700">Vendor *</label>
                <select value={vendorId} onChange={(e) => setVendorId(e.target.value)}
                  className="h-11 w-full rounded-xl border border-zinc-300 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900">
                  <option value="">Select vendor...</option>
                  {vendors.map((v) => <option key={v._id} value={v._id}>{v.name}</option>)}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-zinc-700">Items *</label>
                  <button type="button" onClick={addManualItem} className="text-xs font-medium text-zinc-600 flex items-center gap-1 hover:text-zinc-900 outline-none focus:outline-none">
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
export default function Purchases() {
  const [tab, setTab] = useState('po')
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const onAddRef = useRef(null)

  const hasFilters = ['po', 'grn', 'invoices', 'vendors'].includes(tab)
  const hasAdd     = ['po', 'grn', 'invoices', 'vendors'].includes(tab)

  const addBtn = tab === 'po'
    ? <Button size="sm" onClick={() => onAddRef.current?.()}><Plus size={16} /> Create PO</Button>
    : tab === 'grn'
    ? <Button size="sm" onClick={() => onAddRef.current?.()}><Plus size={16} /> Create GRN</Button>
    : tab === 'invoices'
    ? <Button size="sm" onClick={() => onAddRef.current?.()}><Plus size={16} /> Create Invoice</Button>
    : tab === 'vendors'
    ? <Button size="sm" onClick={() => onAddRef.current?.()}><Plus size={16} /> Add Vendor</Button>
    : null

  const renderTab = () => {
    switch (tab) {
      case 'po':       return <PurchaseOrdersTab mobileFiltersOpen={mobileFiltersOpen} onAdd={onAddRef} />
      case 'grn':      return <GRNTab mobileFiltersOpen={mobileFiltersOpen} onAdd={onAddRef} />
      case 'invoices': return <PurchaseInvoicesTab mobileFiltersOpen={mobileFiltersOpen} onAdd={onAddRef} />
      case 'vendors':  return <VendorsTab mobileFiltersOpen={mobileFiltersOpen} onAdd={onAddRef} />
      default:         return <ComingSoonTab />
    }
  }

  return (
    <>
      <TopBar
        title="Purchases"
        filterIcon={hasFilters && <DataTableFilterIcon open={mobileFiltersOpen} onChange={setMobileFiltersOpen} />}
        right={hasAdd && (
          <button onClick={() => onAddRef.current?.()} className="p-2 rounded-xl active:bg-zinc-100">
            <Plus size={20} />
          </button>
        )}
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
