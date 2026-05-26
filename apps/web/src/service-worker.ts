/// <reference types="@sveltejs/kit" />
import { build, files, version } from '$service-worker';

const CACHE   = `notion-clone-${version}`;
const API_CACHE = 'notion-clone-api';
const ASSETS  = [...build, ...files];

// ── Install: pre-cache all static assets ─────────────────────────────────────
self.addEventListener('install', (e) => {
  (e as ExtendableEvent).waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(ASSETS))
      .then(() => (self as unknown as ServiceWorkerGlobalScope).skipWaiting())
  );
});

// ── Activate: clean up stale static caches ───────────────────────────────────
self.addEventListener('activate', (e) => {
  (e as ExtendableEvent).waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== CACHE && k !== API_CACHE)
          .map(k => caches.delete(k))
      )
    ).then(() => (self as unknown as ServiceWorkerGlobalScope).clients.claim())
  );
});

// ── Fetch: route-based caching strategy ──────────────────────────────────────
self.addEventListener('fetch', (e) => {
  const event   = e as FetchEvent;
  const { request } = event;
  const url     = new URL(request.url);

  // Only handle same-origin GET requests
  if (request.method !== 'GET') return;
  if (url.origin !== self.location.origin) return;

  // API routes → NetworkFirst (cache for offline fallback)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Pre-cached static assets → CacheFirst
  if (ASSETS.includes(url.pathname)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Navigation → try network, fall back to cached shell
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match('/').then(r => r ?? new Response('Offline', { status: 503 }))
      )
    );
    return;
  }
});

async function cacheFirst(request: Request): Promise<Response> {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  const cache    = await caches.open(CACHE);
  cache.put(request, response.clone());
  return response;
}

async function networkFirst(request: Request): Promise<Response> {
  const cache = await caches.open(API_CACHE);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    return new Response(JSON.stringify({ error: 'Offline', offline: true }), {
      status:  503,
      headers: { 'content-type': 'application/json' }
    });
  }
}
