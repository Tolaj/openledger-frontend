import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { useEffect } from 'react'
import queryClient from './lib/queryClient'
import { getSession } from './api/auth'
import useAuthStore from './store/authStore'
import useGroupStore from './store/groupStore'
import useCartStore from './store/cartStore'

import AppShell from './components/layout/AppShell'
import ProtectedRoute from './components/layout/ProtectedRoute'
import InstallPrompt from './components/ui/InstallPrompt'
import Toaster from './components/ui/Toaster'
import ClientAIAssistant from './components/features/ClientAIAssistant'

import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import Onboarding from './pages/Onboarding'
import Dashboard from './pages/Dashboard'
import Products from './pages/Products'
import Finance from './pages/Finance'
import Settings from './pages/Settings'
import Purchases from './pages/Purchases'
import Sales from './pages/Sales'
import General from './pages/General'
import Stock from './pages/Stock'

/** True when running as an installed PWA (standalone window, no browser chrome) */
const isPwa = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  window.navigator.standalone === true

function LandingOrDashboard() {
  const { user, isLoading } = useAuthStore()
  if (isLoading) return null
  if (user) return <Navigate to="/dashboard" replace />
  // In PWA mode skip the marketing landing page — go straight to login
  if (isPwa()) return <Navigate to="/login" replace />
  return <Landing />
}

/** Dynamically update the theme-color meta tag so the status bar matches the page bg */
function ThemeColorSync() {
  const { user } = useAuthStore()
  useEffect(() => {
    const color = user ? '#f5f5f5' : '#ffffff'
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', color)
  }, [user])
  return null
}

function SessionLoader({ children }) {
  const { setSession, clearSession } = useAuthStore()
  const { initGroup } = useGroupStore()
  const { hydrate } = useCartStore()

  useEffect(() => {
    getSession()
      .then((res) => {
        const user = res.data.user
        setSession(user)
        // initialise active group — prefers stored value, falls back to user's isolated group
        initGroup(user?.groupId)
        // hydrate cart for the resolved active group
        const activeGroupId = localStorage.getItem('openledger_activeGroup') || user?.groupId
        if (activeGroupId) hydrate(activeGroupId)
      })
      .catch(() => clearSession())
  }, [])

  return children
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <SessionLoader>
          <ThemeColorSync />
          <InstallPrompt />
          <Toaster />
          <ClientAIAssistant />
          <Routes>
            <Route path="/" element={<LandingOrDashboard />} />
            <Route path="/landing" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route
              path="/onboarding"
              element={
                <ProtectedRoute>
                  <Onboarding />
                </ProtectedRoute>
              }
            />

            <Route
              element={
                <ProtectedRoute>
                  <AppShell />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/products" element={<Products />} />
              <Route path="/finance" element={<Finance />} />
              <Route path="/settings" element={<Settings />} />

              {/* Business ERP routes */}
              <Route path="/general"   element={<General />} />
              <Route path="/purchases" element={<Purchases />} />
              <Route path="/sales"     element={<Sales />} />
              <Route path="/stock"     element={<Stock />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </SessionLoader>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
