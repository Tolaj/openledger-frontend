import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Download, X, Share, SquarePlus, MoreVertical } from 'lucide-react'

function getIOSBrowser() {
  const ua = navigator.userAgent
  if (!/iphone|ipad|ipod/i.test(ua)) return null
  if (/CriOS/i.test(ua))  return 'chrome'   // Chrome on iOS
  if (/FxiOS/i.test(ua))  return 'firefox'  // Firefox on iOS
  if (/EdgiOS/i.test(ua)) return 'edge'     // Edge on iOS
  return 'safari'
}

function isInStandaloneMode() {
  return window.navigator.standalone === true ||
    window.matchMedia('(display-mode: standalone)').matches
}

const BROWSER_STEPS = {
  safari: {
    label: 'Safari',
    steps: [
      {
        icon: Share,
        iconBg: 'bg-blue-50', iconColor: 'text-blue-500',
        title: 'Tap the Share button',
        desc: 'Tap the share icon (□↑) in the Safari toolbar at the bottom of the screen.',
      },
      {
        icon: SquarePlus,
        iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600',
        title: 'Tap "Add to Home Screen"',
        desc: 'Scroll down in the share sheet, tap "Add to Home Screen", then tap Add.',
      },
    ],
    visual: (
      <div className="mt-5 bg-zinc-50 border border-zinc-200 rounded-2xl p-3 flex items-center justify-between">
        <div className="flex gap-3 text-zinc-300 text-xs"><span>←</span><span>→</span></div>
        <div className="flex-1 mx-3 bg-white border border-zinc-200 rounded-lg h-7 flex items-center px-2">
          <span className="text-[9px] text-zinc-400 truncate">openledger-frontend.vercel.app</span>
        </div>
        <div className="w-7 h-7 bg-blue-500 rounded-lg flex items-center justify-center">
          <Share size={13} className="text-white" />
        </div>
      </div>
    ),
    hint: 'Tap the Share button (blue icon above) ↑',
  },
  chrome: {
    label: 'Chrome',
    steps: [
      {
        icon: MoreVertical,
        iconBg: 'bg-zinc-100', iconColor: 'text-zinc-600',
        title: 'Tap the menu (⋮)',
        desc: 'Tap the three-dot menu icon in the top-right corner of Chrome.',
      },
      {
        icon: SquarePlus,
        iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600',
        title: 'Tap "Add to Home Screen"',
        desc: 'Scroll down in the menu and tap "Add to Home Screen", then tap Add.',
      },
    ],
    visual: (
      <div className="mt-5 bg-zinc-50 border border-zinc-200 rounded-2xl p-3 flex items-center justify-between">
        <div className="flex-1 bg-white border border-zinc-200 rounded-full h-8 flex items-center px-3">
          <span className="text-[9px] text-zinc-400 truncate">openledger-frontend.vercel.app</span>
        </div>
        <div className="w-8 h-8 ml-2 flex items-center justify-center">
          <MoreVertical size={16} className="text-zinc-500" />
        </div>
      </div>
    ),
    hint: 'Tap the ⋮ menu in the top-right corner ↑',
  },
  edge: {
    label: 'Edge',
    steps: [
      {
        icon: MoreVertical,
        iconBg: 'bg-blue-50', iconColor: 'text-blue-600',
        title: 'Tap the menu (…)',
        desc: 'Tap the three-dot menu icon at the bottom of Edge.',
      },
      {
        icon: SquarePlus,
        iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600',
        title: 'Tap "Add to Phone"',
        desc: 'Tap "Add to Phone" or "Add to Home Screen" and confirm.',
      },
    ],
    visual: null,
    hint: 'Tap the … menu at the bottom of Edge',
  },
  firefox: {
    label: 'Firefox',
    steps: [
      {
        icon: MoreVertical,
        iconBg: 'bg-orange-50', iconColor: 'text-orange-500',
        title: 'Tap the menu (⋮)',
        desc: 'Tap the three-dot menu icon at the bottom of Firefox.',
      },
      {
        icon: SquarePlus,
        iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600',
        title: 'Tap "Add to Home Screen"',
        desc: 'Tap "Add to Home Screen" in the menu and confirm.',
      },
    ],
    visual: null,
    hint: 'Tap the ⋮ menu at the bottom of Firefox',
  },
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showGuide, setShowGuide]           = useState(false)
  const [dismissed, setDismissed]           = useState(false)

  useEffect(() => {
    if (isInStandaloneMode()) return
    const handler = (e) => { e.preventDefault(); setDeferredPrompt(e) }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const iosBrowser = getIOSBrowser()

  if (dismissed || isInStandaloneMode()) return null
  if (!deferredPrompt && !iosBrowser) return null

  const handleClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') setDismissed(true)
      setDeferredPrompt(null)
    } else {
      setShowGuide(true)
    }
  }

  const guide = iosBrowser ? BROWSER_STEPS[iosBrowser] : null

  return (
    <>
      <button
        onClick={handleClick}
        className="fixed bottom-24 right-4 z-50 flex items-center gap-2 bg-zinc-900 text-white text-xs font-bold px-4 py-2.5 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.25)] hover:bg-zinc-800 active:scale-95 transition-all"
      >
        <Download size={14} />
        Add to Home Screen
      </button>

      {showGuide && guide && createPortal(
        <div className="fixed inset-0 z-[100] flex items-end justify-center"
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
          onClick={() => setShowGuide(false)}>
          <div
            className="bg-white w-full max-w-md rounded-t-3xl p-6"
            style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom))' }}
            onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 bg-zinc-200 rounded-full mx-auto mb-5" />

            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-base font-extrabold text-zinc-900">Add to Home Screen</h3>
                <p className="text-xs text-zinc-400 mt-0.5">{guide.label} on iPhone</p>
              </div>
              <button
                onClick={() => { setShowGuide(false); setDismissed(true) }}
                className="w-7 h-7 flex items-center justify-center rounded-full bg-zinc-100 text-zinc-500">
                <X size={14} />
              </button>
            </div>

            <div className="flex flex-col gap-4">
              {guide.steps.map((s, i) => {
                const Icon = s.icon
                return (
                  <div key={i} className="flex gap-3 items-start">
                    <div className="flex-shrink-0 flex flex-col items-center gap-1">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${s.iconBg}`}>
                        <Icon size={18} className={s.iconColor} />
                      </div>
                      {i < guide.steps.length - 1 && <div className="w-px h-4 bg-zinc-200" />}
                    </div>
                    <div className="pt-1">
                      <p className="text-sm font-bold text-zinc-900">{s.title}</p>
                      <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">{s.desc}</p>
                    </div>
                  </div>
                )
              })}
            </div>

            {guide.visual}
            {guide.hint && <p className="text-center text-[10px] text-zinc-400 mt-2">{guide.hint}</p>}

            <button
              onClick={() => { setShowGuide(false); setDismissed(true) }}
              className="mt-5 w-full py-3 bg-zinc-900 text-white text-sm font-bold rounded-2xl">
              Got it
            </button>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
