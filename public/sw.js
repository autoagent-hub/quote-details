const CACHE_NAME = "detailr-assets-v3";
const API_CACHE_NAME = "detailr-api-v2";

const PRECACHE_URLS = [
  "/",
  "/demo",
  "/manifest.json",
  "/favicon.png",
  "/og-image.jpg",
  "/keywords.txt",
];

// Install event - precache core assets and skip waiting immediately
self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS).catch((err) => {
        console.warn("[ServiceWorker] Precache partial error:", err);
      });
    }),
  );
});

// Activate event - clean up all legacy caches and claim clients immediately
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cache) => {
            if (cache !== CACHE_NAME && cache !== API_CACHE_NAME) {
              console.log("[ServiceWorker] Purging stale cache:", cache);
              return caches.delete(cache);
            }
          }),
        );
      })
      .then(() => self.clients.claim()),
  );
});

// Allow client pages to trigger immediate update or cache purge
self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
  if (event.data?.type === "CLEAR_ALL_CACHES") {
    caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k))));
  }
});

// Fetch event handler
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET requests or browser extension URLs
  if (event.request.method !== "GET" || !url.protocol.startsWith("http")) {
    return;
  }

  // Handle document navigations (HTML pages like /, /$business_slug, /demo, /dashboard)
  // Always Network-First so newly published chunk hashes are immediately received
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(async () => {
          const cachedResponse = await caches.match(event.request);
          if (cachedResponse) return cachedResponse;
          const fallback = (await caches.match("/")) || (await caches.match("/demo"));
          return (
            fallback ||
            new Response("Offline - Page not cached", {
              status: 503,
              headers: { "Content-Type": "text/plain" },
            })
          );
        }),
    );
    return;
  }

  // Handle Supabase API calls
  if (url.hostname.includes("supabase") || url.pathname.includes("/rest/v1/")) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(API_CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(async () => {
          const cachedApiResponse = await caches.match(event.request);
          if (cachedApiResponse) return cachedApiResponse;
          return new Response(JSON.stringify({ offline: true, error: "Network unavailable" }), {
            status: 503,
            headers: { "Content-Type": "application/json" },
          });
        }),
    );
    return;
  }

  // Handle static assets (scripts, styles, images, fonts)
  // CRITICAL: Use Network-First for JS and CSS module scripts so version updates never fail with "Importing a module script failed"
  const isScriptOrStyle =
    url.pathname.endsWith(".js") ||
    url.pathname.endsWith(".mjs") ||
    url.pathname.endsWith(".css") ||
    url.pathname.includes("/_build/") ||
    url.pathname.includes("/assets/");

  if (isScriptOrStyle) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(async () => {
          // If offline, attempt to serve cached version
          const cached = await caches.match(event.request);
          if (cached) return cached;
          throw new Error(`Offline and asset not cached: ${event.request.url}`);
        }),
    );
    return;
  }

  // For images and other static assets, cache-first is acceptable
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;
      return fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      });
    }),
  );
});
