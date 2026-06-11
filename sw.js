// sw.js — Service Worker KFD
// Estrategia: red primero, caché como respaldo.
// Online siempre sirve fresco (clave en desarrollo); offline sirve lo último visto,
// incluidas las respuestas GET de Supabase ya consultadas.
const CACHE = 'kfd-v1';

const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './styles/base.css',
  './styles/components.css',
  './styles/evaluation.css',
  './styles/screens.css',
  './styles/portal.css',
  './styles/responsive.css',
  './src/supabase.jsx',
  './src/data.jsx',
  './src/icons.jsx',
  './src/ui.jsx',
  './src/shell.jsx',
  './src/app.jsx',
  './src/tweaks-panel.jsx',
  './src/screens/dashboard.jsx',
  './src/screens/patient.jsx',
  './src/screens/evaluation.jsx',
  './src/screens/planning.jsx',
  './src/screens/progress-library-chat.jsx',
  './src/screens/portal.jsx',
  './assets/kfd-mark.svg',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(APP_SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;

  e.respondWith(
    fetch(e.request)
      .then(res => {
        if (res && (res.ok || res.type === 'opaque')) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {});
        }
        return res;
      })
      .catch(() =>
        caches.match(e.request).then(m =>
          m || (e.request.mode === 'navigate'
            ? caches.match('./index.html')
            : new Response('', { status: 504, statusText: 'Offline' }))
        )
      )
  );
});
