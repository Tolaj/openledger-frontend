import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Download, X, Share, SquarePlus } from 'lucide-react'

function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
}

function isInStandaloneMode() {
  return window.navigator.standalone === true ||
    window.matchMedia('(display-mode: standalone)').matches
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null) // Android/Chrome
  const [showIOSGuide, setShowIOSGuide]     = useState(false)
  const [dismissed, setDismissed]           = useState(false)

  useEffect(() => {
    // Already installed — don't show anything
    if (isInStandaloneMode()) return

    // Android / Chrome — catch the native install prompt
    const handler = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  if (dismissed || isInStandaloneMode()) return null

  // ── Android/Chrome: real install button ──────────────────────────────────
  const handleAndroidInstall = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') setDismissed(true)
    setDeferredPrompt(null)
  }

  // ── iOS: show instruction sheet ──────────────────────────────────────────
  const handleIOSClick = () => setShowIOSGuide(true)

  const visible = deferredPrompt || isIOS()
  if (!visible) return null

  return (
    <>
      {/* Floating install button */}
      <button
        onClick={isIOS() ? handleIOSClick : handleAndroidInstall}
        className="fixed bottom-24 right-4 z-50 flex items-center gap-2 bg-zinc-900 text-white text-xs font-bold px-4 py-2.5 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.25)] hover:bg-zinc-800 active:scale-95 transition-all"
        style={{ paddingBottom: 'max(0.625rem, env(safe-area-inset-bottom))' }}
      >
        <Download size={14} />
        Add to Home Screen
      </button>

      {/* iOS instruction sheet */}
      {showIOSGuide && createPortal(
        <div className="fixed inset-0 z-[100] flex items-end justify-center"
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
          onClick={() => setShowIOSGuide(false)}>
          <div
            className="bg-white w-full max-w-md rounded-t-3xl p-6 pb-10"
            style={{ paddingBottom: 'max(2.5rem, env(safe-area-inset-bottom))' }}
            onClick={e => e.stopPropagation()}>
            {/* Handle */}
            <div className="w-10 h-1 bg-zinc-200 rounded-full mx-auto mb-5" />

            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-extrabold text-zinc-900">Add to Home Screen</h3>
              <button onClick={() => { setShowIOSGuide(false); setDismissed(true) }}
                className="w-7 h-7 flex items-center justify-center rounded-full bg-zinc-100 text-zinc-500">
                <X size={14} />
              </button>
            </div>

            <div className="flex flex-col gap-4">
              {[
                {
                  icon: Share,
                  iconBg: 'bg-blue-50',
                  iconColor: 'text-blue-500',
                  step: '1',
                  title: 'Tap the Share button',
                  desc: 'Tap the share icon at the bottom of Safari (the square with an arrow pointing up).',
                },
                {
                  icon: SquarePlus,
                  iconBg: 'bg-emerald-50',
                  iconColor: 'text-emerald-600',
                  step: '2',
                  title: 'Tap "Add to Home Screen"',
                  desc: 'Scroll down in the share sheet and tap "Add to Home Screen", then tap Add.',
                },
              ].map(s => {
                const Icon = s.icon
                return (
                  <div key={s.step} className="flex gap-3 items-start">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${s.iconBg}`}>
                      <Icon size={18} className={s.iconColor} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-zinc-900">{s.title}</p>
                      <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">{s.desc}</p>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Visual hint: Safari bottom bar */}
            <div className="mt-6 bg-zinc-50 border border-zinc-200 rounded-2xl p-3 flex items-center justify-between">
              <div className="flex gap-3 text-zinc-300">
                <span className="text-xs">←</span>
                <span className="text-xs">→</span>
              </div>
              <div className="flex-1 mx-3 bg-white border border-zinc-200 rounded-lg h-7 flex items-center px-2">
                <span className="text-[9px] text-zinc-400 truncate">openledger-frontend.vercel.app</span>
              </div>
              <div className="w-7 h-7 bg-blue-500 rounded-lg flex items-center justify-center">
                <Share size={13} className="text-white" />
              </div>
            </div>
            <p className="text-center text-[10px] text-zinc-400 mt-2">Tap the blue Share button above ↑</p>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
