/* MANBA Service Worker — offline caching + PWA */
const CACHE_NAME = "manba-v5";
const CORE_ASSETS = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

/* Install — cache core assets */
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(CORE_ASSETS).catch((err) => {
        console.warn("SW: some assets failed to cache", err);
      }))
      .then(() => self.skipWaiting())
  );
});

/* Activate — clean old caches */
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

/* Fetch — cache-first for same-origin, network-first for API */
self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Only GET
  if (req.method !== "GET") return;

  // Never cache OpenRouter / external API calls — always network
  if (url.hostname === "openrouter.ai" || url.hostname === "r.jina.ai") {
    return;
  }

  // For same-origin: cache-first, fallback to network
  if (url.origin === location.origin) {
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached;
        return fetch(req).then((res) => {
          if (res && res.status === 200 && res.type === "basic") {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          }
          return res;
        }).catch(() => {
          // Offline fallback
          if (req.mode === "navigate") {
            return caches.match("./index.html");
          }
        });
      })
    );
    return;
  }

  // For CDN scripts (pdf.js, mammoth, etc.) — network-first, cache fallback
  event.respondWith(
    fetch(req).then((res) => {
      if (res && res.status === 200) {
        const clone = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
      }
      return res;
    }).catch(() => caches.match(req))
  );
});
