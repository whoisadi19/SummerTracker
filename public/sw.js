const CACHE_NAME = "studyhub-static-v1";
const DYNAMIC_CACHE_NAME = "studyhub-dynamic-v1";

const STATIC_ASSETS = [
  "./",
  "./index.html",
  "./css/style.css?v=2",
  "./js/app.js",
  "./js/data.js",
  "./manifest.json",
  "./icons/icon-180.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

// Install Event
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[Service Worker] Pre-caching static assets");
      // Use map to fetch/cache each asset individually so that if one fails, it doesn't fail the whole cache installation
      const cachePromises = STATIC_ASSETS.map((asset) => {
        return cache.add(asset).catch((err) => {
          console.error(`[Service Worker] Failed to cache static asset: ${asset}`, err);
        });
      });
      return Promise.all(cachePromises);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME && cache !== DYNAMIC_CACHE_NAME) {
            console.log("[Service Worker] Deleting old cache:", cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event
self.addEventListener("fetch", (event) => {
  const requestUrl = new URL(event.request.url);

  // Bypass caching for API routes
  if (requestUrl.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(event.request).catch((err) => {
        console.warn(`[Service Worker] Network error fetching API route: ${requestUrl.pathname}`, err);
        if (requestUrl.pathname === "/api/health") {
          return new Response(JSON.stringify({ status: "offline", database: "disconnected" }), {
            headers: { "Content-Type": "application/json" }
          });
        }
        return new Response(JSON.stringify({ error: "You are offline. Syncing is paused." }), {
          headers: { "Content-Type": "application/json" },
          status: 503
        });
      })
    );
    return;
  }

  // Cache-first for static and external resources (like fonts)
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request).then((networkResponse) => {
        // Only cache successful GET responses
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type === "error" || event.request.method !== "GET") {
          return networkResponse;
        }

        // Cache external assets dynamically (e.g. Google Fonts)
        if (
          requestUrl.origin === self.location.origin ||
          requestUrl.hostname.includes("fonts.googleapis.com") ||
          requestUrl.hostname.includes("fonts.gstatic.com")
        ) {
          const responseToCache = networkResponse.clone();
          caches.open(DYNAMIC_CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache).catch((err) => {
              console.error(`[Service Worker] Failed to save in dynamic cache: ${event.request.url}`, err);
            });
          });
        }

        return networkResponse;
      }).catch((err) => {
        // Offline Fallback for HTML pages (SPA routing fallback)
        const acceptHeader = event.request.headers.get("accept");
        if (acceptHeader && acceptHeader.includes("text/html")) {
          return caches.match("./index.html") || caches.match("./");
        }
        console.error(`[Service Worker] Fetch failed and no cache hit for: ${event.request.url}`, err);
      });
    })
  );
});
