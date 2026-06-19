import { create } from 'zustand'

const lsKey = (groupId) => `openledger_cart_${groupId}`

function uuid() {
  try { return crypto.randomUUID() } catch { return Math.random().toString(36).slice(2) }
}

function readCart(groupId) {
  if (!groupId) return []
  try { return JSON.parse(localStorage.getItem(lsKey(groupId))) || [] } catch { return [] }
}

function writeCart(groupId, items) {
  if (!groupId) return
  try { localStorage.setItem(lsKey(groupId), JSON.stringify(items)) } catch {}
}

const useCartStore = create((set, get) => ({
  items: [],
  groupId: null,
  cartOpen: false,
  lastRemoved: null,

  openCart:  () => set({ cartOpen: true }),
  closeCart: () => set({ cartOpen: false }),

  hydrate: (groupId) => {
    const items = readCart(groupId)
    set({ items, groupId })
  },

  addItem: (product, unit, splitType = 'equal', splitAmong = [], groupMembers = [], initialQty = 1) => {
    const { items, groupId } = get()
    const resolvedUnit = unit || product.unit
    const resolvedSplit = splitAmong.length
      ? splitAmong.map(String)
      : (product.splitAmong || []).length
      ? (product.splitAmong || []).map(String)
      : groupMembers.length
      ? groupMembers.map(String)
      : []

    const newPrice = product._price ?? parseFloat(product.price)
    const taxRate  = parseFloat(product.taxRate ?? 0)

    const existingIdx = items.findIndex(
      (i) => i._id === product._id && i.unit === resolvedUnit && i._price === newPrice
    )

    let next
    if (existingIdx !== -1) {
      next = items.map((i, idx) =>
        idx === existingIdx ? { ...i, quantity: i.quantity + initialQty } : i
      )
    } else {
      next = [...items, {
        ...product,
        _cartId: uuid(),
        _price: newPrice,
        _taxRate: taxRate,
        _splitType: splitType,
        _splitAmong: resolvedSplit,
        quantity: initialQty,
        addedAt: Date.now(),
      }]
    }

    set({ items: next })
    writeCart(groupId, next)
  },

  updateQuantity: (_cartId, quantity) => {
    const { items, groupId } = get()
    const next = quantity <= 0
      ? items.filter((i) => i._cartId !== _cartId)
      : items.map((i) => i._cartId === _cartId ? { ...i, quantity } : i)
    set({ items: next })
    writeCart(groupId, next)
  },

  updatePrice: (_cartId, price) => {
    const { items, groupId } = get()
    const next = items.map((i) =>
      i._cartId === _cartId ? { ...i, _price: Math.max(0, parseFloat(price.toFixed(2))) } : i
    )
    set({ items: next })
    writeCart(groupId, next)
  },

  updateTax: (_cartId, taxRate) => {
    const { items, groupId } = get()
    const next = items.map((i) =>
      i._cartId === _cartId ? { ...i, _taxRate: Math.max(0, parseFloat(taxRate.toFixed(2))) } : i
    )
    set({ items: next })
    writeCart(groupId, next)
  },

  updateSplit: (_cartId, { splitType, splitAmong }) => {
    const { items, groupId } = get()
    const next = items.map((i) =>
      i._cartId === _cartId ? { ...i, _splitType: splitType, _splitAmong: splitAmong } : i
    )
    set({ items: next })
    writeCart(groupId, next)
  },

  removeItem: (_cartId) => {
    const { items, groupId } = get()
    const removed = items.find((i) => i._cartId === _cartId)
    const next = items.filter((i) => i._cartId !== _cartId)
    set({ items: next, lastRemoved: removed ?? null })
    writeCart(groupId, next)
  },

  undoRemove: () => {
    const { items, groupId, lastRemoved } = get()
    if (!lastRemoved) return
    const next = [...items, lastRemoved].sort((a, b) => a.addedAt - b.addedAt)
    set({ items: next, lastRemoved: null })
    writeCart(groupId, next)
  },

  clearLastRemoved: () => set({ lastRemoved: null }),

  clearCart: () => {
    const { groupId } = get()
    try { localStorage.removeItem(lsKey(groupId)) } catch {}
    set({ items: [], lastRemoved: null })
  },

  // subtotal before tax
  getSubtotal: () =>
    get().items.reduce((sum, i) => sum + i._price * i.quantity, 0),

  // total tax across all items
  getTax: () =>
    get().items.reduce((sum, i) => sum + (i._price * i.quantity * (i._taxRate ?? 0)) / 100, 0),

  // grand total = subtotal + tax
  getTotal: () => {
    const items = get().items
    return items.reduce((sum, i) => {
      const subtotal = i._price * i.quantity
      const tax = subtotal * (i._taxRate ?? 0) / 100
      return sum + subtotal + tax
    }, 0)
  },

  getItemCount: () =>
    get().items.reduce((sum, i) => sum + i.quantity, 0),
}))

export default useCartStore
