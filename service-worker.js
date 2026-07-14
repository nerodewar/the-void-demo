"use strict";

const CACHE_VERSION = "the-void-demo-v1.0.5";
const CORE_ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./narrative.js",
  "./script.js",
  "./ground-control-terminal.js",
  "./pwa.js",
  "./manifest.webmanifest",
  "./debris-field/index.html",
  "./debris-field/styles.css",
  "./debris-field/game.js",
  "./assets/icons/icon-180.png",
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png",
  "./assets/icons/icon-1024.png",
  "./assets/icons/icon-maskable-512.png"
];
const ALL_ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./narrative.js",
  "./script.js",
  "./ground-control-terminal.js",
  "./pwa.js",
  "./manifest.webmanifest",
  "./debris-field/index.html",
  "./debris-field/styles.css",
  "./debris-field/game.js",
  "./assets/icons/icon-180.png",
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png",
  "./assets/icons/icon-1024.png",
  "./assets/icons/icon-maskable-512.png",
  "./assets/IMG00.png",
  "./assets/IMGA1.png",
  "./assets/IMGA2.png",
  "./assets/IMGA3.png",
  "./assets/IMGA4.png",
  "./assets/IMG01.png",
  "./assets/IMG02.png",
  "./assets/IMG03.png",
  "./assets/IMG04.png",
  "./assets/IMG05.png",
  "./assets/IMG06.png",
  "./assets/IMG07.png",
  "./assets/IMG08.png",
  "./assets/IMG09.png",
  "./assets/IMG10.png",
  "./assets/IMG11.png",
  "./assets/IMG12.png",
  "./assets/IMG13.png",
  "./assets/IMG14.png",
  "./assets/IMG15.png",
  "./assets/IMG17.png",
  "./assets/IMG18.png",
  "./assets/IMG19.png",
  "./assets/IMG20.png",
  "./assets/IMG21.png",
  "./assets/IMG22.png",
  "./assets/IMG23.png",
  "./assets/IMG24.png",
  "./assets/IMG25.png",
  "./assets/IMG26.png",
  "./assets/IMG27.png",
  "./assets/IMG28.png",
  "./assets/IMG29.png",
  "./assets/IMG2A.png",
  "./assets/IMG30.png",
  "./assets/IMG31.png",
  "./assets/IMG32.png",
  "./assets/IMG33.png",
  "./assets/IMG34.png",
  "./assets/IMG35.png",
  "./assets/IMG36.png",
  "./assets/IMG37.png",
  "./assets/IMG38.png",
  "./assets/IMG39.png",
  "./assets/IMG40.png",
  "./assets/IMG41.png",
  "./assets/IMG42.png",
  "./assets/IMG43.png",
  "./assets/IMG44.png",
  "./assets/IMG45.png",
  "./assets/IMG46.png",
  "./assets/IMG47.png",
  "./assets/IMG48.png",
  "./assets/IMG49.png",
  "./assets/IMG4A.png",
  "./assets/IMG50.png",
  "./assets/IMG51.png",
  "./assets/IMG52.png",
  "./assets/IMG53.png",
  "./assets/IMG55.png",
  "./assets/IMG56.png",
  "./assets/audio/credits-music.mp3",
  "./assets/audio/gameplay-ambience.wav",
  "./assets/audio/title-theme.mp3"
];

function scopedUrl(path) {
  return new URL(path, self.registration.scope).href;
}

async function putAsset(cache, path, { refresh = false } = {}) {
  const url = scopedUrl(path);
  const existing = await cache.match(url, { ignoreSearch: true });
  if (existing && !refresh) return true;

  // Reuse large unchanged media from the previous app cache. A service-worker
  // version bump should not force the iPad to redownload the entire 142 MB game.
  if (!refresh) {
    const previous = await caches.match(url, { ignoreSearch: true });
    if (previous) {
      await cache.put(url, previous.clone());
      return true;
    }
  }

  const response = await fetch(new Request(url, { cache: "reload", credentials: "same-origin" }));
  if (!response.ok) throw new Error(`HTTP ${response.status} for ${path}`);
  await cache.put(url, response);
  return true;
}

async function cleanupOldCaches() {
  const keys = await caches.keys();
  await Promise.all(
    keys
      .filter((key) => key.startsWith("the-void-") && key !== CACHE_VERSION)
      .map((key) => caches.delete(key))
  );
}

const yieldToBrowser = () => new Promise((resolve) => setTimeout(resolve, 60));

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_VERSION);
    for (const asset of CORE_ASSETS) await putAsset(cache, asset, { refresh: true });
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    // Keep the previous complete archive until the new one is safely ready.
    // This avoids both an offline gap and a giant recache during game launch.
    await self.clients.claim();
  })());
});

async function notify(client, payload) {
  if (client && typeof client.postMessage === "function") client.postMessage(payload);
}

let cacheJob = null;
let cachePaused = false;

async function waitForCacheResume() {
  while (cachePaused) await new Promise((resolve) => setTimeout(resolve, 250));
}

async function cacheAllAssets(client) {
  if (cacheJob) return cacheJob;
  cacheJob = (async () => {
    const cache = await caches.open(CACHE_VERSION);
    let completed = 0;
    let failed = 0;
    for (const asset of ALL_ASSETS) {
      await waitForCacheResume();
      try { await putAsset(cache, asset); }
      catch (error) { failed += 1; console.warn("[The Void SW] Cache failed", asset, error); }
      completed += 1;
      if (completed === ALL_ASSETS.length || completed % 4 === 0) {
        await notify(client, { type: "CACHE_PROGRESS", completed, total: ALL_ASSETS.length });
      }
      await yieldToBrowser();
    }

    if (failed) {
      await notify(client, { type: "CACHE_ERROR", failed, total: ALL_ASSETS.length });
    } else {
      await cleanupOldCaches();
      await notify(client, { type: "OFFLINE_READY", total: ALL_ASSETS.length });
    }
  })().finally(() => { cacheJob = null; });
  return cacheJob;
}

self.addEventListener("message", (event) => {
  const type = event.data?.type;
  if (type === "CACHE_PAUSE") {
    cachePaused = true;
    return;
  }
  if (type === "CACHE_RESUME") {
    cachePaused = false;
    return;
  }
  if (type === "CACHE_ALL_ASSETS") event.waitUntil(cacheAllAssets(event.source));
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  if (event.request.mode === "navigate") {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_VERSION);
      const requestUrl = new URL(event.request.url);
      const isDebrisField = requestUrl.pathname.includes("/debris-field");
      const fallbackUrl = scopedUrl(isDebrisField ? "./debris-field/index.html" : "./index.html");
      const cached = await cache.match(event.request, { ignoreSearch: true })
        || await cache.match(fallbackUrl, { ignoreSearch: true })
        || await caches.match(fallbackUrl, { ignoreSearch: true });
      try {
        const response = await fetch(event.request);
        if (response.ok) cache.put(fallbackUrl, response.clone());
        return response;
      } catch {
        return cached || Response.error();
      }
    })());
    return;
  }

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_VERSION);
    const cached = await cache.match(event.request, { ignoreSearch: true })
      || await caches.match(event.request, { ignoreSearch: true });
    if (cached) return cached;
    try {
      const response = await fetch(event.request);
      if (response.ok) cache.put(event.request, response.clone());
      return response;
    } catch {
      return Response.error();
    }
  })());
});
