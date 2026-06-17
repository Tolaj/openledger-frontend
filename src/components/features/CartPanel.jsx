import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X, Minus, Plus, Trash2, ChevronDown, Check, ShoppingCart } from 'lucide-react'
import useCartStore from '../../store/cartStore'
import useGroupStore from '../../store/groupStore'
import useAuthStore from '../../store/authStore'
import { useGroup } from '../../hooks/useGroups'
import { useCreateOrder } from '../../hooks/useOrders'
import { useCreateWishlist } from '../../hooks/useWishlists'
import { useCreateInventory } from '../../hooks/useInventory'
import Button from '../ui/Button'

// ── SplitDropdown ─────────────────────────────────────────────────────────────
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
    const next = splitAmong.includes(id)
      ? splitAmong.filter((m) => m !== id)
      : [...splitAmong, id]
    if (next.length > 0) onChange({ splitType: value, splitAmong: next })
  }

  const allSelected = members.length > 0 && members.every((m) => splitAmong.includes(String(m._id)))
  const label = allSelected ? 'Even' : 'Uneven'

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-900 text-white text-xs font-semibold whitespace-nowrap"
      >
        {label}
        <ChevronDown size={11} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 bg-white border border-zinc-200 rounded-xl shadow-xl z-50 min-w-[140px] py-1">
          {members.map((m) => (
            <button
              key={m._id}
              onClick={() => toggleMember(String(m._id))}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-zinc-700 hover:bg-zinc-50"
            >
              <span className={[
                'w-4 h-4 rounded flex items-center justify-center border flex-shrink-0',
                splitAmong.includes(String(m._id)) ? 'bg-zinc-900 border-zinc-900' : 'border-zinc-300',
              ].join(' ')}>
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

// ── InlineNumber — click to edit ──────────────────────────────────────────────
function InlineNumber({ value, onCommit, format = (v) => v }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const inputRef = useRef(null)

  const startEdit = () => {
    setDraft(String(value))
    setEditing(true)
    setTimeout(() => inputRef.current?.select(), 0)
  }

  const commit = () => {
    const n = parseFloat(draft)
    if (!isNaN(n) && n > 0) onCommit(n)
    setEditing(false)
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false) }}
        className="w-14 text-center text-xs font-semibold text-zinc-900 border border-zinc-900 rounded-lg px-1 py-0.5 outline-none"
      />
    )
  }

  return (
    <span
      onClick={startEdit}
      className="w-14 text-center text-xs font-semibold text-zinc-900 cursor-text select-none rounded-lg px-1 py-0.5 hover:bg-zinc-100 transition-colors"
    >
      {format(value)}
    </span>
  )
}

// ── CartItem ──────────────────────────────────────────────────────────────────
function CartItem({ item, members, onUpdateQty, onUpdatePrice, onUpdateSplit, onRemove }) {
  const lineTotal = (item._price * item.quantity).toFixed(2)
  const catColor = item.category?.color
  // category.color may be a hex code or a Tailwind class — only use as inline style if hex
  const iconBg = catColor && catColor.startsWith('#') ? `${catColor}22` : '#f4f4f5'

  return (
    <div className="flex gap-3 py-4 border-b border-zinc-100 last:border-0">
      {/* icon */}
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 mt-0.5"
        style={{ backgroundColor: iconBg }}
      >
        {item.category?.icon || '📦'}
      </div>

      {/* content */}
      <div className="flex-1 min-w-0">
        {/* name + total */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <p className="text-sm font-semibold text-zinc-900 leading-tight">{item.name}</p>
          <p className="text-sm font-bold text-zinc-900 whitespace-nowrap">$ {lineTotal}</p>
        </div>

        {/* rows: Unit / Price / Count — Split label+dropdown pinned right */}
        <div className="flex flex-col gap-1.5">
          {/* Unit */}
          <div className="flex items-center gap-2 h-5">
            <span className="text-xs text-zinc-500 w-10">Unit</span>
            <span className="text-xs font-medium text-zinc-700 flex-1">{item.unit}</span>
            <span className="text-xs text-zinc-500">Split Among</span>
          </div>

          {/* Price */}
          <div className="flex items-center gap-1.5 h-5">
            <span className="text-xs text-zinc-500 w-10">Price</span>
            <button
              onClick={() => onUpdatePrice(item._cartId, item._price - 0.05)}
              className="w-5 h-5 rounded-full bg-zinc-900 text-white flex items-center justify-center text-xs font-bold leading-none flex-shrink-0"
            >−</button>
            <InlineNumber
              value={item._price}
              onCommit={(v) => onUpdatePrice(item._cartId, v)}
              format={(v) => v.toFixed(2)}
            />
            <button
              onClick={() => onUpdatePrice(item._cartId, item._price + 0.05)}
              className="w-5 h-5 rounded-full bg-zinc-900 text-white flex items-center justify-center text-xs font-bold leading-none flex-shrink-0"
            >+</button>
            <div className="flex-1" />
            <SplitDropdown
              value={item._splitType}
              splitAmong={item._splitAmong}
              members={members}
              onChange={(s) => onUpdateSplit(item._cartId, s)}
            />
          </div>

          {/* Count */}
          <div className="flex items-center gap-1.5 h-5">
            <span className="text-xs text-zinc-500 w-10">Count</span>
            <button
              onClick={() => onUpdateQty(item._cartId, item.quantity - 1)}
              className="w-5 h-5 rounded-full bg-zinc-900 text-white flex items-center justify-center text-xs font-bold leading-none flex-shrink-0"
            >
              {item.quantity === 1 ? <Trash2 size={9} /> : '−'}
            </button>
            <InlineNumber
              value={item.quantity}
              onCommit={(v) => onUpdateQty(item._cartId, Math.round(v))}
              format={(v) => String(Math.round(v))}
            />
            <button
              onClick={() => onUpdateQty(item._cartId, item.quantity + 1)}
              className="w-5 h-5 rounded-full bg-zinc-900 text-white flex items-center justify-center text-xs font-bold leading-none flex-shrink-0"
            >+</button>
            <div className="flex-1" />
            <button
              onClick={() => onRemove(item._cartId)}
              className="text-xs text-red-500 font-medium hover:text-red-600"
            >
              Remove
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── CartPanel ─────────────────────────────────────────────────────────────────
export default function CartPanel() {
  const {
    items, cartOpen, closeCart,
    updateQuantity, updatePrice, updateSplit, removeItem, clearCart, getTotal,
    pendingMerge, confirmMerge, cancelMerge,
  } = useCartStore()

  const activeGroupId = useGroupStore((s) => s.activeGroupId)
  const user = useAuthStore((s) => s.user)
  const { data: group } = useGroup(activeGroupId)
  const { mutate: createOrder, isPending: placingOrder } = useCreateOrder()
  const { mutate: createWishlist, isPending: savingWishlist } = useCreateWishlist()
  const { mutate: upsertInventory } = useCreateInventory()

  const members = (group?.members || []).filter((m) => m._id || m)
  const total = getTotal()
  const userId = user?._id ? String(user._id) : (user?.id ? String(user.id) : '')

  // order form state
  const [orderName, setOrderName] = useState('')

  useEffect(() => {
    if (cartOpen) setOrderName(`order-${String(Math.floor(1000 + Math.random() * 9000))}`)
  }, [cartOpen])
  const [paidBy, setPaidBy]       = useState(() => userId)
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0])

  useEffect(() => {
    if (userId && !paidBy) setPaidBy(userId)
  }, [userId])

  // keep checkout draft in sync whenever cart is open
  useEffect(() => {
    if (!cartOpen) return
    if (!items.length) {
      try { localStorage.setItem('openledger_cart_checkout', JSON.stringify({})) } catch {}
      return
    }
    const draft = {
      name: orderName,
      paidBy: paidBy || userId,
      createdBy: userId,
      totalPrice: total.toFixed(2),
      date: orderDate,
      items: items.map((i) => ({
        product: i._id,
        unit: i.unit,
        price: String(i._price),
        splitType: i._splitType,
        splitAmong: i._splitAmong,
        count: String(i.quantity),
        inventory: i.inventory ?? false,
      })),
    }
    try { localStorage.setItem('openledger_cart_checkout', JSON.stringify(draft)) } catch {}
  }, [cartOpen, items, orderName, paidBy, orderDate, total, userId])

  const buildPayload = () => ({
    name: orderName,
    date: orderDate,
    groupId: activeGroupId,
    createdBy: userId,
    paidBy,
    totalPrice: total.toFixed(2),
    items: items.map((i) => ({
      product: i._id,
      unit: i.unit,
      price: i._price,
      count: i.quantity,
      splitType: i._splitType,
      splitAmong: i._splitAmong,
      inventory: i.inventory ?? false,
    })),
  })

  const [orderError, setOrderError] = useState('')

  const handlePlaceOrder = () => {
    if (!items.length) return
    setOrderError('')
    const payload = buildPayload()
    console.log('[CartPanel] place order payload:', payload)
    createOrder(payload, {
      onSuccess: () => {
        // upsert inventory for items that are tracked
        const trackedItems = items.filter((i) => i.inventory)
        if (trackedItems.length) {
          upsertInventory({
            groupId: activeGroupId,
            inventoryData: trackedItems.map((i) => ({
              product: i._id,
              price: i._price,
              splitAmong: i._splitAmong,
              quantityAvailable: i.quantity,
            })),
          })
        }
        clearCart()
        closeCart()
        try { localStorage.removeItem('openledger_cart_checkout') } catch {}
      },
      onError: (err) => {
        const msg = err?.response?.data?.message || err?.message || 'Failed to place order'
        console.error('[CartPanel] place order error:', err?.response?.data || err)
        setOrderError(msg)
      },
    })
  }

  if (!cartOpen) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="flex-1 bg-black/40" onClick={closeCart} />

      {/* Panel */}
      <div className="w-full max-w-[420px] bg-white flex flex-col shadow-2xl relative">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 flex-shrink-0">
          <h2 className="text-base font-semibold text-zinc-900">Shopping cart</h2>
          <button onClick={closeCart} className="p-1.5 rounded-lg text-zinc-500 hover:bg-zinc-100">
            <X size={18} />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 py-16 text-center">
              <ShoppingCart size={40} className="text-zinc-300" />
              <p className="text-sm font-medium text-zinc-500">Your cart is empty</p>
              <button onClick={closeCart} className="text-sm text-zinc-900 font-semibold underline underline-offset-2">
                Continue Shopping →
              </button>
            </div>
          ) : (
            items.map((item) => (
              <CartItem
                key={item._cartId}
                item={item}
                members={members}
                onUpdateQty={updateQuantity}
                onUpdatePrice={updatePrice}
                onUpdateSplit={updateSplit}
                onRemove={removeItem}
              />
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="flex-shrink-0 border-t border-zinc-100 px-5 pt-4 pb-5 flex flex-col gap-3">
            {/* Subtotal */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-zinc-900">Subtotal</span>
              <span className="text-sm font-bold text-zinc-900">Rs.{total.toFixed(2)}</span>
            </div>

            {/* Order form */}
            <div className="grid grid-cols-3 gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-zinc-500">Order name</label>
                <input
                  value={orderName}
                  onChange={(e) => setOrderName(e.target.value)}
                  className="h-9 w-full rounded-lg border border-zinc-200 bg-white px-2 text-xs text-zinc-900 outline-none focus:border-zinc-900"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-zinc-500">Paid By</label>
                <select
                  value={paidBy}
                  onChange={(e) => setPaidBy(e.target.value)}
                  className="h-9 w-full rounded-lg border border-zinc-200 bg-white px-2 text-xs text-zinc-900 outline-none focus:border-zinc-900"
                >
                  {members.map((m) => (
                    <option key={String(m._id)} value={String(m._id)}>
                      {m.name || m.email}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-zinc-500">Date</label>
                <input
                  type="date"
                  value={orderDate}
                  onChange={(e) => setOrderDate(e.target.value)}
                  className="h-9 w-full rounded-lg border border-zinc-200 bg-white px-2 text-xs text-zinc-900 outline-none focus:border-zinc-900"
                />
              </div>
            </div>

            {/* Error */}
            {orderError && (
              <p className="text-xs text-red-500 font-medium">{orderError}</p>
            )}

            {/* Action buttons */}
            <div className="grid grid-cols-2 gap-2">
              <Button fullWidth loading={placingOrder} onClick={handlePlaceOrder}>
                Place Order
              </Button>
              <Button fullWidth variant="secondary" loading={savingWishlist} onClick={() => {
                createWishlist({
                  name: orderName,
                  date: orderDate,
                  paidBy,
                  createdBy: userId,
                  groupId: activeGroupId,
                  totalPrice: total.toFixed(2),
                  items: items.map((i) => ({
                    product: i._id,
                    unit: i.unit,
                    price: String(i._price),
                    count: String(i.quantity),
                    splitType: i._splitType,
                    splitAmong: i._splitAmong,
                  })),
                })
                clearCart()
                closeCart()
              }}>
                Add to Wish List
              </Button>
            </div>

            <div className="text-center">
              <span className="text-xs text-zinc-400">or </span>
              <button onClick={closeCart} className="text-xs font-semibold text-zinc-900 underline underline-offset-2">
                Continue Shopping →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Merge confirmation dialog */}
      {pendingMerge && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 rounded-none">
          <div className="bg-white rounded-2xl shadow-2xl p-6 mx-4 flex flex-col gap-4 max-w-sm w-full">
            <p className="text-sm font-semibold text-zinc-900">Multiple products with same properties, wanna merge?</p>
            <p className="text-xs text-zinc-500">Both items have the same product, price, and split. Merging will combine their quantities.</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={cancelMerge}
                className="h-9 rounded-xl border border-zinc-200 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmMerge}
                className="h-9 rounded-xl bg-zinc-900 text-sm font-medium text-white hover:bg-zinc-700"
              >
                Merge
              </button>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  )
}
