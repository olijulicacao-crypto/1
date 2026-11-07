// Guarda la app en el teléfono para que abra rápido y funcione sin internet.
const VERSION = 'club-olijuli-v5';
const ARCHIVOS = [
  './', './index.html', './manifest.webmanifest', './css/app.css',
  './js/app.js', './js/util.js', './js/datos.js', './js/inicio.js', './js/gato.js', './js/salud.js', './js/perdido.js', './js/ajustes.js', './js/michi.js', './js/stickers.js', './js/diario.js', './js/juego.js', './js/fondos.js', './js/club.js',
  './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png', './icons/favicon.png', './icons/logo-olijuli.jpg'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(ARCHIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(claves => Promise.all(claves.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Fuentes de Google: se guardan la primera vez que se usan.
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(caches.open(VERSION).then(c => c.match(req).then(r => r || fetch(req).then(res => { c.put(req, res.clone()); return res; }))));
    return;
  }
  if (url.origin !== location.origin) return;

  // Archivos de la app: primero internet (para recibir mejoras), si no hay, la copia guardada.
  e.respondWith(
    fetch(req).then(res => {
      const copia = res.clone();
      caches.open(VERSION).then(c => c.put(req, copia));
      return res;
    }).catch(() => caches.match(req).then(r => r || caches.match('./index.html')))
  );
});
