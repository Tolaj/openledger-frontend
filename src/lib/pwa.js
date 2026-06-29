// Captures the PWA install prompt as early as possible (the
// `beforeinstallprompt` event fires once, often before React mounts) and
// lets any component read it or subscribe for when it becomes available.

let deferred = null
const listeners = new Set()

if (typeof window !== 'undefined' && !window.__pwaInstallInit) {
  window.__pwaInstallInit = true
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferred = e
    listeners.forEach((l) => l(e))
  })
  window.addEventListener('appinstalled', () => {
    deferred = null
    listeners.forEach((l) => l(null))
  })
}

export function getDeferredPrompt() {
  return deferred
}

export function clearDeferredPrompt() {
  deferred = null
}

/** Subscribe to availability changes. Returns an unsubscribe fn. */
export function onInstallAvailable(cb) {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

export function isStandalone() {
  return (
    window.navigator.standalone === true ||
    window.matchMedia('(display-mode: standalone)').matches
  )
}
