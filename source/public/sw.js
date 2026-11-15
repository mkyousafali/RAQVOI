// Network-only: never store preview pages, assets, credentials or API responses.
// Offline mode deliberately cannot unlock or reveal the protected store.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));
self.addEventListener('fetch', event => {
  if (event.request.mode !== 'navigate') return;
  event.respondWith(fetch(event.request, { cache: 'no-store' }).catch(() => new Response(
    '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>RAQVOI — Offline</title><body style="margin:0;padding:48px 24px;background:#0b0b0b;color:#d7b65a;text-align:center;font:16px system-ui"><h1>RAQVOI</h1><h2>You’re offline</h2><p>Connect to the internet to open the private preview.</p><button onclick="location.reload()" style="padding:12px 24px;background:#b78b24;color:#0b0b0b;border:0">Try again</button></body></html>',
    { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } }
  )));
});
