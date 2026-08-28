import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import './index.css'
import './lib/pwa'   // capture beforeinstallprompt as early as possible
import App from './App.jsx'

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID

const Root = googleClientId
  ? <GoogleOAuthProvider clientId={googleClientId}><App /></GoogleOAuthProvider>
  : <App />

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {Root}
  </StrictMode>,
)
