const RELOAD_KEY = "cvsolucion:vite-preload-reload";
let formIsDirty = false;

function markFormDirty(event: Event) {
  if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement || event.target instanceof HTMLSelectElement) {
    formIsDirty = true;
  }
}

document.addEventListener("input", markFormDirty, true);
document.addEventListener("change", markFormDirty, true);

window.addEventListener("vite:preloadError", (event) => {
  event.preventDefault();
  if (formIsDirty) {
    console.error("A newer site version is available; reload postponed to preserve form data.");
    return;
  }

  const now = Date.now();
  const previous = Number(sessionStorage.getItem(RELOAD_KEY) || 0);
  if (Number.isFinite(previous) && now - previous < 60_000) {
    console.error("A site update could not be loaded after one recovery attempt.");
    return;
  }

  sessionStorage.setItem(RELOAD_KEY, String(now));
  window.location.reload();
});

export {};
