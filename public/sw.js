// Kelvis AI Progressive Web App Service Worker
const CACHE_NAME = "kelvis-ai-pwa-v2";
const STATIC_ASSETS = [
  "/",
  "/manifest.json",
  "/favicon.svg",
  "/icon-192.svg",
  "/icon-512.svg",
  "/icon-maskable.svg"
];

// Install Event: Pre-cache only icons and manifest
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn("PWA pre-cache notice:", err);
      });
    })
  );
  self.skipWaiting();
});

// Activate Event: Clean up old cache versions and claim clients
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

// Fetch Event: Pass all dev server, API, module, and dynamic requests directly to network
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Bypass service worker completely for API, dynamic server endpoints, Vite modules, node_modules, and scripts
  if (
    url.pathname.startsWith("/api") ||
    url.pathname.startsWith("/chat") ||
    url.pathname.startsWith("/define-text") ||
    url.pathname.startsWith("/execute-code") ||
    url.pathname.startsWith("/supabase") ||
    url.pathname.startsWith("/@vite") ||
    url.pathname.startsWith("/@fs") ||
    url.pathname.startsWith("/src") ||
    url.pathname.startsWith("/node_modules") ||
    url.search.includes("import") ||
    url.search.includes("v=") ||
    url.pathname.endsWith(".tsx") ||
    url.pathname.endsWith(".ts") ||
    url.pathname.endsWith(".jsx") ||
    url.pathname.endsWith(".js") ||
    url.pathname.endsWith(".css") ||
    event.request.method !== "GET"
  ) {
    return;
  }

  // Network-first for everything else
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});
