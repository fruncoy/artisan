import { createContext, useContext } from 'react'

const AppContext = createContext({ appName: 'AMP' })

export function AppProvider({ children }) {
  return <AppContext.Provider value={{ appName: 'AMP' }}>{children}</AppContext.Provider>
}

export function useAppContext() {
  return useContext(AppContext)
}
