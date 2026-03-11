const CACHE_NAME = 'pwa-demo-v1';

// Ресурсы для кэширования
const urlsToCache = [
  '/',
  '/index.html',
  '/static/js/main.chunk.js',
  '/static/js/0.chunk.js',
  '/static/js/bundle.js',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/offline.html'
];

// Установка Service Worker
self.addEventListener('install', (event) => {
  console.log('Service Worker устанавливается...');
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Кэшируем ресурсы...');
        return cache.addAll(urlsToCache);
      })
      .catch(error => {
        console.error('Ошибка кэширования:', error);
      })
  );
});

// Активация и очистка
self.addEventListener('activate', (event) => {
  console.log('Service Worker активирован');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Удаляем старый кэш:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Стратегия кэширования
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  // Стратегия: Network First для HTML, Cache First для остального
  if (event.request.mode === 'navigate') {
    // Для навигации - сначала сеть, потом кэш
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          return caches.match('/offline.html');
        })
    );
  } else {
    // Для остальных ресурсов - сначала кэш, потом сеть
    event.respondWith(
      caches.match(event.request)
        .then(response => {
          if (response) {
            return response;
          }
          return fetch(event.request).then(response => {
            // Кэшируем новые ресурсы
            if (response.status === 200) {
              const responseClone = response.clone();
              caches.open(CACHE_NAME).then(cache => {
                cache.put(event.request, responseClone);
              });
            }
            return response;
          });
        })
    );
  }
});

// Обработка push-уведомлений
self.addEventListener('push', (event) => {
  const options = {
    body: event.data?.text() || 'Новое уведомление',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      { action: 'open', title: 'Открыть' },
      { action: 'close', title: 'Закрыть' }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('PWA Демо', options)
  );
});

// Обработка кликов по уведомлениям
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'open') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Фоновая синхронизация
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-data') {
    event.waitUntil(syncData());
  }
});

async function syncData() {
  try {
    const cache = await caches.open(CACHE_NAME);
    const requests = await cache.keys();
    console.log('🔄 Фоновая синхронизация:', requests.length);
  } catch (error) {
    console.error('❌ Ошибка синхронизации:', error);
  }
}