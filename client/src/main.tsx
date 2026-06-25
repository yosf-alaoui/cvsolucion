import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

const currentPath = window.location.pathname.replace(/\/+$/, "") || "/";
const isCareerLanding =
  currentPath === "/training/career" ||
  currentPath === "/fr/training/career" ||
  currentPath === "/ar/training/career";

if (isCareerLanding) {
  void import("./pages/TrainingCareer");
}

const rootElement = document.getElementById("root")!;
const root = createRoot(rootElement);
let appContentReady = false;
let shellRemovalScheduled = false;
let stylesReady =
  !document.documentElement.classList.contains("css-deferred") ||
  document.documentElement.classList.contains("styles-ready");

function removeSeoShell() {
  if (!appContentReady || !stylesReady || shellRemovalScheduled) return;
  const fallback = document.getElementById("seo-fallback");
  if (!fallback) return;
  shellRemovalScheduled = true;

  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => {
      fallback.setAttribute("aria-hidden", "true");
      fallback.setAttribute("inert", "");
      fallback
        .querySelectorAll<HTMLElement>(
          "a, button, input, select, textarea, [tabindex]",
        )
        .forEach((element) => element.setAttribute("tabindex", "-1"));
      document.documentElement.classList.add("app-ready");
    });
  });
}

const usesSeoShell =
  document.documentElement.classList.contains("home-shell") ||
  document.documentElement.classList.contains("career-shell");

if (usesSeoShell) {
  const observer = new MutationObserver(() => {
    if (!rootElement.querySelector("h1")) return;
    appContentReady = true;
    observer.disconnect();
    removeSeoShell();
  });
  observer.observe(rootElement, { childList: true, subtree: true });
  window.addEventListener(
    "cvsolucion:styles-ready",
    () => {
      stylesReady = true;
      removeSeoShell();
    },
    { once: true },
  );
  window.setTimeout(() => {
    observer.disconnect();
    appContentReady = true;
    stylesReady = true;
    window.requestAnimationFrame(removeSeoShell);
  }, 12000);
}

root.render(<App />);
