// CoTask service worker
// Görevi sadece internet yokken açılan sayfalar için "çevrimdışı" ekranı göstermek.
// Ekip verisi içeren sayfalar (görevler, sohbet, dosyalar) bilerek ÖNBELLEĞE ALINMAZ:
// giriş gerektiren içerik cihazda saklanmasın ve her zaman güncel gelsin.

const CACHE = "cotask-offline-v1";
const OFFLINE_URL = "/offline.html";
const PRECACHE = [OFFLINE_URL, "/icons/icon-192.png", "/icons/logo.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Sadece sayfa açılışları (navigasyon): önce ağ, ağ yoksa çevrimdışı ekranı
  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(() => caches.match(OFFLINE_URL)));
    return;
  }

  // Çevrimdışı ekranın kendi dosyaları (ikon, logo) önbellekten
  const url = new URL(request.url);
  if (url.origin === self.location.origin && PRECACHE.includes(url.pathname)) {
    event.respondWith(caches.match(request).then((hit) => hit || fetch(request)));
  }
  // Diğer tüm istekler (veri, sunucu işlemleri, Supabase) normal şekilde ağa gider
});
