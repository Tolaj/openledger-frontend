import { create } from 'zustand'

const useAuthStore = create((set) => ({
  user: null,
  groupId: null,
  isLoading: true,

  setSession: (user) =>
    set({ user, groupId: user?.groupId ?? null, isLoading: false }),

  clearSession: () =>
    set({ user: null, groupId: null, isLoading: false }),
}))

export default useAuthStore
