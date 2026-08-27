const CACHE_VERSION = 'toledo-v5';
const AUDIO_CACHE = 'toledo-audio-v1';
const CORE = [
  './', './manifest.webmanifest', './images/hero-wide-1600.png',
  './images/app-icon-192.png', './images/app-icon-512.png', './images/apple-touch-icon-180.png',
  './images/places/map-toledo.png', './images/places/old-town.jpg', './images/places/orgaz.jpg',
  './images/places/synagogue.jpg', './images/places/cathedral.jpg', './images/places/alcazar.jpg',
  './images/places/academy.jpg', './images/places/gastronomy.jpg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_VERSION).then((cache) => cache.addAll(CORE.map((path) => new URL(path, self.registration.scope)))));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((key) => ![CACHE_VERSION, AUDIO_CACHE].includes(key)).map((key) => caches.delete(key))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (url.pathname.includes('/audio/')) {
    event.respondWith(
      caches.open(AUDIO_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        const response = await fetch(request);
        if (response.ok) cache.put(request, response.clone());
        return response;
      })
    );
    return;
  }

  event.respondWith(
    fetch(request).then((response) => {
      if (response.ok) caches.open(CACHE_VERSION).then((cache) => cache.put(request, response.clone()));
      return response;
    }).catch(() => caches.match(request).then((cached) => cached || caches.match(new URL('./', self.registration.scope))))
  );
});
