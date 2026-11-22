const RELEASE = '1.010';
const SHELL = [
  "./",
  "assets/auto-native.js",
  "assets/auto-screen.png",
  "assets/boulder-native.js",
  "assets/boulder-title.png",
  "assets/pampuch-data.js",
  "assets/pampuch-native.js",
  "assets/pampuch-sprites-preview.png",
  "assets/pampuch-sprites.json",
  "assets/pampuch-sprites.png",
  "assets/pampuch-title.png",
  "assets/zaby-native.js",
  "assets/zaby-title.png",
  "commit.json",
  "games/flappy/assets/README.md",
  "games/flappy/assets/game-data.js",
  "games/flappy/assets/icon-192.png",
  "games/flappy/assets/icon-512.png",
  "games/flappy/assets/icon-maskable-512.png",
  "games/flappy/assets/icon.svg",
  "games/flappy/assets/modern-crystal-prompt.txt",
  "games/flappy/assets/modern-crystal.png",
  "games/flappy/assets/modern-mole-prompt.txt",
  "games/flappy/assets/modern-mole-walk-prompt.txt",
  "games/flappy/assets/modern-mole-walk.png",
  "games/flappy/assets/modern-prompt.txt",
  "games/flappy/assets/modern-sprites.png",
  "games/flappy/assets/pmd-ai-probes.js",
  "games/flappy/assets/retro-data.js",
  "games/flappy/assets/sector-passwords.js",
  "games/flappy/assets/sprites.png",
  "games/flappy/assets/title-msx.png",
  "games/flappy/assets/title-nes.png",
  "games/flappy/assets/title-pmd85-3.gif",
  "games/flappy/assets/title-screen.png",
  "games/flappy/assets/title-sharp.png",
  "games/flappy/index.html",
  "games/flappy/manifest.en.webmanifest",
  "games/flappy/manifest.webmanifest",
  "games/flappy/src/app.js",
  "games/flappy/src/audio.js",
  "games/flappy/src/enemy-ai.js",
  "games/flappy/src/engine.js",
  "games/flappy/src/graphics.js",
  "games/flappy/src/i18n.js",
  "games/flappy/src/motion.js",
  "games/flappy/src/passwords.js",
  "games/flappy/src/pixel-font.js",
  "games/flappy/src/render.js",
  "games/flappy/src/retro.js",
  "games/flappy/src/transition.js",
  "games/flappy/src/translations.js",
  "games/flappy/style.css",
  "games/flappy/vendor/VUE-LICENSE.txt",
  "games/flappy/vendor/vue.esm-browser.prod.js",
  "games/flappy/version.js",
  "icons/apple-touch-icon.png",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/icon.svg",
  "icons/maskable-512.png",
  "index.html",
  "js/app.js",
  "js/audio.js",
  "js/auto.js",
  "js/boulder.js",
  "js/i8080.js",
  "js/pampuch-render.js",
  "js/pampuch.js",
  "js/pixel-font.js",
  "js/pmd85.js",
  "js/pwa.js",
  "js/translations.js",
  "js/version.js",
  "js/zaby.js",
  "manifest.webmanifest",
  "styles.css",
  "vendor/LICENSE.pmd-timing",
  "vendor/LICENSE.vue",
  "vendor/vue.global.prod.js"
];
const prefix='pmd85games:'+self.registration.scope+':';
const cacheName=prefix+RELEASE;
self.addEventListener('install',event=>event.waitUntil(caches.open(cacheName).then(cache=>cache.addAll(SHELL))));
// Wait for existing windows to close; never interrupt a running game.
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith(prefix)&&k!==cacheName).map(k=>caches.delete(k))))));
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);if(!url.href.startsWith(self.registration.scope))return;
  if(url.pathname.endsWith('/sw.js'))return;
  event.respondWith(caches.open(cacheName).then(async cache=>{
    const cached=await cache.match(event.request,{ignoreSearch:true});
    if(cached)return cached;
    return fetch(event.request);
  }));
});
