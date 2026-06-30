import api from './axios'

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  const out = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i)
  return out
}

export function pushSupported() {
  return typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
}

async function getVapidKey() {
  const envKey = import.meta.env.VITE_VAPID_PUBLIC_KEY
  if (envKey) return envKey
  try {
    const { data } = await api.get('/push/vapid-key')
    return data?.key || null
  } catch { return null }
}

/**
 * Ensure the current device is subscribed to push. Requests permission if needed.
 * Returns true on success. Safe to call repeatedly (idempotent on the backend).
 */
export async function ensurePushSubscribed() {
  if (!pushSupported()) return false

  let permission = Notification.permission
  if (permission === 'default') permission = await Notification.requestPermission()
  if (permission !== 'granted') return false

  const reg = await navigator.serviceWorker.ready
  let sub = await reg.pushManager.getSubscription()

  if (!sub) {
    const key = await getVapidKey()
    if (!key) return false
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(key),
    })
  }

  await api.post('/push/subscribe', { subscription: sub.toJSON() })
  return true
}
