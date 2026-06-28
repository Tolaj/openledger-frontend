import { useState, useEffect } from 'react'
import AppLogo from './AppLogo'

export default function SplashScreen({ onDone }) {
  const [fading, setFading] = useState(false)

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFading(true), 1400)
    const doneTimer = setTimeout(() => onDone(), 1900)
    return () => { clearTimeout(fadeTimer); clearTimeout(doneTimer) }
  }, [onDone])

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center md:hidden"
      style={{
        backgroundColor: '#18181b',
        animation: fading ? 'splash-fade-out 0.5s ease-out forwards' : 'none',
      }}
    >
      <div
        style={{ animation: 'splash-logo-in 0.6s cubic-bezier(0.34,1.56,0.64,1) forwards' }}
      >
        <div className="w-24 h-24 rounded-[28px] bg-zinc-800 flex items-center justify-center shadow-2xl">
          <AppLogo size={52} />
        </div>
      </div>
    </div>
  )
}
