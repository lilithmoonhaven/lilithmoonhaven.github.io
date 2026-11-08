/* Lilith Moon Haven Colouring Book — service worker.
   Caches the app shell pieces that live alongside this file (images, icons,
   manifest) so repeat visits load fast. Everything is best-effort: if a
   cache step fails, the app still works straight from the network. */
var CACHE = 'lilith-colouring-v3';
var FILES = [
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png',
  './media-generation-lilith-colouring-title-page-0-49ad84c6-b747-4b09-b07d-92e7a96838d7.webp',
  './media-generation-lilith-colouring-page-01-lilit-0-df4a05d1-4777-428a-a873-5edf238d42c4.webp',
  './media-generation-lilith-colouring-page-02-lilit-0-0893c970-c39d-41c6-aacc-49cdfca064a7.webp',
  './media-generation-lilith-colouring-page-03-lilit-0-8e4d613b-e951-4333-94b3-02a9cdc61ff2.webp',
  './media-generation-lilith-colouring-page-04-lilit-0-b491c44a-c3ab-488f-9a2a-cea680d19c3e.webp',
  './media-generation-lilith-colouring-page-05-lilit-0-04f6f77d-37d5-41f8-ad37-943fdc55905e.webp',
  './media-generation-lilith-colouring-page-06-lilit-0-70cb68d2-0530-4e5f-8ef3-7e3cf4d091f8.webp',
  './media-generation-lilith-colouring-page-07-lilit-0-1bc9e865-97b3-4b8b-b78b-4ac0389e384a.webp',
  './media-generation-lilith-level1-very-easy-moon-g-0-d934d7c0-c6f8-447d-b595-b89daea7fb16.webp',
  './media-generation-lilith-level2-easy-night-bench-0-405a5928-ccf0-4844-a423-31ccc4b639e8.webp'
];
self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) { return c.addAll(FILES); })
      .then(function () { return self.skipWaiting(); })
      .catch(function () {})
  );
});
self.addEventListener('activate', function (e) {
  // Delete every older cache so a phone can never be served a stale
  // copy of the app shell from a previous version.
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) {
        return k === CACHE ? null : caches.delete(k);
      }));
    }).then(function () { return self.clients.claim(); }).catch(function () {})
  );
});
self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  // The book's PAGE ITSELF is network-first: a published fix must
  // reach the phone on the FIRST open after it ships, not be served
  // stale from the cache. The fresh page is still copied into the
  // cache as it loads, and when the network is unavailable the
  // cached page is served, so the book keeps working offline.
  if (e.request.mode === 'navigate' || e.request.destination === 'document') {
    e.respondWith(
      caches.open(CACHE).then(function (cache) {
        return fetch(e.request).then(function (resp) {
          if (resp && (resp.status === 200 || resp.type === 'opaque')) {
            cache.put(e.request, resp.clone()).catch(function () {});
          }
          return resp;
        }).catch(function () {
          return cache.match(e.request).then(function (cached) {
            return cached || cache.match('./');
          });
        });
      })
    );
    return;
  }
  // Everything else (page pictures, music, icons, fonts):
  // stale-while-revalidate — serve the cached copy at once if there
  // is one, and refresh it from the network in the background.
  e.respondWith(
    caches.open(CACHE).then(function (cache) {
      return cache.match(e.request).then(function (cached) {
        var network = fetch(e.request).then(function (resp) {
          if (resp && (resp.status === 200 || resp.type === 'opaque')) {
            cache.put(e.request, resp.clone()).catch(function () {});
          }
          return resp;
        }).catch(function () { return cached; });
        return cached || network;
      });
    })
  );
});
