const CACHE_NAME = "detailr-assets-v1";
const API_CACHE_NAME = "detailr-api-v1";

const PRECACHE_URLS = [
  "/",
  "/demo",
  "/manifest.json",
  "/favicon.png",
  "/og-image.jpg",
  "/keywords.txt",
];

// Install event - precache core assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("[ServiceWorker] Precaching core app assets");
        return cache.addAll(PRECACHE_URLS).catch((err) => {
          console.warn("[ServiceWorker] Precache partial error:", err);
        });
      })
      .then(() => self.skipWaiting()),
  );
});

// Activate event - clean up legacy caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cache) => {
            if (cache !== CACHE_NAME && cache !== API_CACHE_NAME) {
              console.log("[ServiceWorker] Deleting old cache:", cache);
              return caches.delete(cache);
            }
          }),
        );
      })
      .then(() => self.clients.claim()),
  );
});

// Fetch event handler
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET requests or browser extension URLs
  if (event.request.method !== "GET" || !url.protocol.startsWith("http")) {
    return;
  }

  // Handle document navigations (HTML pages like /, /$business_slug, /demo)
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
          console.log("[ServiceWorker] Network offline, serving cached page or root fallback");
          const cachedResponse = await caches.match(event.request);
          if (cachedResponse) return cachedResponse;
          // Fallback to cached root or demo page so quote form functions offline
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

  // Handle Supabase API calls (e.g. fetching detailer pricing / business profiles)
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
          console.log(
            "[ServiceWorker] API request offline, checking API cache for:",
            event.request.url,
          );
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
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    }),
  );
});
