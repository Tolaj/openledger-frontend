import { create } from 'zustand'

const LS_KEY = 'openledger_activeGroup'

const useGroupStore = create((set) => ({
  activeGroupId: localStorage.getItem(LS_KEY) || null,

  setActiveGroup: (groupId) => {
    localStorage.setItem(LS_KEY, groupId)
    set({ activeGroupId: groupId })
  },

  // Called right after login/register with the user's own isolated-group ID.
  // Only falls back to localStorage if it already holds a value — this way
  // a returning user keeps their last-selected group, but a fresh login
  // (after clearSession wiped localStorage) always starts with their own group.
  initGroup: (isolatedGroupId) => {
    const stored = localStorage.getItem(LS_KEY)
    const id = stored || isolatedGroupId
    if (id) {
      localStorage.setItem(LS_KEY, id)
      set({ activeGroupId: id })
    }
  },

  clearGroup: () => {
    localStorage.removeItem(LS_KEY)
    set({ activeGroupId: null })
  },
}))

export default useGroupStore
