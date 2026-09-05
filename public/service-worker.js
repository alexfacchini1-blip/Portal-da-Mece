self.addEventListener('install', function(event) {
  console.log('[Service Worker] Installing Service Worker...');
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  console.log('[Service Worker] Activating Service Worker...');
  event.waitUntil(clients.claim());
});

self.addEventListener('push', function(event) {
  console.log('[Service Worker] Push Received.');
  let data = { title: 'Nova Mensagem', body: 'Você recebeu uma mensagem.' };
  
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: 'Nova Mensagem', body: event.data.text() };
    }
  }

  const title = data.title || 'Lembrete de Escala';
  const options = {
    body: data.body || 'Você tem uma nova notificação.',
    icon: '/pwa-512x512.png',
    badge: '/pwa-512x512.png',
    data: data.url || '/',
    vibrate: [200, 100, 200]
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', function(event) {
  console.log('[Service Worker] Notification click received.');
  event.notification.close();

  const urlToOpen = event.notification.data || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(windowClients) {
      for (var i = 0; i < windowClients.length; i++) {
        var client = windowClients[i];
        if ('focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
