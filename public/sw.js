const CACHE_NAME = "narasa-bk-v3";
const PRECACHE_URLS = ["/", "/manifest.json", "/icon-192.png", "/icon-512.png", "/logo-narasa.jpg"];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)).catch(() => {})
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET" || request.mode !== "navigate") return;
  const url = new URL(request.url);
  if (url.pathname.startsWith("/api/") || url.pathname.endsWith(".apk")) {
    return;
  }
  event.respondWith(
    fetch(request).catch(() => caches.match("/"))
  );
});
