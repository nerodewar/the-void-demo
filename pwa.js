(() => {
  "use strict";

  const status = document.getElementById("offlineStatus");
  let hideTimer = 0;

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

  window.addEventListener("load", async () => {
    try {
      const registration = await navigator.serviceWorker.register("service-worker.js", { scope: "./" });
      await navigator.serviceWorker.ready;
      showStatus("PREPARING OFFLINE DEMO // KEEP THIS PAGE OPEN", { linger: 0 });
      registration.active?.postMessage({ type: "CACHE_ALL_ASSETS" });
      if (navigator.storage?.persist) navigator.storage.persist().catch(() => false);
    } catch (error) {
      console.warn("[The Void] PWA registration failed", error);
      showStatus("OFFLINE PACKAGE COULD NOT INITIALISE", { linger: 4500 });
    }
  });

  navigator.serviceWorker.addEventListener("message", (event) => {
    const data = event.data || {};
    if (data.type === "CACHE_PROGRESS") {
      showStatus(`PREPARING OFFLINE DEMO // ${data.completed} OF ${data.total}`, { linger: 0 });
    } else if (data.type === "OFFLINE_READY") {
      showStatus("OFFLINE DEMO READY // ADD TO HOME SCREEN", { ready: true, linger: 5200 });
    } else if (data.type === "CACHE_ERROR") {
      showStatus(`OFFLINE CACHE WARNING // ${data.failed} FILE${data.failed === 1 ? "" : "S"} RETRY ON NEXT LAUNCH`, { linger: 5200 });
    }
  });
})();
