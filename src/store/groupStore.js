import { create } from 'zustand'

const LS_KEY = 'openledger_activeGroup'

const useGroupStore = create((set) => ({
  activeGroupId: localStorage.getItem(LS_KEY) || null,

  setActiveGroup: (groupId) => {
    localStorage.setItem(LS_KEY, groupId)
    set({ activeGroupId: groupId })
  },

  initGroup: (isolatedGroupId) => {
    const stored = localStorage.getItem(LS_KEY)
    const id = stored || isolatedGroupId
    if (id) {
      localStorage.setItem(LS_KEY, id)
      set({ activeGroupId: id })
    }
  },
}))

export default useGroupStore
