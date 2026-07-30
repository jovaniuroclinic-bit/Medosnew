const CACHE="medos-sentinel-a1";const ASSETS=["/","/app.css","/app.js","/manifest.webmanifest","/icons/sentinel.svg"];
self.addEventListener("install",event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS))));
self.addEventListener("activate",event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key))))));
self.addEventListener("fetch",event=>{if(event.request.method!=="GET"||new URL(event.request.url).pathname.startsWith("/api/"))return;event.respondWith(caches.match(event.request).then(hit=>hit??fetch(event.request)));});
