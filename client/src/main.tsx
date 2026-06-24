import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

const rootElement = document.getElementById("root")!;
const root = createRoot(rootElement);
let appContentReady = false;
let stylesReady =
  !document.documentElement.classList.contains("css-deferred") ||
  document.documentElement.classList.contains("styles-ready");

function removeHomeShell() {
  if (!appContentReady || !stylesReady) return;
  const fallback = document.getElementById("seo-fallback");
  if (!fallback) return;
  fallback.setAttribute("aria-hidden", "true");
  document.documentElement.classList.add("app-ready");
}

if (document.documentElement.classList.contains("home-shell")) {
  const observer = new MutationObserver(() => {
    if (!rootElement.querySelector("h1")) return;
    appContentReady = true;
    observer.disconnect();
    removeHomeShell();
  });
  observer.observe(rootElement, { childList: true, subtree: true });
  window.addEventListener(
    "cvsolucion:styles-ready",
    () => {
      stylesReady = true;
      window.requestAnimationFrame(() =>
        window.requestAnimationFrame(removeHomeShell),
      );
    },
    { once: true },
  );
  window.setTimeout(() => {
    observer.disconnect();
    appContentReady = true;
    stylesReady = true;
    window.requestAnimationFrame(removeHomeShell);
  }, 12000);
}

root.render(<App />);
