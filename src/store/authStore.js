import { create } from 'zustand'

const LS_KEY = 'openledger_activeGroup'
const TOKEN_KEY = 'openledger_token'

const useAuthStore = create((set) => ({
  user: null,
  token: localStorage.getItem(TOKEN_KEY) || null,
  groupId: null,
  isLoading: true,

  setSession: (user, token) => {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    set({ user, token: token ?? localStorage.getItem(TOKEN_KEY), groupId: user?.groupId ?? null, isLoading: false })
  },

  clearSession: () => {
    localStorage.removeItem(LS_KEY)
    localStorage.removeItem(TOKEN_KEY)
    set({ user: null, token: null, groupId: null, isLoading: false })
  },
}))

export default useAuthStore
