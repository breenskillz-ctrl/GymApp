// Service worker: makes the app available offline.
const CACHE = 'gymapp-v12';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/styles.css',
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './js/app.js',
  './js/data.js',
  './js/store.js',
  './js/utils.js',
  './js/charts.js',
  './js/timer.js',
  './js/icons.js',
  './js/photos.js',
  './js/blocks.js',
  './js/views/log.js',
  './js/views/programs.js',
  './js/views/exercises.js',
  './js/views/progress.js',
  './js/views/timers.js',
  './js/views/picker.js',
  './js/views/addsheet.js',
  './js/views/seteditor.js',
  './js/views/blocks.js',
  './js/views/blockeditor.js',
];

self.addEventListener('install', (e) => {
  // `cache: 'reload'` bypasses the browser's HTTP cache so the offline copy is always the new version
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS.map((u) => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

// Network first, falling back to the cache when offline.
// `cache: 'no-cache'` makes the browser check with the server every time (cheap 304 responses), so a new
// version never mixes with files from the browser's HTTP cache (GitHub Pages caches files for 10 minutes).
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(
    fetch(e.request.url, { cache: 'no-cache', credentials: 'same-origin' })
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy));
        return res;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true })),
  );
});
