import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product, unit) => {
        const items = get().items
        const existing = items.find(
          (i) => i.product._id === product._id && i.unit === unit
        )
        if (existing) {
          set({
            items: items.map((i) =>
              i.product._id === product._id && i.unit === unit
                ? { ...i, count: i.count + 1 }
                : i
            ),
          })
        } else {
          set({ items: [...items, { product, unit, count: 1 }] })
        }
      },

      removeItem: (productId, unit) =>
        set({ items: get().items.filter((i) => !(i.product._id === productId && i.unit === unit)) }),

      updateCount: (productId, unit, count) =>
        set({
          items: count <= 0
            ? get().items.filter((i) => !(i.product._id === productId && i.unit === unit))
            : get().items.map((i) =>
                i.product._id === productId && i.unit === unit ? { ...i, count } : i
              ),
        }),

      clearCart: () => set({ items: [] }),

      total: () =>
        get().items.reduce((sum, i) => sum + parseFloat(i.product.price) * i.count, 0),
    }),
    { name: 'openledger-cart' }
  )
)

export default useCartStore
