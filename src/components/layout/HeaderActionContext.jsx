import { createContext, useContext, useState, useCallback } from 'react'

const HeaderActionContext = createContext({ action: null, setAction: () => { }, clearAction: () => { } })

export function HeaderActionProvider({ children }) {
  const [action, setActionState] = useState(null)

  const setAction = useCallback((node) => setActionState(() => node), [])
  const clearAction = useCallback(() => setActionState(null), [])

  return (
    <HeaderActionContext.Provider value={{ action, setAction, clearAction }}>
      {children}
    </HeaderActionContext.Provider>
  )
}

export function useHeaderAction() {
  return useContext(HeaderActionContext)
}
