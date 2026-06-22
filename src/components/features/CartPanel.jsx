import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X, Trash2, ShoppingCart, Check, ChevronDown } from 'lucide-react'
import useCartStore from '../../store/cartStore'
import { useCurrencySymbol } from '../../hooks/useCurrency'
import useGroupStore from '../../store/groupStore'
import useAuthStore from '../../store/authStore'
import { useGroup } from '../../hooks/useGroups'
import { useCreateOrder } from '../../hooks/useOrders'
import { useCreateWishlist } from '../../hooks/useWishlists'
import { useCreateInventory } from '../../hooks/useInventory'
import { useCreatePurchaseOrder } from '../../hooks/usePurchaseOrders'
import { useCreateSalesOrder } from '../../hooks/useSalesOrders'
import { useCreateGeneralOrder } from '../../hooks/useGeneralOrders'
import { useVendors } from '../../hooks/useVendors'
import { useCustomers } from '../../hooks/useCustomers'
import { useRecipients } from '../../hooks/useRecipients'
import { useIsBusiness } from '../../hooks/useActiveGroupType'
import Button from '../ui/Button'

// ── InlineNumber ──────────────────────────────────────────────────────────────
function InlineNumber({ value, onCommit, format = (v) => v }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const inputRef = useRef(null)

  const startEdit = () => { setDraft(String(value)); setEditing(true); setTimeout(() => inputRef.current?.select(), 0) }
  const commit = () => { const n = parseFloat(draft); if (!isNaN(n) && n >= 0) onCommit(n); setEditing(false) }

  if (editing) {
    return (
      <input ref={inputRef} value={draft} onChange={(e) => setDraft(e.target.value)}
        onBlur={commit} onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false) }}
        className="w-14 text-center text-xs font-semibold text-zinc-900 border border-zinc-900 rounded-lg px-1 py-0.5 outline-none"
      />
    )
  }
  return (
    <span onClick={startEdit}
      className="w-14 text-center text-xs font-semibold text-zinc-900 cursor-text select-none rounded-lg px-1 py-0.5 hover:bg-zinc-100 transition-colors">
      {format(value)}
    </span>
  )
}

// ── SplitDropdown (personal only) ─────────────────────────────────────────────
function SplitDropdown({ value, splitAmong, members, onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const h = (e) => { if (!ref.current?.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])

  const toggleMember = (id) => {
    const next = splitAmong.includes(id) ? splitAmong.filter((m) => m !== id) : [...splitAmong, id]
    if (next.length > 0) onChange({ splitType: value, splitAmong: next })
  }

  const allSelected = members.length > 0 && members.every((m) => splitAmong.includes(String(m._id)))
  const label = allSelected ? 'Even' : 'Uneven'

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-900 text-white text-xs font-semibold whitespace-nowrap">
        {label}
        <ChevronDown size={11} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 bg-white border border-zinc-200 rounded-xl shadow-xl z-50 min-w-[140px] py-1">
          {members.map((m) => (
            <button key={m._id} onClick={() => toggleMember(String(m._id))}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-zinc-700 hover:bg-zinc-50">
              <span className={['w-4 h-4 rounded flex items-center justify-center border flex-shrink-0',
                splitAmong.includes(String(m._id)) ? 'bg-zinc-900 border-zinc-900' : 'border-zinc-300'].join(' ')}>
                {splitAmong.includes(String(m._id)) && <Check size={9} className="text-white" />}
              </span>
              {m.name || m.email}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── PersonalCartItem (with Split Among, no Tax) ───────────────────────────────
function PersonalCartItem({ item, members, onUpdateQty, onUpdatePrice, onUpdateSplit, onRemove, sym }) {
  const lineTotal = (item._price * item.quantity).toFixed(2)
  const iconBg = item.category?.color?.startsWith('#') ? `${item.category.color}22` : '#f4f4f5'

  return (
    <div className="flex gap-3 py-3.5 border-b border-zinc-100 last:border-0">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0 mt-0.5" style={{ backgroundColor: iconBg }}>
        {item.category?.icon || '📦'}
      </div>

      <div className="flex-1 min-w-0">
        {/* Name + total */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-zinc-900 truncate leading-tight">{item.name}</p>
            <p className="text-xs text-zinc-400 mt-0.5">
              {[item.category?.name, item.unit].filter(Boolean).join(' · ')}
            </p>
          </div>
          <p className="text-sm font-bold text-zinc-900 whitespace-nowrap flex-shrink-0">{sym}{lineTotal}</p>
        </div>

        {/* Compact controls */}
        <div className="flex flex-col gap-1.5">
          {/* Row 1: Price + Split */}
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-zinc-400 w-8 flex-shrink-0">Price</span>
            <div className="flex items-center gap-1">
              <button onClick={() => onUpdatePrice(item._cartId, item._price - 0.05)}
                className="w-4 h-4 md:w-5 md:h-5 rounded-md bg-zinc-900 text-white flex items-center justify-center text-[9px] md:text-[10px] font-bold leading-none flex-shrink-0">−</button>
              <InlineNumber value={item._price} onCommit={(v) => onUpdatePrice(item._cartId, v)} format={(v) => v.toFixed(2)} />
              <button onClick={() => onUpdatePrice(item._cartId, item._price + 0.05)}
                className="w-4 h-4 md:w-5 md:h-5 rounded-md bg-zinc-900 text-white flex items-center justify-center text-[9px] md:text-[10px] font-bold leading-none flex-shrink-0">+</button>
            </div>
            <span className="text-[11px] text-zinc-400 flex-shrink-0">Split</span>
            <SplitDropdown value={item._splitType} splitAmong={item._splitAmong} members={members} onChange={(s) => onUpdateSplit(item._cartId, s)} />
          </div>

          {/* Row 2: Qty + Remove */}
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-zinc-400 w-8 flex-shrink-0">Qty</span>
            <div className="flex items-center gap-1">
              <button onClick={() => onUpdateQty(item._cartId, item.quantity - 1)}
                className="w-4 h-4 md:w-5 md:h-5 rounded-md bg-zinc-900 text-white flex items-center justify-center text-[9px] md:text-[10px] font-bold leading-none flex-shrink-0">
                {item.quantity === 1 ? <Trash2 size={8} /> : '−'}
              </button>
              <InlineNumber value={item.quantity} onCommit={(v) => onUpdateQty(item._cartId, Math.round(v))} format={(v) => String(Math.round(v))} />
              <button onClick={() => onUpdateQty(item._cartId, item.quantity + 1)}
                className="w-4 h-4 md:w-5 md:h-5 rounded-md bg-zinc-900 text-white flex items-center justify-center text-[9px] md:text-[10px] font-bold leading-none flex-shrink-0">+</button>
            </div>
            <div className="flex-1" />
            <button onClick={() => onRemove(item._cartId)} className="text-[11px] text-red-500 font-medium hover:text-red-600">Remove</button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── BusinessCartItem (with Tax, no Split Among) ───────────────────────────────
function BusinessCartItem({ item, onUpdateQty, onUpdatePrice, onUpdateTax, onRemove, sym }) {
  const subtotal  = item._price * item.quantity
  const taxAmt    = subtotal * (item._taxRate ?? 0) / 100
  const lineTotal = (subtotal + taxAmt).toFixed(2)
  const iconBg    = item.category?.color?.startsWith('#') ? `${item.category.color}22` : '#f4f4f5'

  return (
    <div className="flex gap-3 py-3.5 border-b border-zinc-100 last:border-0">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0 mt-0.5" style={{ backgroundColor: iconBg }}>
        {item.category?.icon || '📦'}
      </div>

      <div className="flex-1 min-w-0">
        {/* Name + total */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-zinc-900 truncate leading-tight">{item.name}</p>
            <p className="text-xs text-zinc-400 mt-0.5">
              {[item.category?.name, item.unit].filter(Boolean).join(' · ')}
            </p>
          </div>
          <p className="text-sm font-bold text-zinc-900 whitespace-nowrap flex-shrink-0">{sym}{lineTotal}</p>
        </div>

        {/* Compact controls — all in two rows */}
        <div className="flex flex-col gap-1.5">
          {/* Row 1: Price + Tax */}
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-zinc-400 w-8 flex-shrink-0">Price</span>
            <div className="flex items-center gap-1">
              <button onClick={() => onUpdatePrice(item._cartId, item._price - 0.05)}
                className="w-4 h-4 md:w-5 md:h-5 rounded-md bg-zinc-900 text-white flex items-center justify-center text-[9px] md:text-[10px] font-bold leading-none flex-shrink-0">−</button>
              <InlineNumber value={item._price} onCommit={(v) => onUpdatePrice(item._cartId, v)} format={(v) => v.toFixed(2)} />
              <button onClick={() => onUpdatePrice(item._cartId, item._price + 0.05)}
                className="w-4 h-4 md:w-5 md:h-5 rounded-md bg-zinc-900 text-white flex items-center justify-center text-[9px] md:text-[10px] font-bold leading-none flex-shrink-0">+</button>
            </div>
            <span className="text-[11px] text-zinc-400 flex-shrink-0">Tax</span>
            <div className="flex items-center gap-1">
              <button onClick={() => onUpdateTax(item._cartId, (item._taxRate ?? 0) - 0.5)}
                className="w-4 h-4 md:w-5 md:h-5 rounded-md bg-zinc-900 text-white flex items-center justify-center text-[9px] md:text-[10px] font-bold leading-none flex-shrink-0">−</button>
              <InlineNumber value={item._taxRate ?? 0} onCommit={(v) => onUpdateTax(item._cartId, v)} format={(v) => `${v.toFixed(1)}%`} />
              <button onClick={() => onUpdateTax(item._cartId, (item._taxRate ?? 0) + 0.5)}
                className="w-4 h-4 md:w-5 md:h-5 rounded-md bg-zinc-900 text-white flex items-center justify-center text-[9px] md:text-[10px] font-bold leading-none flex-shrink-0">+</button>
            </div>
          </div>

          {/* Row 2: Qty + Remove */}
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-zinc-400 w-8 flex-shrink-0">Qty</span>
            <div className="flex items-center gap-1">
              <button onClick={() => onUpdateQty(item._cartId, item.quantity - 1)}
                className="w-4 h-4 md:w-5 md:h-5 rounded-md bg-zinc-900 text-white flex items-center justify-center text-[9px] md:text-[10px] font-bold leading-none flex-shrink-0">
                {item.quantity === 1 ? <Trash2 size={8} /> : '−'}
              </button>
              <InlineNumber value={item.quantity} onCommit={(v) => onUpdateQty(item._cartId, Math.round(v))} format={(v) => String(Math.round(v))} />
              <button onClick={() => onUpdateQty(item._cartId, item.quantity + 1)}
                className="w-4 h-4 md:w-5 md:h-5 rounded-md bg-zinc-900 text-white flex items-center justify-center text-[9px] md:text-[10px] font-bold leading-none flex-shrink-0">+</button>
            </div>
            <div className="flex-1" />
            <button onClick={() => onRemove(item._cartId)} className="text-[11px] text-red-500 font-medium hover:text-red-600">Remove</button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── OrderTypeTab pill ─────────────────────────────────────────────────────────
function OrderTypeTab({ label, active, onClick }) {
  return (
    <button onClick={onClick}
      className={['flex-1 py-1.5 text-xs font-semibold rounded-[8px] transition-all',
        active ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-400'].join(' ')}>
      {label}
    </button>
  )
}

// ── CartPanel ─────────────────────────────────────────────────────────────────
export default function CartPanel() {
  const {
    items, cartOpen, closeCart,
    updateQuantity, updatePrice, updateTax, updateSplit, removeItem, clearCart,
    getSubtotal, getTax, getTotal,
  } = useCartStore()

  const activeGroupId = useGroupStore((s) => s.activeGroupId)
  const user          = useAuthStore((s) => s.user)
  const { data: group } = useGroup(activeGroupId)
  const { mutate: createOrder,    isPending: placingOrder   } = useCreateOrder()
  const { mutate: createWishlist, isPending: savingWishlist } = useCreateWishlist()
  const { mutate: upsertInventory } = useCreateInventory()
  const { mutate: createPO,       isPending: placingPO      } = useCreatePurchaseOrder()
  const { mutate: createSO,       isPending: placingSO      } = useCreateSalesOrder()
  const { mutate: createGO,       isPending: placingGO      } = useCreateGeneralOrder()
  const { data: vendors     = [] } = useVendors()
  const { data: customers   = [] } = useCustomers()
  const { data: recipients  = [] } = useRecipients()
  const isBusiness = useIsBusiness()
  const sym = useCurrencySymbol()

  const members = (group?.members || []).filter((m) => m._id || m)
  const userId  = user?._id ? String(user._id) : (user?.id ? String(user.id) : '')

  // ── Personal General order fields
  const [orderName, setOrderName] = useState('')
  const [paidBy,    setPaidBy]    = useState(() => userId)
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0])

  // ── Business General Order fields
  const [goRecipient,  setGoRecipient]  = useState('')
  const [goDirection,  setGoDirection]  = useState('payable')
  const [goOrderDate,  setGoOrderDate]  = useState(new Date().toISOString().split('T')[0])
  const [goNotes,      setGoNotes]      = useState('')

  // ── Business order type
  const [orderType, setOrderType] = useState('general')

  // ── PO / SO fields
  const [vendorId,     setVendorId]     = useState('')
  const [customerId,   setCustomerId]   = useState('')
  const [expectedDate, setExpectedDate] = useState(new Date().toISOString().split('T')[0])
  const [deliveryDate, setDeliveryDate] = useState(new Date().toISOString().split('T')[0])
  const [notes,        setNotes]        = useState('')

  const [orderError, setOrderError] = useState('')
  const [totalsOpen, setTotalsOpen] = useState(false)

  useEffect(() => {
    if (cartOpen) {
      setOrderName(`order-${String(Math.floor(1000 + Math.random() * 9000))}`)
      setOrderDate(new Date().toISOString().split('T')[0])
      setPaidBy(userId || '')
      setGoRecipient('')
      setGoDirection('payable')
      setGoOrderDate(new Date().toISOString().split('T')[0])
      setGoNotes('')
      setOrderType('general')
      setVendorId('')
      setCustomerId('')
      setExpectedDate(new Date().toISOString().split('T')[0])
      setDeliveryDate(new Date().toISOString().split('T')[0])
      setNotes('')
      setOrderError('')
      setTotalsOpen(false)
    }
  }, [cartOpen])

  useEffect(() => { if (userId && !paidBy) setPaidBy(userId) }, [userId])

  // personal uses simple subtotal; business uses subtotal+tax
  const subtotal   = getSubtotal()
  const taxTotal   = getTax()
  const grandTotal = getTotal()
  const personalTotal = subtotal // personal ignores tax

  const buildBusinessItems = () => items.map((i) => ({
    product: i._id, description: i.name, unit: i.unit,
    qty: i.quantity, unitPrice: i._price, taxRate: i._taxRate ?? 0,
    amount: i._price * i.quantity,
  }))

  const afterSuccess = () => { clearCart(); closeCart() }

  const handleGeneral = () => {
    if (!items.length) return
    setOrderError('')
    if (isBusiness) {
      // Business → create a General Order
      if (!goRecipient) { setOrderError('Please select a recipient'); return }
      const goItems = buildBusinessItems()
      const goSubtotal  = goItems.reduce((s, i) => s + i.amount, 0)
      const goTax       = goItems.reduce((s, i) => s + i.amount * (i.taxRate / 100), 0)
      createGO({
        recipient:  goRecipient,
        direction:  goDirection,
        items:      goItems,
        subtotal:   goSubtotal,
        taxAmount:  goTax,
        grandTotal: goSubtotal + goTax,
        orderDate:  goOrderDate,
        notes:      goNotes,
      }, {
        onSuccess: afterSuccess,
        onError: (err) => setOrderError(err?.response?.data?.message || err?.message || 'Failed to create General Order'),
      })
    } else {
      // Personal → legacy order
      createOrder({
        name: orderName, date: orderDate, groupId: activeGroupId,
        createdBy: userId, paidBy, totalPrice: personalTotal.toFixed(2),
        items: items.map((i) => ({
          product: i._id, unit: i.unit, price: i._price, count: i.quantity,
          splitType: i._splitType, splitAmong: i._splitAmong, inventory: i.inventory ?? false,
        })),
      }, {
        onSuccess: () => {
          const tracked = items.filter((i) => i.inventory)
          if (tracked.length) upsertInventory({ groupId: activeGroupId, inventoryData: tracked.map((i) => ({ product: i._id, price: i._price, splitAmong: i._splitAmong, quantityAvailable: i.quantity })) })
          afterSuccess()
        },
        onError: (err) => setOrderError(err?.response?.data?.message || err?.message || 'Failed to place order'),
      })
    }
  }

  const handlePO = () => {
    if (!items.length) return
    setOrderError('')
    createPO({ vendor: vendorId || undefined, items: buildBusinessItems(), expectedDate, notes }, {
      onSuccess: afterSuccess,
      onError: (err) => setOrderError(err?.response?.data?.message || err?.message || 'Failed to create PO'),
    })
  }

  const handleSO = () => {
    if (!items.length) return
    setOrderError('')
    createSO({ customer: customerId || undefined, items: buildBusinessItems(), deliveryDate, notes }, {
      onSuccess: afterSuccess,
      onError: (err) => setOrderError(err?.response?.data?.message || err?.message || 'Failed to create SO'),
    })
  }

  const handleWishlist = () => {
    createWishlist({
      name: orderName, date: orderDate, paidBy, createdBy: userId,
      groupId: activeGroupId, totalPrice: personalTotal.toFixed(2),
      items: items.map((i) => ({ product: i._id, unit: i.unit, price: String(i._price), count: String(i.quantity), taxRate: i._taxRate ?? 0, splitType: i._splitType, splitAmong: i._splitAmong })),
    })
    afterSuccess()
  }

  if (!cartOpen) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="flex-1 bg-black/40" onClick={closeCart} />

      {/* Panel */}
      <div className="w-full max-w-[420px] bg-white flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 flex-shrink-0">
          <h2 className="text-base font-semibold text-zinc-900">Shopping cart</h2>
          <button onClick={closeCart} className="p-1.5 rounded-lg text-zinc-500 hover:bg-zinc-100"><X size={18} /></button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 py-16 text-center">
              <ShoppingCart size={40} className="text-zinc-300" />
              <p className="text-sm font-medium text-zinc-500">Your cart is empty</p>
              <button onClick={closeCart} className="text-sm text-zinc-900 font-semibold underline underline-offset-2">Continue Shopping →</button>
            </div>
          ) : isBusiness ? (
            items.map((item) => (
              <BusinessCartItem key={item._cartId} item={item} sym={sym}
                onUpdateQty={updateQuantity} onUpdatePrice={updatePrice}
                onUpdateTax={updateTax} onRemove={removeItem} />
            ))
          ) : (
            items.map((item) => (
              <PersonalCartItem key={item._cartId} item={item} members={members} sym={sym}
                onUpdateQty={updateQuantity} onUpdatePrice={updatePrice}
                onUpdateSplit={updateSplit} onRemove={removeItem} />
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="flex-shrink-0 border-t border-zinc-100 px-5 pt-4 pb-5 flex flex-col gap-3">

            {/* Totals */}
            {isBusiness ? (
              <div className="flex flex-col gap-1">
                {/* Collapsible subtotal + tax */}
                {totalsOpen && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-zinc-400">Subtotal</span>
                      <span className="text-xs text-zinc-600">{sym}{subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-zinc-400">Tax</span>
                      <span className="text-xs text-zinc-600">+{sym}{taxTotal.toFixed(2)}</span>
                    </div>
                  </>
                )}
                {/* Total row — always visible */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => setTotalsOpen((o) => !o)}
                      className="w-5 h-5 rounded-md bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center transition-colors">
                      <ChevronDown size={12} className={`text-zinc-500 transition-transform ${totalsOpen ? '' : '-rotate-90'}`} />
                    </button>
                    <span className="text-sm font-semibold text-zinc-900">Total</span>
                  </div>
                  <span className="text-sm font-bold text-zinc-900">{sym}{grandTotal.toFixed(2)}</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-zinc-900">Subtotal</span>
                <span className="text-sm font-bold text-zinc-900">{sym}{personalTotal.toFixed(2)}</span>
              </div>
            )}

            {/* Business: order type tabs */}
            {isBusiness && (
              <div className="bg-zinc-100 rounded-xl p-0.5 flex">
                <OrderTypeTab label="General"        active={orderType === 'general'} onClick={() => setOrderType('general')} />
                <OrderTypeTab label="Purchase Order" active={orderType === 'po'}      onClick={() => setOrderType('po')} />
                <OrderTypeTab label="Sales Order"    active={orderType === 'so'}      onClick={() => setOrderType('so')} />
              </div>
            )}

            {/* Personal General fields */}
            {!isBusiness && (
              <div className="grid grid-cols-3 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-zinc-500">Order name</label>
                  <input value={orderName} onChange={(e) => setOrderName(e.target.value)}
                    className="h-9 w-full rounded-lg border border-zinc-200 bg-white px-2 text-xs text-zinc-900 outline-none focus:border-zinc-900" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-zinc-500">Paid By</label>
                  <select value={paidBy} onChange={(e) => setPaidBy(e.target.value)}
                    className="h-9 w-full rounded-lg border border-zinc-200 bg-white px-2 text-xs text-zinc-900 outline-none focus:border-zinc-900">
                    {members.map((m) => <option key={String(m._id)} value={String(m._id)}>{m.name || m.email}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-zinc-500">Date</label>
                  <input type="date" value={orderDate} onChange={(e) => setOrderDate(e.target.value)}
                    className="h-9 w-full rounded-lg border border-zinc-200 bg-white px-2 text-xs text-zinc-900 outline-none focus:border-zinc-900" />
                </div>
              </div>
            )}

            {/* Business General Order fields */}
            {isBusiness && orderType === 'general' && (
              <div className="flex flex-col gap-2">
                <div className="grid grid-cols-3 gap-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] text-zinc-500">Recipient *</label>
                    <select value={goRecipient} onChange={(e) => setGoRecipient(e.target.value)}
                      className="h-9 w-full rounded-lg border border-zinc-200 bg-white px-2 text-xs text-zinc-900 outline-none focus:border-zinc-900">
                      <option value="">— Select —</option>
                      {recipients.map((r) => <option key={r._id} value={r._id}>{r.name}</option>)}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] text-zinc-500">Direction</label>
                    <select value={goDirection} onChange={(e) => setGoDirection(e.target.value)}
                      className="h-9 w-full rounded-lg border border-zinc-200 bg-white px-2 text-xs text-zinc-900 outline-none focus:border-zinc-900">
                      <option value="payable">We pay</option>
                      <option value="receivable">We receive</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] text-zinc-500">Order Date</label>
                    <input type="date" value={goOrderDate} onChange={(e) => setGoOrderDate(e.target.value)}
                      className="h-9 w-full rounded-lg border border-zinc-200 bg-white px-2 text-xs text-zinc-900 outline-none focus:border-zinc-900" />
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-zinc-500">Notes (optional)</label>
                  <textarea value={goNotes} onChange={(e) => setGoNotes(e.target.value)} rows={2} placeholder="Any notes…"
                    className="w-full rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-xs text-zinc-900 outline-none focus:border-zinc-900 resize-none" />
                </div>
              </div>
            )}

            {/* PO fields */}
            {isBusiness && orderType === 'po' && (
              <div className="flex flex-col gap-2">
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] text-zinc-500">Vendor (optional)</label>
                    <select value={vendorId} onChange={(e) => setVendorId(e.target.value)}
                      className="h-9 w-full rounded-lg border border-zinc-200 bg-white px-2 text-xs text-zinc-900 outline-none focus:border-zinc-900">
                      <option value="">— No vendor —</option>
                      {vendors.map((v) => <option key={v._id} value={v._id}>{v.name}</option>)}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] text-zinc-500">Expected Date</label>
                    <input type="date" value={expectedDate} onChange={(e) => setExpectedDate(e.target.value)}
                      className="h-9 w-full rounded-lg border border-zinc-200 bg-white px-2 text-xs text-zinc-900 outline-none focus:border-zinc-900" />
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-zinc-500">Notes (optional)</label>
                  <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Any notes…"
                    className="w-full rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-xs text-zinc-900 outline-none focus:border-zinc-900 resize-none" />
                </div>
              </div>
            )}

            {/* SO fields */}
            {isBusiness && orderType === 'so' && (
              <div className="flex flex-col gap-2">
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] text-zinc-500">Customer (optional)</label>
                    <select value={customerId} onChange={(e) => setCustomerId(e.target.value)}
                      className="h-9 w-full rounded-lg border border-zinc-200 bg-white px-2 text-xs text-zinc-900 outline-none focus:border-zinc-900">
                      <option value="">— No customer —</option>
                      {customers.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] text-zinc-500">Delivery Date</label>
                    <input type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)}
                      className="h-9 w-full rounded-lg border border-zinc-200 bg-white px-2 text-xs text-zinc-900 outline-none focus:border-zinc-900" />
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-zinc-500">Notes (optional)</label>
                  <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Any notes…"
                    className="w-full rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-xs text-zinc-900 outline-none focus:border-zinc-900 resize-none" />
                </div>
              </div>
            )}

            {/* Error */}
            {orderError && <p className="text-xs text-red-500 font-medium">{orderError}</p>}

            {/* Action buttons */}
            {!isBusiness && (
              <div className="grid grid-cols-2 gap-2">
                <Button fullWidth loading={placingOrder} onClick={handleGeneral}>Place Order</Button>
                <Button fullWidth variant="secondary" loading={savingWishlist} onClick={handleWishlist}>Add to Wish List</Button>
              </div>
            )}
            {isBusiness && orderType === 'general' && (
              <div className="grid grid-cols-2 gap-2">
                <Button fullWidth loading={placingGO} onClick={handleGeneral}>Create General Order</Button>
                <Button fullWidth variant="secondary" loading={savingWishlist} onClick={handleWishlist}>Add to Wish List</Button>
              </div>
            )}
            {isBusiness && orderType === 'po' && (
              <div className="grid grid-cols-2 gap-2">
                <Button fullWidth loading={placingPO} onClick={handlePO}>Create Purchase Order</Button>
                <Button fullWidth variant="secondary" loading={savingWishlist} onClick={handleWishlist}>Add to Wish List</Button>
              </div>
            )}
            {isBusiness && orderType === 'so' && (
              <div className="grid grid-cols-2 gap-2">
                <Button fullWidth loading={placingSO} onClick={handleSO}>Create Sales Order</Button>
                <Button fullWidth variant="secondary" loading={savingWishlist} onClick={handleWishlist}>Add to Wish List</Button>
              </div>
            )}


          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
