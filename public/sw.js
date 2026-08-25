// Kelvis AI Progressive Web App Service Worker
const CACHE_NAME = "kelvis-ai-pwa-v1";
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/favicon.svg",
  "/icon-192.svg",
  "/icon-512.svg",
  "/icon-maskable.svg"
];

// Install Event: Pre-cache core shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn("PWA pre-cache warning:", err);
      });
    })
  );
  self.skipWaiting();
});

// Activate Event: Clean up old cache versions
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event: Network-first for dynamic API routes, Stale-while-revalidate for static assets
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Always pass API and dynamic server endpoints straight to network
  if (
    url.pathname.startsWith("/api") ||
    url.pathname.startsWith("/chat") ||
    url.pathname.startsWith("/define-text") ||
    url.pathname.startsWith("/execute-code") ||
    url.pathname.startsWith("/supabase") ||
    event.request.method !== "GET"
  ) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (
            networkResponse &&
            networkResponse.status === 200 &&
            networkResponse.type === "basic"
          ) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // If offline and requesting navigation, return cached index.html
          if (event.request.mode === "navigate") {
            return caches.match("/index.html");
          }
          return cachedResponse;
        });

      return cachedResponse || fetchPromise;
    })
  );
});
