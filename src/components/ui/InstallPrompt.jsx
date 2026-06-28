import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Share, SquarePlus, MoreVertical } from 'lucide-react'
import AppLogo from './AppLogo'

// Capture the event at module level — fires before React mounts
let _deferred = null
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault()
  _deferred = e
})

function isInStandaloneMode() {
  return window.navigator.standalone === true ||
    window.matchMedia('(display-mode: standalone)').matches
}

function getIOSBrowser() {
  const ua = navigator.userAgent
  if (!/iphone|ipad|ipod/i.test(ua)) return null
  if (/CriOS/i.test(ua))  return 'chrome'
  if (/FxiOS/i.test(ua))  return 'firefox'
  if (/EdgiOS/i.test(ua)) return 'edge'
  return 'safari'
}

function isAndroid() {
  return /android/i.test(navigator.userAgent)
}

const IOS_STEPS = {
  safari: [
    { icon: Share,        bg: 'bg-blue-50',    color: 'text-blue-500',    title: 'Tap the Share button',  desc: 'Tap the share icon (box with arrow up) at the bottom of Safari.' },
    { icon: SquarePlus,   bg: 'bg-emerald-50', color: 'text-emerald-600', title: 'Add to Home Screen',    desc: 'Scroll and tap "Add to Home Screen", then Add.' },
  ],
  chrome: [
    { icon: MoreVertical, bg: 'bg-zinc-100',   color: 'text-zinc-600',    title: 'Tap the menu ⋮',       desc: 'Tap ⋮ in the top-right corner of Chrome.' },
    { icon: SquarePlus,   bg: 'bg-emerald-50', color: 'text-emerald-600', title: 'Add to Home Screen',    desc: 'Tap "Add to Home Screen", then Add.' },
  ],
  firefox: [
    { icon: MoreVertical, bg: 'bg-orange-50',  color: 'text-orange-500',  title: 'Tap the menu ⋮',       desc: 'Tap ⋮ at the bottom of Firefox.' },
    { icon: SquarePlus,   bg: 'bg-emerald-50', color: 'text-emerald-600', title: 'Add to Home Screen',    desc: 'Tap "Add to Home Screen", then Add.' },
  ],
  edge: [
    { icon: MoreVertical, bg: 'bg-blue-50',    color: 'text-blue-600',    title: 'Tap the menu …',        desc: 'Tap … at the bottom of Edge.' },
    { icon: SquarePlus,   bg: 'bg-emerald-50', color: 'text-emerald-600', title: 'Add to Phone',          desc: 'Tap "Add to Phone" and confirm.' },
  ],
}

const ANDROID_STEPS = [
  { icon: MoreVertical, bg: 'bg-zinc-100',   color: 'text-zinc-600',    title: 'Tap the menu ⋮',       desc: 'Tap ⋮ in the top-right corner of Chrome.' },
  { icon: SquarePlus,   bg: 'bg-emerald-50', color: 'text-emerald-600', title: 'Add to Home Screen',    desc: 'Tap "Add to Home Screen" or "Install app", then confirm.' },
]

const DISMISSED_KEY = 'ol_install_dismissed'

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(_deferred)
  const [showGuide, setShowGuide]           = useState(false)
  const [dismissed, setDismissedState]      = useState(
    () => localStorage.getItem(DISMISSED_KEY) === '1'
  )

  const dismiss = () => {
    localStorage.setItem(DISMISSED_KEY, '1')
    setDismissedState(true)
  }

  // Pick up the event if it fires after mount (e.g. slow connections)
  useEffect(() => {
    if (isInStandaloneMode()) return
    const handler = (e) => { e.preventDefault(); _deferred = e; setDeferredPrompt(e) }
    window.addEventListener('beforeinstallprompt', handler)
    // Sync module-level ref in case it was captured before mount
    if (_deferred && !deferredPrompt) setDeferredPrompt(_deferred)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  if (dismissed || isInStandaloneMode()) return null

  const iosBrowser = getIOSBrowser()
  const android    = isAndroid()

  // Nothing to show: not iOS, not Android, and no deferred prompt
  if (!deferredPrompt && !iosBrowser && !android) return null

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') dismiss()
      setDeferredPrompt(null)
      _deferred = null
    } else {
      setShowGuide(true)
    }
  }

  const steps = iosBrowser ? IOS_STEPS[iosBrowser] : android ? ANDROID_STEPS : null

  return createPortal(
    <>
      {/* Banner */}
      {!showGuide && (
        <div className="fixed bottom-0 left-0 right-0 z-[60]"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
          <div className="bg-zinc-900 text-white px-4 py-3 flex items-center gap-3 shadow-[0_-4px_24px_rgba(0,0,0,0.2)]">
            <div className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
              <AppLogo size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white leading-tight">Install OpenLedger</p>
              <p className="text-[10px] text-zinc-400 leading-tight">Add to home screen for the best experience</p>
            </div>
            <button onClick={handleInstall}
              className="flex-shrink-0 bg-white text-zinc-900 text-xs font-bold px-3 py-1.5 rounded-lg active:scale-95 transition-all">
              Install
            </button>
            <button onClick={dismiss}
              className="flex-shrink-0 w-6 h-6 flex items-center justify-center text-zinc-500 hover:text-zinc-300">
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Guide sheet (iOS + Android fallback) */}
      {showGuide && steps && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          onClick={() => setShowGuide(false)}>
          <div className="bg-white w-full max-w-md rounded-t-3xl p-6"
            style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
            onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 bg-zinc-200 rounded-full mx-auto mb-5" />

            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-zinc-900 rounded-2xl flex items-center justify-center">
                  <AppLogo size={18} />
                </div>
                <div>
                  <p className="text-sm font-extrabold text-zinc-900">Install OpenLedger</p>
                  <p className="text-xs text-zinc-400">Add to your home screen</p>
                </div>
              </div>
              <button onClick={() => { setShowGuide(false); dismiss() }}
                className="w-7 h-7 flex items-center justify-center rounded-full bg-zinc-100 text-zinc-500">
                <X size={14} />
              </button>
            </div>

            <div className="flex flex-col gap-4 mb-6">
              {steps.map((s, i) => {
                const Icon = s.icon
                return (
                  <div key={i} className="flex gap-3 items-start">
                    <div className="flex-shrink-0 flex flex-col items-center gap-1">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${s.bg}`}>
                        <Icon size={18} className={s.color} />
                      </div>
                      {i < steps.length - 1 && <div className="w-px h-4 bg-zinc-200" />}
                    </div>
                    <div className="pt-1.5">
                      <p className="text-sm font-bold text-zinc-900">{s.title}</p>
                      <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">{s.desc}</p>
                    </div>
                  </div>
                )
              })}
            </div>

            <button onClick={() => { setShowGuide(false); dismiss() }}
              className="w-full py-3.5 bg-zinc-900 text-white text-sm font-bold rounded-2xl active:bg-zinc-800">
              Got it
            </button>
          </div>
        </div>
      )}
    </>,
    document.body
  )
}
