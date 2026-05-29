/* Service worker MooreaNews — cache shell + APIs utilitaires */

const CACHE = "mooreanews-v1";
const PRECACHE = ["/", "/app", "/manifest.webmanifest", "/brand/logo.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)).then(() => {
      self.skipWaiting();
    }),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
    ).then(() => {
      self.clients.claim();
    }),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  if (req.method !== "GET") return;

  const isUtilityApi =
    url.pathname.startsWith("/api/ferries") ||
    url.pathname.startsWith("/api/weather") ||
    url.pathname.startsWith("/api/tides") ||
    url.pathname.startsWith("/api/moorea-du-jour") ||
    url.pathname.startsWith("/api/alerts");

  if (isUtilityApi) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const clone = res.clone();
          caches.open(CACHE).then((cache) => cache.put(req, clone));
          return res;
        })
        .catch(() => caches.match(req)),
    );
    return;
  }

  if (url.origin === self.location.origin && req.mode === "navigate") {
    event.respondWith(
      fetch(req).catch(() => caches.match("/app") ?? caches.match("/")),
    );
  }
});
