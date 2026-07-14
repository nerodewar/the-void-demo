(() => {
  "use strict";

  const status = document.getElementById("offlineStatus");
  let hideTimer = 0;
  let cacheTimer = 0;
  let cacheRequested = false;
  let missionLaunching = false;

  function showStatus(message, { ready = false, linger = 2200 } = {}) {
    if (!status) return;
    window.clearTimeout(hideTimer);
    status.hidden = false;
    status.textContent = message;
    status.classList.toggle("is-ready", ready);
    requestAnimationFrame(() => status.classList.add("is-visible"));
    if (linger > 0) {
      hideTimer = window.setTimeout(() => {
        status.classList.remove("is-visible");
        window.setTimeout(() => { status.hidden = true; }, 400);
      }, linger);
    }
  }

  if (!("serviceWorker" in navigator)) {
    showStatus("OFFLINE INSTALL NOT SUPPORTED IN THIS BROWSER", { linger: 4200 });
    return;
  }

  function requestFullOfflineCache(registration) {
    if (cacheRequested || missionLaunching || document.hidden) return false;
    const worker = registration.active || registration.waiting || registration.installing;
    if (!worker) return false;
    cacheRequested = true;
    showStatus("PREPARING OFFLINE DEMO // BACKGROUND ARCHIVE", { linger: 0 });
    worker.postMessage({ type: "CACHE_ALL_ASSETS" });
    return true;
  }

  function scheduleFullOfflineCache(registration, delay = 12000) {
    window.clearTimeout(cacheTimer);
    cacheTimer = window.setTimeout(() => {
      if (!requestFullOfflineCache(registration)) {
        scheduleFullOfflineCache(registration, 5000);
      }
    }, delay);
  }

  function postCacheControl(type) {
    navigator.serviceWorker.ready.then((registration) => {
      const worker = registration.active || registration.waiting || registration.installing;
      worker?.postMessage({ type });
    }).catch(() => {});
  }

  window.addEventListener("thevoid:mission-launch", () => {
    missionLaunching = true;
    window.clearTimeout(cacheTimer);
    postCacheControl("CACHE_PAUSE");
  });

  window.addEventListener("thevoid:mission-launched", () => {
    missionLaunching = false;
    postCacheControl("CACHE_RESUME");
    navigator.serviceWorker.ready.then((registration) => scheduleFullOfflineCache(registration, 8000));
  });

  window.addEventListener("load", async () => {
    try {
      const registration = await navigator.serviceWorker.register("service-worker.js", { scope: "./" });
      registration.update().catch(() => {});
      await navigator.serviceWorker.ready;
      showStatus("OFFLINE CORE READY // FULL ARCHIVE WILL PREPARE IN BACKGROUND", { ready: true, linger: 4200 });
      scheduleFullOfflineCache(registration);
      if (navigator.storage?.persist) navigator.storage.persist().catch(() => false);
    } catch (error) {
      console.warn("[The Void] PWA registration failed", error);
      showStatus("OFFLINE PACKAGE COULD NOT INITIALISE", { linger: 4500 });
    }
  });

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && !cacheRequested) {
      navigator.serviceWorker.ready.then((registration) => scheduleFullOfflineCache(registration, 5000));
    }
  });

  navigator.serviceWorker.addEventListener("message", (event) => {
    const data = event.data || {};
    if (data.type === "CACHE_PROGRESS") {
      showStatus(`PREPARING OFFLINE DEMO // ${data.completed} OF ${data.total}`, { linger: 0 });
    } else if (data.type === "OFFLINE_READY") {
      showStatus("OFFLINE DEMO READY // ADD TO HOME SCREEN", { ready: true, linger: 5200 });
    } else if (data.type === "CACHE_ERROR") {
      cacheRequested = false;
      showStatus(`OFFLINE CACHE WARNING // ${data.failed} FILE${data.failed === 1 ? "" : "S"} RETRY ON NEXT LAUNCH`, { linger: 5200 });
    }
  });
})();
