import { create } from 'zustand'

const LS_KEY = 'openledger_activeGroup'

const useAuthStore = create((set) => ({
  user: null,
  groupId: null,
  isLoading: true,

  setSession: (user) =>
    set({ user, groupId: user?.groupId ?? null, isLoading: false }),

  clearSession: () => {
    // Wipe persisted group so the next user always starts with their own data.
    // Also reset the groupStore's in-memory state via its own LS_KEY removal —
    // the store reads from localStorage on init, so removing the key ensures
    // the next store creation starts fresh. For the running store instance,
    // call clearGroup() explicitly from the logout handler.
    localStorage.removeItem(LS_KEY)
    set({ user: null, groupId: null, isLoading: false })
  },
}))

export default useAuthStore
