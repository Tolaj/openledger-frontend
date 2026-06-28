import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X, Trash2, ChevronDown, Check, ShoppingCart } from 'lucide-react'
import useWishlistStore from '../../store/wishlistStore'
import { useCurrencySymbol } from '../../hooks/useCurrency'
import useGroupStore from '../../store/groupStore'
import useAuthStore from '../../store/authStore'
import { useGroup } from '../../hooks/useGroups'
import { useWishlists, useUpdateWishlist } from '../../hooks/useWishlists'
import Button from '../ui/Button'

// ── SplitDropdown ─────────────────────────────────────────────────────────────
function SplitDropdown({ splitAmong, members, onChange }) {
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
    if (next.length > 0) onChange(next)
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

// ── InlineNumber ──────────────────────────────────────────────────────────────
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

// ── WishlistItem ──────────────────────────────────────────────────────────────
function WishlistItem({ item, members, onUpdateQty, onUpdatePrice, onUpdateSplit, onRemove }) {
  const sym = useCurrencySymbol()
  const lineTotal = (item._price * item.quantity).toFixed(2)
  const catColor = item.category?.color
  const iconBg = catColor && catColor.startsWith('#') ? `${catColor}22` : '#f4f4f5'

  return (
    <div className="flex gap-3 py-4 border-b border-zinc-100 last:border-0">
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 mt-0.5"
        style={{ backgroundColor: iconBg }}
      >
        {item.category?.icon || '📦'}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-2">
          <p className="text-sm font-semibold text-zinc-900 leading-tight">{item.name}</p>
          <p className="text-sm font-bold text-zinc-900 whitespace-nowrap">{sym}{lineTotal}</p>
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2 h-5">
            <span className="text-xs text-zinc-500 w-10">Unit</span>
            <span className="text-xs font-medium text-zinc-700 flex-1">{item.unit}</span>
            <span className="text-xs text-zinc-500">Split Among</span>
          </div>

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
              splitAmong={item._splitAmong}
              members={members}
              onChange={(arr) => onUpdateSplit(item._cartId, arr)}
            />
          </div>

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

// ── WishlistCartPanel ─────────────────────────────────────────────────────────
export default function WishlistCartPanel() {
  const { editingId, closeEdit } = useWishlistStore()
  const activeGroupId = useGroupStore((s) => s.activeGroupId)
  const user = useAuthStore((s) => s.user)
  const { data: group } = useGroup(activeGroupId)
  const { data: wishlists = [] } = useWishlists()
  const { mutate: updateWishlist } = useUpdateWishlist()
  const sym = useCurrencySymbol()

  const entry = wishlists.find((w) => w._id === editingId)
  const members = (group?.members || []).filter((m) => m._id)
  const userId = user?._id ? String(user._id) : (user?.id ? String(user.id) : '')

  // local editable state — initialised from the wishlist entry when it opens
  const [items, setItems] = useState([])
  const [name, setName] = useState('')
  const [paidBy, setPaidBy] = useState('')
  const [date, setDate] = useState('')

  useEffect(() => {
    if (entry) {
      // normalise API items (price/count strings) to panel shape (_price/quantity)
      setItems((entry.items || []).map((i) => ({
        ...i,
        _cartId: i._cartId || String(Math.random()),
        name: i.product?.name || i.name || '',
        unit: i.unit,
        _price: parseFloat(i._price ?? i.price),
        quantity: parseInt(i.quantity ?? i.count, 10) || 1,
        _splitType: i._splitType || i.splitType || 'equal',
        _splitAmong: (i._splitAmong || i.splitAmong || []).map((u) =>
          typeof u === 'object' ? String(u._id) : String(u)
        ),
        category: i.product?.category || i.category,
      })))
      setName(entry.name || '')
      const paidById = entry.paidBy?._id ? String(entry.paidBy._id) : (entry.paidBy || userId)
      setPaidBy(paidById)
      setDate(entry.date || new Date().toISOString().split('T')[0])
    }
  }, [editingId])

  const updateQty = (_cartId, quantity) => {
    setItems((prev) => quantity <= 0
      ? prev.filter((i) => i._cartId !== _cartId)
      : prev.map((i) => i._cartId === _cartId ? { ...i, quantity } : i)
    )
  }

  const updatePrice = (_cartId, price) => {
    setItems((prev) => prev.map((i) =>
      i._cartId === _cartId ? { ...i, _price: Math.max(0, parseFloat(price.toFixed(2))) } : i
    ))
  }

  const updateSplit = (_cartId, splitAmong) => {
    setItems((prev) => prev.map((i) =>
      i._cartId === _cartId ? { ...i, _splitAmong: splitAmong } : i
    ))
  }

  const removeItem = (_cartId) => setItems((prev) => prev.filter((i) => i._cartId !== _cartId))

  const total = items.reduce((sum, i) => sum + i._price * i.quantity, 0)

  const handleSave = () => {
    updateWishlist({
      id: editingId,
      data: {
        name,
        paidBy,
        date,
        totalPrice: total.toFixed(2),
        items: items.map((i) => ({
          product: i.product?._id || i._id,
          unit: i.unit,
          price: String(i._price),
          count: String(i.quantity),
          splitType: i._splitType,
          splitAmong: i._splitAmong,
        })),
      },
    })
    closeEdit()
  }

  if (!editingId || !entry) return null

  return createPortal(
    <div className="fixed inset-0 z-[60] flex">
      <div className="flex-1 bg-black/40" onClick={closeEdit} />

      <div className="w-full max-w-[420px] bg-white flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 flex-shrink-0">
          <h2 className="text-base font-semibold text-zinc-900">Wish list cart</h2>
          <button onClick={closeEdit} className="p-1.5 rounded-lg text-zinc-500 hover:bg-zinc-100">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 py-16 text-center">
              <ShoppingCart size={40} className="text-zinc-300" />
              <p className="text-sm font-medium text-zinc-500">No items in this wishlist</p>
            </div>
          ) : (
            items.map((item) => (
              <WishlistItem
                key={item._cartId}
                item={item}
                members={members}
                onUpdateQty={updateQty}
                onUpdatePrice={updatePrice}
                onUpdateSplit={updateSplit}
                onRemove={removeItem}
              />
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="flex-shrink-0 border-t border-zinc-100 px-5 pt-4 pb-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-zinc-900">Subtotal</span>
              <span className="text-sm font-bold text-zinc-900">{sym}{total.toFixed(2)}</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-zinc-500">Wishlist name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
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
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="h-9 w-full rounded-lg border border-zinc-200 bg-white px-2 text-xs text-zinc-900 outline-none focus:border-zinc-900"
                />
              </div>
            </div>

            <Button fullWidth onClick={handleSave}>Save Changes</Button>
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
