/* Push + notification handlers, imported into the generated Workbox service worker. */

self.addEventListener('push', (event) => {
  let payload = {}
  try { payload = event.data ? event.data.json() : {} } catch (_) { payload = { title: 'OpenLedger', body: event.data && event.data.text() } }

  const title = payload.title || 'OpenLedger'
  const options = {
    body: payload.body || '',
    tag: payload.tag,
    data: payload.data || {},
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    requireInteraction: !!payload.requireInteraction,
    actions: payload.actions || [],
  }
  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  const data = event.notification.data || {}
  event.notification.close()

  // Confirm-to-deduct flow
  if (data.type === 'recurring-confirm' && data.token) {
    const isYes    = event.action === 'yes'
    const isNo     = event.action === 'no'
    const isSnooze = event.action === 'snooze'
    const url = isYes ? data.confirmUrl : isNo ? data.declineUrl : isSnooze ? data.snoozeUrl : null

    if (url) {
      const doneBody = isYes ? 'Stock deducted ✅' : isSnooze ? 'Snoozed — we’ll remind you in 1h ⏰' : 'Skipped'
      event.waitUntil(
        fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: data.token }),
        }).then(() =>
          self.registration.showNotification('OpenLedger', {
            body: doneBody,
            tag: event.notification.tag,
            icon: '/icons/icon-192.png',
          })
        ).catch(() => {})
      )
      return
    }
  }

  // Default: focus or open the app
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const c of list) { if ('focus' in c) return c.focus() }
      if (self.clients.openWindow) return self.clients.openWindow('/')
    })
  )
})
