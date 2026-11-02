/* Manba AI 5.0 — GitHub Pages-safe service worker */
"use strict";
const CACHE_NAME = "manba-shell-v5.0";
const BASE = new URL("./", self.registration.scope);
const SHELL = [
  "index.html", "styles.css", "app.js", "orbit.js", "manifest.json",
  "icon.svg", "earth-texture.jpg", "moon-texture.jpg"
].map(path => new URL(path, BASE).toString());

self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    // A missing optional asset must not prevent the whole app from installing.
    await Promise.allSettled(SHELL.map(async url => {
      const response = await fetch(url, { cache: "reload" });
      if (response.ok) await cache.put(url, response);
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith("manba-shell-") && key !== CACHE_NAME).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    try {
      const response = await fetch(request);
      if (response && response.ok) cache.put(request, response.clone()).catch(() => {});
      return response;
    } catch (error) {
      const cached = await cache.match(request);
      if (cached) return cached;
      if (request.mode === "navigate") {
        const fallback = await cache.match(new URL("index.html", BASE).toString());
        if (fallback) return fallback;
      }
      return new Response("Offline — internet aloqasini tekshiring.", { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } });
    }
  })());
});
