self.addEventListener('push', (event) => {
  let payload = { title: '校园服务', body: '', data: {} }
  try {
    if (event.data) {
      payload = { ...payload, ...event.data.json() }
    }
  } catch {
    /* ignore */
  }
  const title = payload.title || '校园服务'
  const body = payload.body || ''
  const data = payload.data || {}
  event.waitUntil(self.registration.showNotification(title, { body, data, icon: '/favicon.ico' }))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data && event.notification.data.url ? event.notification.data.url : '/market/chat'
  const full = new URL(url, self.location.origin).href
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const c of clientList) {
        if (c.url.includes(self.location.origin) && 'focus' in c) return c.focus()
      }
      if (self.clients.openWindow) return self.clients.openWindow(full)
    }),
  )
})
