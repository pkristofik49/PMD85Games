/* Version changes on every commit. All URLs are relative for GitHub Pages project paths. */
importScripts('./version.js');
const PREFIX = 'flappy-pmd85-';
const CACHE = PREFIX + globalThis.FLAPPY_VERSION;
const FILES = ['./', './index.html', './style.css', './version.js', './manifest.webmanifest', './manifest.en.webmanifest',
  './src/app.js', './src/engine.js', './src/render.js', './src/graphics.js', './src/motion.js', './src/transition.js', './src/pixel-font.js', './src/audio.js', './src/i18n.js', './src/translations.js', './assets/game-data.js', './assets/title-screen.png', './assets/modern-sprites.png', './assets/modern-crystal.png',
  './assets/icon.svg', './assets/icon-192.png', './assets/icon-512.png', './assets/icon-maskable-512.png',
  './src/retro.js', './assets/retro-data.js', './assets/title-sharp.png', './assets/title-msx.png', './assets/title-nes.png', './assets/title-pmd85-3.gif', './assets/modern-mole-walk.png',
  './src/passwords.js', './assets/sector-passwords.js', './src/enemy-ai.js', './assets/pmd-ai-probes.js',
  './vendor/vue.esm-browser.prod.js'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES)));
  // Keep the current running game intact; the next session activates this version.
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith(PREFIX) && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin || !url.href.startsWith(self.registration.scope)) return;
  event.respondWith(caches.open(CACHE).then(async cache => {
    const cached = await cache.match(event.request, {ignoreSearch: true});
    if (cached) return cached;
    try { return await fetch(event.request); }
    catch (error) { if (event.request.mode === 'navigate') return cache.match('./index.html'); throw error; }
  }));
});
