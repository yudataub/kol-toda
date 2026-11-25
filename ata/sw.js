// Kiryat Ata app (PWA, 25.11.2026): network first, the last copy when offline. Scope /ata/.
var C = "ata-app-v1";
self.addEventListener("install", function () { self.skipWaiting(); });
self.addEventListener("activate", function (e) { e.waitUntil(self.clients.claim()); });
self.addEventListener("fetch", function (e) {
  var r = e.request;
  if (r.method !== "GET" || new URL(r.url).origin !== location.origin) return;
  e.respondWith(fetch(r).then(function (res) {
    if (res.ok) { var cp = res.clone(); caches.open(C).then(function (c) { c.put(r, cp); }); }
    return res;
  }).catch(function () {
    return caches.match(r).then(function (m) {
      if (m) return m;
      if (r.mode !== "navigate") return Response.error();
      return caches.match("/ata/").then(function (h) { return h || Response.error(); });
    });
  }));
});
