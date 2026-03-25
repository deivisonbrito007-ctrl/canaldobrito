// Custom service worker for push notifications
// This runs alongside the vite-plugin-pwa generated SW

self.addEventListener('push', (event) => {
  if (!event.data) return;

  let data;
  try {
    data = event.data.json();
  } catch {
    data = { title: 'Canal do Brito', body: event.data.text() };
  }

  const options = {
    body: data.body || '',
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    vibrate: [200, 100, 200],
    tag: data.tag || 'game-reminder',
    renotify: true,
    data: {
      url: data.url || '/',
    },
    actions: [
      { action: 'open', title: 'Abrir' },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Canal do Brito', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const url = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});
