/* Manba AI — Service Worker: rasmlar keshdan tez, kod esa har doim yangi (tarmoq birinchi). */
const CACHE = 'manba-ai-v9';
const SHELL = ['./', 'index.html', 'styles.css', 'app.js', 'icon.svg', 'icon-192.png', 'icon-512.png', 'earth-2k.webp', 'earth-clouds.webp', 'earth-night.webp', 'moon-2k.webp'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => Promise.allSettled(SHELL.map(u => c.add(u)))).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(k => Promise.all(k.filter(n => n !== CACHE).map(n => caches.delete(n)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return;
  const put = res => { if (res.ok) { const cp = res.clone(); caches.open(CACHE).then(c => c.put(r, cp)); } return res; };
  if (/\.(webp|png|svg|jpg)$/.test(new URL(r.url).pathname)) { e.respondWith(caches.match(r).then(m => m || fetch(r).then(put))); return; }
  e.respondWith(fetch(r).then(put).catch(() => caches.match(r).then(m => m || caches.match('index.html'))));
});
