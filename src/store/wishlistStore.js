import { create } from 'zustand'

// Only stores UI state — data lives in the backend via useWishlists hooks
const useWishlistStore = create((set) => ({
  editingId: null,
  openEdit:  (id) => set({ editingId: id }),
  closeEdit: ()   => set({ editingId: null }),
}))

export default useWishlistStore
