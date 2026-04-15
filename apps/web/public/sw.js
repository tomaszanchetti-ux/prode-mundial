/* eslint-disable no-undef */
// Service Worker — Prode Mundial
// Estrategia:
//   - Navegación (HTML): network-first, fallback a /offline
//   - /_next/static/*:   cache-first (inmutables con hash)
//   - Imágenes e íconos: stale-while-revalidate
//   - /api/*:            network-only (datos siempre frescos)
//   - Cross-origin:      sin intercepción (Firebase, football-data, etc.)

const VERSION = "v1";
const STATIC_CACHE = `prode-static-${VERSION}`;
const RUNTIME_CACHE = `prode-runtime-${VERSION}`;

const PRECACHE_URLS = [
  "/offline",
  "/manifest.webmanifest",
  "/icon-192.png",
  "/icon-512.png",
  "/apple-touch-icon.png",
  "/favicon-32.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => ![STATIC_CACHE, RUNTIME_CACHE].includes(k))
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

function cacheFirst(request) {
  return caches.match(request).then((cached) => {
    if (cached) return cached;
    return fetch(request).then((response) => {
      if (response.ok) {
        const clone = response.clone();
        caches.open(RUNTIME_CACHE).then((c) => c.put(request, clone));
      }
      return response;
    });
  });
}

function staleWhileRevalidate(request) {
  return caches.match(request).then((cached) => {
    const networkFetch = fetch(request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(RUNTIME_CACHE).then((c) => c.put(request, clone));
        }
        return response;
      })
      .catch(() => cached);
    return cached || networkFetch;
  });
}

function networkFirstNavigation(request) {
  return fetch(request)
    .then((response) => {
      if (response.ok) {
        const clone = response.clone();
        caches.open(RUNTIME_CACHE).then((c) => c.put(request, clone));
      }
      return response;
    })
    .catch(() =>
      caches.match(request).then((cached) => cached || caches.match("/offline"))
    );
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Solo same-origin: dejamos pasar Firebase, football-data, CDNs, etc.
  if (url.origin !== self.location.origin) return;

  // API: no cachear nunca
  if (url.pathname.startsWith("/api/")) return;

  // Navegación (HTML)
  if (request.mode === "navigate") {
    event.respondWith(networkFirstNavigation(request));
    return;
  }

  // Bundles y chunks hasheados de Next.js
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Imágenes, íconos y manifest
  if (/\.(png|svg|jpg|jpeg|webp|ico|webmanifest)$/i.test(url.pathname)) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }
});

// Permite al cliente forzar actualización (navegación tras deploy nuevo)
self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});
