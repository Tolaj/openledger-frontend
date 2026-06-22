import { useState, useRef } from 'react'
import { Construction, Plus, Pencil, Trash2, Users, ShoppingCart, Minus, PackageCheck, RefreshCw, ChevronDown, FileText, Mail, Eye, Download } from 'lucide-react'
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
import { useGRNs, useCreateGRN, useUpdateGRN, useDeleteGRN } from '../hooks/useGRNs'
import { usePurchaseInvoices, useCreatePurchaseInvoice, useUpdatePurchaseInvoice, useDeletePurchaseInvoice, useSendPurchaseInvoice } from '../hooks/usePurchaseInvoices'
import { getPurchaseInvoicePDF } from '../api/purchaseInvoices'
import { useProducts } from '../hooks/useProducts'
import { useCurrencySymbol } from '../hooks/useCurrency'
import ProductPicker from '../components/features/ProductPicker'
import Tabs from '../components/ui/Tabs'

const TABS = [
  { key: 'po',       label: 'Purchase Orders', mobileLabel: 'Purchase Order'      },
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

function VendorMobileCard({ v, onEdit, onDelete }) {
  const [isOpen, setIsOpen] = useState(false)
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.07)]">
      <div className="px-3 py-3 flex items-center gap-2.5">
        <div className="w-10 h-10 rounded-xl bg-zinc-900 flex items-center justify-center flex-shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-white">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0" onClick={() => setIsOpen((v) => !v)}>
          <p className="text-sm font-semibold text-zinc-900 truncate">{v.name}</p>
          <p className="text-xs text-zinc-400 mt-0.5">
            {v.contactPerson || v.phone || v.email || '—'}
          </p>
        </div>
        <div className="flex gap-0 flex-shrink-0">
          <button onClick={() => onEdit(v)} className="px-1 py-2 rounded-xl text-zinc-400 active:bg-zinc-100 hover:text-zinc-700">
            <Pencil size={17} />
          </button>
          <button onClick={() => onDelete(v._id)} className="px-1 py-2 rounded-xl text-zinc-400 active:bg-zinc-100 hover:text-red-500">
            <Trash2 size={17} />
          </button>
          <button onClick={() => setIsOpen((val) => !val)} className="px-1 py-2 rounded-xl text-zinc-400 active:bg-zinc-100">
            <ChevronDown size={17} className={`transition-transform ${isOpen ? '' : '-rotate-90'}`} />
          </button>
        </div>
      </div>
      {isOpen && (
        <div className="border-t border-zinc-100 divide-y divide-zinc-100">
          {v.contactPerson && (
            <div className="flex items-center px-4 py-2.5">
              <span className="text-xs text-zinc-400 w-24 flex-shrink-0">Contact</span>
              <span className="text-sm text-zinc-900">{v.contactPerson}</span>
            </div>
          )}
          {v.phone && (
            <div className="flex items-center px-4 py-2.5">
              <span className="text-xs text-zinc-400 w-24 flex-shrink-0">Phone</span>
              <span className="text-sm text-zinc-900">{v.phone}</span>
            </div>
          )}
          {v.email && (
            <div className="flex items-center px-4 py-2.5">
              <span className="text-xs text-zinc-400 w-24 flex-shrink-0">Email</span>
              <span className="text-sm text-zinc-900">{v.email}</span>
            </div>
          )}
          {v.gstin && (
            <div className="flex items-center px-4 py-2.5">
              <span className="text-xs text-zinc-400 w-24 flex-shrink-0">GSTIN</span>
              <span className="text-sm text-zinc-900">{v.gstin}</span>
            </div>
          )}
          {v.address && (
            <div className="flex items-center px-4 py-2.5">
              <span className="text-xs text-zinc-400 w-24 flex-shrink-0">Address</span>
              <span className="text-sm text-zinc-900">{v.address}</span>
            </div>
          )}
          {v.notes && (
            <div className="flex items-center px-4 py-2.5">
              <span className="text-xs text-zinc-400 w-24 flex-shrink-0">Notes</span>
              <span className="text-sm text-zinc-900">{v.notes}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

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
              <VendorMobileCard key={v._id} v={v} onEdit={openEdit} onDelete={onDelete} />
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
                <button onClick={() => openEdit(v)} className="p-2 rounded-lg text-zinc-400 hover:text-zinc-700 active:bg-zinc-100" title="Edit"><Pencil size={14} /></button>
                <button onClick={() => onDelete(v._id)} className="p-2 rounded-lg text-zinc-400 hover:text-red-500 active:bg-zinc-100" title="Delete"><Trash2 size={14} /></button>
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

function POMobileCard({ o, sym, onDelete, onStatusSheet, onSend, updatingId }) {
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
            <p className="text-sm font-semibold text-zinc-900 font-mono">{o.poNumber}</p>
            <Badge variant={STATUS_VARIANT[o.status] || 'default'}>{o.status}</Badge>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            {sym}{(o.grandTotal || 0).toFixed(2)}&nbsp;|&nbsp;{o.vendor?.name || '—'}
          </p>
        </div>
        <div className="flex gap-0 flex-shrink-0">
          <button onClick={() => onSend(o)} className="px-1 py-2 rounded-xl text-zinc-400 active:bg-zinc-100 hover:text-blue-500">
            <Mail size={17} />
          </button>
          <button onClick={() => o.status !== 'received' && onStatusSheet(o)} disabled={o.status === 'received' || updatingId === o._id} className="px-1 py-2 rounded-xl text-zinc-400 active:bg-zinc-100 hover:text-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed">
            {updatingId === o._id ? <span className="h-3.5 w-3.5 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin inline-block" /> : <RefreshCw size={17} />}
          </button>
          <button onClick={() => onDelete(o._id)} className="px-1 py-2 rounded-xl text-zinc-400 active:bg-zinc-100 hover:text-red-500">
            <Trash2 size={17} />
          </button>
          <button onClick={() => setIsOpen((v) => !v)} className="px-1 py-2 rounded-xl text-zinc-400 active:bg-zinc-100">
            <ChevronDown size={17} className={`transition-transform ${isOpen ? '' : '-rotate-90'}`} />
          </button>
        </div>
      </div>
      {isOpen && (
        <div className="border-t border-zinc-100 divide-y divide-zinc-100">
          {o.vendor?.name && (
            <div className="flex items-center px-4 py-2.5">
              <span className="text-xs text-zinc-400 w-24 flex-shrink-0">Vendor</span>
              <span className="text-sm text-zinc-900">{o.vendor.name}</span>
            </div>
          )}
          <div className="flex items-center px-4 py-2.5">
            <span className="text-xs text-zinc-400 w-24 flex-shrink-0">Total</span>
            <span className="text-sm font-semibold text-zinc-900">{sym}{(o.grandTotal || 0).toFixed(2)}</span>
          </div>
          {o.expectedDate && (
            <div className="flex items-center px-4 py-2.5">
              <span className="text-xs text-zinc-400 w-24 flex-shrink-0">Expected</span>
              <span className="text-sm text-zinc-900">{new Date(o.expectedDate).toLocaleDateString()}</span>
            </div>
          )}
          {o.notes && (
            <div className="flex items-center px-4 py-2.5">
              <span className="text-xs text-zinc-400 w-24 flex-shrink-0">Notes</span>
              <span className="text-sm text-zinc-900">{o.notes}</span>
            </div>
          )}
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
  const [updatingId, setUpdatingId] = useState(null)
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
  const onStatusChange = async (s) => { const id = statusSheet._id; setStatusSheet(null); setUpdatingId(id); try { await updatePO.mutateAsync({ id, data: { status: s } }) } finally { setUpdatingId(null) } }

  const handlePDFAction = async (id, poNumber, disposition) => {
    const key = `${id}-${disposition}`
    setPdfLoading((p) => ({ ...p, [key]: true }))
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
      setPdfLoading((p) => ({ ...p, [key]: false }))
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
              <POMobileCard key={o._id} o={o} sym={sym} onDelete={onDelete} onStatusSheet={setStatusSheet} onSend={(o) => { setSendEmail(o.vendor?.email || ''); setSendError(''); setSendSheet(o) }} updatingId={updatingId} />
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
                  <button onClick={(e) => { e.stopPropagation(); setSendEmail(o.vendor?.email || ''); setSendError(''); setSendSheet(o) }} className="p-2 rounded-lg text-zinc-400 hover:text-blue-500 active:bg-zinc-100" title="Send to vendor"><Mail size={14} /></button>
                  <button onClick={(e) => { e.stopPropagation(); if (o.status !== 'received') setStatusSheet(o) }} disabled={o.status === 'received' || updatingId === o._id} className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 active:bg-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:text-zinc-400" title="Update status">{updatingId === o._id ? <span className="h-3.5 w-3.5 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin inline-block" /> : <RefreshCw size={14} />}</button>
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
            <Mail size={15} /> Send PO
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
              disabled={pdfLoading[`${sendSheet?._id}-inline`]}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-zinc-200 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors disabled:opacity-50"
            >
              {pdfLoading[`${sendSheet?._id}-inline`] ? <span className="block w-3.5 h-3.5 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" /> : <Eye size={14} />} Preview PDF
            </button>
            <button
              onClick={() => handlePDFAction(sendSheet._id, sendSheet.poNumber, 'attachment')}
              disabled={pdfLoading[`${sendSheet?._id}-attachment`]}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-zinc-200 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors disabled:opacity-50"
            >
              {pdfLoading[`${sendSheet?._id}-attachment`] ? <span className="block w-3.5 h-3.5 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" /> : <Download size={14} />} Download PDF
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

function GRNMobileCard({ g, sym, onDelete, onStatusSheet, updatingId }) {
  const [isOpen, setIsOpen] = useState(false)
  const [itemsOpen, setItemsOpen] = useState(false)
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.07)]">
      <div className="px-3 py-3 flex items-center gap-2.5">
        <div className="w-10 h-10 rounded-xl bg-zinc-900 flex items-center justify-center flex-shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-white">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.35 3.836c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m8.9-4.414c.376.023.75.05 1.124.08 1.131.094 1.976 1.057 1.976 2.192V16.5A2.25 2.25 0 0 1 18 18.75h-2.25m-7.5-10.5H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V18.75m-7.5-10.5h6.375c.621 0 1.125.504 1.125 1.125v9.375m-8.25-3 1.5 1.5 3-3.75" />
          </svg>
        </div>
        <div className="flex-1 min-w-0" onClick={() => setIsOpen((v) => !v)}>
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="text-sm font-semibold text-zinc-900 font-mono">{g.grnNumber}</p>
            <Badge variant={GRN_STATUS_VARIANT[g.status] || 'default'}>{g.status}</Badge>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            {g.purchaseOrder?.poNumber || '—'}&nbsp;·&nbsp;{g.purchaseOrder?.vendor?.name || '—'}
          </p>
        </div>
        <div className="flex gap-0 flex-shrink-0">
          <button onClick={() => g.status !== 'complete' && onStatusSheet(g)} disabled={g.status === 'complete' || updatingId === g._id} className="px-1 py-2 rounded-xl text-zinc-400 active:bg-zinc-100 hover:text-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed">
            {updatingId === g._id ? <span className="h-3.5 w-3.5 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin inline-block" /> : <RefreshCw size={17} />}
          </button>
          <button onClick={() => onDelete(g._id)} className="px-1 py-2 rounded-xl text-zinc-400 active:bg-zinc-100 hover:text-red-500">
            <Trash2 size={17} />
          </button>
          <button onClick={() => setIsOpen((v) => !v)} className="px-1 py-2 rounded-xl text-zinc-400 active:bg-zinc-100">
            <ChevronDown size={17} className={`transition-transform ${isOpen ? '' : '-rotate-90'}`} />
          </button>
        </div>
      </div>
      {isOpen && (
        <div className="border-t border-zinc-100 divide-y divide-zinc-100">
          {g.purchaseOrder?.poNumber && (
            <div className="flex items-center px-4 py-2.5">
              <span className="text-xs text-zinc-400 w-24 flex-shrink-0">PO</span>
              <span className="text-sm text-zinc-900">{g.purchaseOrder.poNumber}</span>
            </div>
          )}
          {g.purchaseOrder?.vendor?.name && (
            <div className="flex items-center px-4 py-2.5">
              <span className="text-xs text-zinc-400 w-24 flex-shrink-0">Vendor</span>
              <span className="text-sm text-zinc-900">{g.purchaseOrder.vendor.name}</span>
            </div>
          )}
          {g.receivedDate && (
            <div className="flex items-center px-4 py-2.5">
              <span className="text-xs text-zinc-400 w-24 flex-shrink-0">Received</span>
              <span className="text-sm text-zinc-900">{new Date(g.receivedDate).toLocaleDateString()}</span>
            </div>
          )}
          {g.notes && (
            <div className="flex items-center px-4 py-2.5">
              <span className="text-xs text-zinc-400 w-24 flex-shrink-0">Notes</span>
              <span className="text-sm text-zinc-900">{g.notes}</span>
            </div>
          )}
          <div className="px-4 py-2.5">
            <button onClick={() => setItemsOpen((v) => !v)} className="w-full flex items-center justify-between">
              <span className="text-xs text-zinc-400">items ({g.items?.length ?? 0})</span>
              <ChevronDown size={14} className={`text-zinc-400 transition-transform ${itemsOpen ? '' : '-rotate-90'}`} />
            </button>
            {itemsOpen && (
              <div className="mt-2 rounded-xl border border-zinc-100 overflow-hidden">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-100 bg-zinc-50">
                      {['Product', 'Received', 'Ordered', 'Unit'].map((h, i, arr) => (
                        <th key={h} className={`px-2 py-1.5 text-left font-semibold text-zinc-500 ${i < arr.length - 1 ? 'border-r border-zinc-100' : ''}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(g.items || []).map((it, idx, arr) => (
                      <tr key={idx} className={idx < arr.length - 1 ? 'border-b border-zinc-100' : ''}>
                        <td className="px-2 py-1.5 border-r border-zinc-100 text-zinc-800 font-medium">{it.product?.name || it.description || '—'}</td>
                        <td className="px-2 py-1.5 border-r border-zinc-100 text-zinc-600">{it.qtyReceived}</td>
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

function GRNTab({ mobileFiltersOpen, onAdd }) {
  const { data: grns = [], isLoading } = useGRNs()
  const { data: purchaseOrders = [] } = usePurchaseOrders()
  const createGRN = useCreateGRN()
  const updateGRN = useUpdateGRN()
  const deleteGRN = useDeleteGRN()
  const sym = useCurrencySymbol()

  const [sheetOpen, setSheetOpen] = useState(false)
  const [selectedPO, setSelectedPO] = useState('')
  const [grnItems, setGrnItems] = useState([])
  const [receivedDate, setReceivedDate] = useState('')
  const [notes, setNotes] = useState('')
  const [formError, setFormError] = useState('')
  const [expanded, setExpanded] = useState({})
  const [grnStatusSheet, setGrnStatusSheet] = useState(null)
  const [grnUpdatingId, setGrnUpdatingId] = useState(null)
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
              <GRNMobileCard key={g._id} g={g} sym={sym} onDelete={onDelete} onStatusSheet={setGrnStatusSheet} updatingId={grnUpdatingId} />
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
                    <div className="flex items-center gap-1">
                      <button onClick={(e) => { e.stopPropagation(); onDelete(g._id) }} className="p-2 rounded-lg text-zinc-400 hover:text-red-500 active:bg-zinc-100" title="Delete"><Trash2 size={14} /></button>
                    </div>
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

      {/* GRN Status Sheet */}
      <BottomSheet open={!!grnStatusSheet} onClose={() => setGrnStatusSheet(null)} title="Update GRN Status">
        <div className="space-y-2 pb-2">
          {['partial', 'complete'].map((s) => (
            <button key={s} onClick={async () => { const id = grnStatusSheet._id; setGrnStatusSheet(null); setGrnUpdatingId(id); try { await updateGRN.mutateAsync({ id, data: { status: s } }) } finally { setGrnUpdatingId(null) } }}
              className={['w-full py-3 rounded-xl border text-sm font-semibold capitalize transition-all',
                grnStatusSheet?.status === s ? 'bg-zinc-900 text-white border-zinc-900' : 'border-zinc-200 text-zinc-700 hover:bg-zinc-50'].join(' ')}>
              {s}
            </button>
          ))}
          <p className="text-xs text-zinc-400 text-center pt-1">Marking complete will update all GRNs for this PO to complete.</p>
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

function PInvoiceMobileCard({ inv, sym, getRef, onDelete, onStatusSheet, onSend, updatingId }) {
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
            <Badge variant={PINV_STATUS_VARIANT[inv.status] || 'default'}>{inv.status}</Badge>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            {sym}{(inv.grandTotal || 0).toFixed(2)}&nbsp;|&nbsp;{inv.vendor?.name || '—'}
          </p>
        </div>
        <div className="flex gap-0 flex-shrink-0">
          <button onClick={() => onSend(inv)} className="px-1 py-2 rounded-xl text-zinc-400 active:bg-zinc-100 hover:text-blue-500">
            <Mail size={17} />
          </button>
          <button onClick={() => inv.status !== 'paid' && onStatusSheet(inv)} disabled={inv.status === 'paid' || updatingId === inv._id} className="px-1 py-2 rounded-xl text-zinc-400 active:bg-zinc-100 hover:text-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed">
            {updatingId === inv._id ? <span className="h-3.5 w-3.5 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin inline-block" /> : <RefreshCw size={17} />}
          </button>
          <button onClick={() => onDelete(inv._id)} className="px-1 py-2 rounded-xl text-zinc-400 active:bg-zinc-100 hover:text-red-500">
            <Trash2 size={17} />
          </button>
          <button onClick={() => setIsOpen((v) => !v)} className="px-1 py-2 rounded-xl text-zinc-400 active:bg-zinc-100">
            <ChevronDown size={17} className={`transition-transform ${isOpen ? '' : '-rotate-90'}`} />
          </button>
        </div>
      </div>
      {isOpen && (
        <div className="border-t border-zinc-100 divide-y divide-zinc-100">
          {inv.vendor?.name && (
            <div className="flex items-center px-4 py-2.5">
              <span className="text-xs text-zinc-400 w-24 flex-shrink-0">Vendor</span>
              <span className="text-sm text-zinc-900">{inv.vendor.name}</span>
            </div>
          )}
          {(inv.purchaseOrder || inv.grn) && (
            <div className="flex items-center px-4 py-2.5">
              <span className="text-xs text-zinc-400 w-24 flex-shrink-0">Ref</span>
              <span className="text-sm text-zinc-900">{getRef(inv)}</span>
            </div>
          )}
          <div className="flex items-center px-4 py-2.5">
            <span className="text-xs text-zinc-400 w-24 flex-shrink-0">Subtotal</span>
            <span className="text-sm text-zinc-900">{sym}{(inv.subtotal || 0).toFixed(2)}</span>
          </div>
          <div className="flex items-center px-4 py-2.5">
            <span className="text-xs text-zinc-400 w-24 flex-shrink-0">Tax</span>
            <span className="text-sm text-zinc-900">{sym}{(inv.taxAmount || 0).toFixed(2)}</span>
          </div>
          <div className="flex items-center px-4 py-2.5">
            <span className="text-xs text-zinc-400 w-24 flex-shrink-0">Total</span>
            <span className="text-sm font-semibold text-zinc-900">{sym}{(inv.grandTotal || 0).toFixed(2)}</span>
          </div>
          {inv.dueDate && (
            <div className="flex items-center px-4 py-2.5">
              <span className="text-xs text-zinc-400 w-24 flex-shrink-0">Due</span>
              <span className="text-sm text-zinc-900">{new Date(inv.dueDate).toLocaleDateString()}</span>
            </div>
          )}
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

function PurchaseInvoicesTab({ mobileFiltersOpen, onAdd }) {
  const { data: invoices = [], isLoading } = usePurchaseInvoices()
  const { data: purchaseOrders = [] } = usePurchaseOrders()
  const { data: grns = [] } = useGRNs()
  const { data: vendors = [] } = useVendors()
  const createInvoice = useCreatePurchaseInvoice()
  const updateInvoice = useUpdatePurchaseInvoice()
  const deleteInvoice = useDeletePurchaseInvoice()
  const sendInvoice   = useSendPurchaseInvoice()
  const sym = useCurrencySymbol()
  const activeGroupId = useGroupStore((s) => s.activeGroupId)

  const [sheetOpen, setSheetOpen] = useState(false)
  const [statusSheet, setStatusSheet] = useState(null)
  const [invUpdatingId, setInvUpdatingId] = useState(null)
  const [sendSheet, setSendSheet]   = useState(null)
  const [sendEmail, setSendEmail]   = useState('')
  const [sendError, setSendError]   = useState('')
  const [pdfLoading, setPdfLoading] = useState({})

  const handlePDFAction = async (id, invoiceNumber, disposition) => {
    const key = `${id}-${disposition}`
    setPdfLoading((p) => ({ ...p, [key]: true }))
    try {
      const res = await getPurchaseInvoicePDF(id, activeGroupId, disposition)
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
      if (disposition === 'inline') { window.open(url, '_blank') }
      else { const a = document.createElement('a'); a.href = url; a.download = `${invoiceNumber}.pdf`; a.click() }
      setTimeout(() => URL.revokeObjectURL(url), 10000)
    } catch { alert('Failed to generate PDF') }
    finally { setPdfLoading((p) => ({ ...p, [key]: false })) }
  }
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

  // Build PO/GRN ref string
  const getInvoiceRef = (inv) => {
    const poNumber = inv.purchaseOrder?.poNumber
    // Created via GRN → show single GRN as before
    if (inv.grn) return [poNumber, inv.grn?.grnNumber].filter(Boolean).join(' / ') || '—'
    // Created via PO → show all GRNs under that PO
    if (!poNumber) return '—'
    const poId = inv.purchaseOrder?._id || inv.purchaseOrder
    const linkedGrns = grns.filter((g) => (g.purchaseOrder?._id || g.purchaseOrder) === poId)
    if (linkedGrns.length === 0) return poNumber
    if (linkedGrns.length === 1) return `${poNumber} / ${linkedGrns[0].grnNumber}`
    const prefix = linkedGrns[0].grnNumber.replace(/\d+$/, '')
    const nums = linkedGrns.map((g) => g.grnNumber.replace(/\D/g, ''))
    return `${poNumber} / ${prefix}${nums.join(', ')}`
  }

  const dropOpts = {
    vendor: [...new Set(invoices.map((i) => i.vendor?.name).filter(Boolean))],
    status: ['draft', 'sent', 'paid', 'overdue', 'cancelled'],
  }

  const filtered = invoices.filter((inv) => {
    const vendorName = inv.vendor?.name || ''
    const ref = getInvoiceRef(inv)
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
    const id = statusSheet._id; setStatusSheet(null); setInvUpdatingId(id)
    try { await updateInvoice.mutateAsync({ id, data: { status: s } }) } finally { setInvUpdatingId(null) }
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
              <PInvoiceMobileCard key={inv._id} inv={inv} sym={sym} getRef={getInvoiceRef} onDelete={onDelete} onStatusSheet={setStatusSheet} onSend={(inv) => { setSendEmail(inv.vendor?.email || ''); setSendError(''); setSendSheet(inv) }} updatingId={invUpdatingId} />
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
                    {getInvoiceRef(inv)}
                  </td>
                  <td className="px-4 py-3 border-r border-zinc-100">
                    <Badge variant={PINV_STATUS_VARIANT[inv.status] || 'default'}>{inv.status}</Badge>
                  </td>
                  <td className="px-4 py-3 border-r border-zinc-100 text-sm font-semibold text-zinc-900">{sym}{(inv.grandTotal || 0).toFixed(2)}</td>
                  <td className="px-4 py-3 border-r border-zinc-100 text-sm text-zinc-500">{inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 whitespace-nowrap">
                      <button onClick={(e) => { e.stopPropagation(); setSendEmail(inv.vendor?.email || ''); setSendError(''); setSendSheet(inv) }} className="p-2 rounded-lg text-zinc-400 hover:text-blue-500 active:bg-zinc-100" title="Send invoice"><Mail size={14} /></button>
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

          {sourceType === 'grn' && (() => {
            // POs that already have a direct (non-GRN) invoice are fully covered — hide their GRNs too
            const directlyInvoicedPoIds = new Set(
              invoices
                .filter((inv) => (inv.purchaseOrder?._id || inv.purchaseOrder) && !inv.grn)
                .map((inv) => inv.purchaseOrder?._id || inv.purchaseOrder)
            )
            const availableGrns = grns.filter((g) => {
              if (invoices.some((inv) => inv.grn?._id === g._id || inv.grn === g._id)) return false
              const poId = g.purchaseOrder?._id || g.purchaseOrder
              if (poId && directlyInvoicedPoIds.has(poId)) return false
              return true
            })
            return (
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-zinc-700">GRN *</label>
                <select value={selectedSource} onChange={(e) => {
                  setSelectedSource(e.target.value)
                  const grn = grns.find((g) => g._id === e.target.value)
                  if (grn?.purchaseOrder?.vendor) setVendorId(grn.purchaseOrder.vendor._id || grn.purchaseOrder.vendor)
                }}
                  className="h-11 w-full rounded-xl border border-zinc-300 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900">
                  <option value="">Select GRN...</option>
                  {availableGrns.map((g) => <option key={g._id} value={g._id}>{g.grnNumber} — {g.purchaseOrder?.poNumber || '?'} · {g.purchaseOrder?.vendor?.name || '?'}</option>)}
                </select>
                {availableGrns.length === 0 && (
                  <p className="text-xs text-zinc-500 bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2">
                    All GRNs have been invoiced already.
                  </p>
                )}
              </div>
            )
          })()}

          {sourceType === 'po' && (() => {
            // Only hide POs that already have a direct (non-GRN) invoice — those are fully covered
            const availablePos = purchaseOrders.filter((p) =>
              p.status !== 'partial' &&
              !invoices.some((inv) => inv.purchaseOrder?._id === p._id || inv.purchaseOrder === p._id)
            )
            const selectedPoGrnInvoiceCount = selectedSource
              ? invoices.filter((inv) => (inv.purchaseOrder?._id === selectedSource || inv.purchaseOrder === selectedSource) && inv.grn).length
              : 0
            return (
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-zinc-700">Purchase Order *</label>
                <select value={selectedSource} onChange={(e) => {
                  setSelectedSource(e.target.value)
                  const po = purchaseOrders.find((pp) => pp._id === e.target.value)
                  if (po?.vendor) setVendorId(po.vendor._id || po.vendor)
                }}
                  className="h-11 w-full rounded-xl border border-zinc-300 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900">
                  <option value="">Select PO...</option>
                  {availablePos.map((p) => <option key={p._id} value={p._id}>{p.poNumber} — {p.vendor?.name || '?'}</option>)}
                </select>
                {availablePos.length === 0 && (
                  <p className="text-xs text-zinc-500 bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2">
                    All purchase orders have been invoiced already.
                  </p>
                )}
              </div>
            )
          })()}

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

      {/* Send Invoice Sheet */}
      <BottomSheet open={!!sendSheet} onClose={() => setSendSheet(null)} title={`Send ${sendSheet?.invoiceNumber || 'Invoice'} to Vendor`}>
        <div className="flex flex-col gap-4 pb-2">
          <div className="bg-zinc-50 rounded-2xl p-4 flex flex-col gap-2">
            <div className="flex justify-between text-sm"><span className="text-zinc-500">Invoice #</span><span className="font-mono font-semibold text-zinc-900">{sendSheet?.invoiceNumber}</span></div>
            <div className="flex justify-between text-sm"><span className="text-zinc-500">Vendor</span><span className="font-semibold text-zinc-900">{sendSheet?.vendor?.name || '—'}</span></div>
            <div className="flex justify-between text-sm"><span className="text-zinc-500">Grand Total</span><span className="font-semibold text-zinc-900">{sym}{(sendSheet?.grandTotal || 0).toFixed(2)}</span></div>
            {sendSheet?.dueDate && <div className="flex justify-between text-sm"><span className="text-zinc-500">Due Date</span><span className="text-zinc-700">{new Date(sendSheet.dueDate).toLocaleDateString()}</span></div>}
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700">Vendor Email</label>
            <input value={sendEmail} onChange={(e) => setSendEmail(e.target.value)} type="email" placeholder="vendor@email.com"
              className="h-11 px-3 rounded-xl border border-zinc-300 bg-white text-sm outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900" />
          </div>
          {!sendSheet?.vendor?.email && <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">Vendor has no saved email. Enter one above to send.</p>}
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
          <button
            disabled={!sendEmail || sendInvoice.isPending}
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
          <button onClick={() => onAddRef.current?.()} className="w-9 h-9 flex items-center justify-center rounded-full bg-zinc-900 text-white active:bg-zinc-700 transition-colors">
            <Plus size={20} />
          </button>
        )}
      />

      <div className="px-4 pt-0 pb-4 md:px-0 md:py-0 md:pb-4 md:flex md:flex-col md:flex-1 md:min-h-0">
        <div className="flex items-center gap-3 flex-shrink-0 py-2 md:py-0 md:mb-4 md:justify-between">
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
