// ZicoAI - guarda a "casca" do app pra abrir rápido. Conversa sempre vai pela internet.
const CACHE = 'zicoai-v27';
const ARQUIVOS = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png', './icon-180.png', './ava.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ARQUIVOS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  // primeiro tenta a versão nova; sem internet, usa a guardada
  e.respondWith(
    fetch(req).then(r => {
      const copia = r.clone();
      caches.open(CACHE).then(c => c.put(req, copia));
      return r;
    }).catch(() => caches.match(req).then(r => r || caches.match('./index.html')))
  );
});
