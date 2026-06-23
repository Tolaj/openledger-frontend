import { create } from 'zustand'

let nextId = 1

const useToastStore = create((set) => ({
  toasts: [],

  add: (toast) => {
    const id = nextId++
    set((s) => ({ toasts: [...s.toasts, { id, duration: 3500, ...toast }] }))
    return id
  },

  remove: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))

// Convenience helpers — call these anywhere without hooks
export const toast = {
  success: (message, opts) => useToastStore.getState().add({ type: 'success', message, ...opts }),
  error:   (message, opts) => useToastStore.getState().add({ type: 'error',   message, ...opts }),
  info:    (message, opts) => useToastStore.getState().add({ type: 'info',    message, ...opts }),
  warning: (message, opts) => useToastStore.getState().add({ type: 'warning', message, ...opts }),
}

export default useToastStore
