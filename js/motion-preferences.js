// Central motion-preference state: OS "prefers-reduced-motion" always wins;
// the in-app toggle lets a visitor opt out even when their OS allows motion.
const STORAGE_KEY = "motion";
const root = document.documentElement;
const reduceQuery = matchMedia("(prefers-reduced-motion: reduce)");

const listeners = new Set();

function readStoredPreference() {
  return localStorage.getItem(STORAGE_KEY); // "off" | "on" | null
}

export function prefersReducedMotion() {
  return reduceQuery.matches;
}

export function isMotionEnabled() {
  if (prefersReducedMotion()) return false;
  return readStoredPreference() !== "off";
}

function applyState() {
  const enabled = isMotionEnabled();
  root.classList.toggle("motion-off", !enabled);
  listeners.forEach((fn) => fn(enabled));
}

export function onMotionChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function initMotionPreferences() {
  const button = document.getElementById("motion-toggle");
  applyState();

  reduceQuery.addEventListener("change", applyState);

  if (!button) return;

  function syncButton() {
    const enabled = isMotionEnabled();
    button.setAttribute("aria-pressed", String(!enabled));
    button.setAttribute("aria-label", enabled ? "Hareketi kapat" : "Hareketi aç");
    button.title = enabled ? "Hareketi kapat" : "Hareketi aç";
  }

  syncButton();

  button.addEventListener("click", () => {
    if (prefersReducedMotion()) {
      // OS-level preference is authoritative; nothing for the toggle to do.
      return;
    }
    const next = isMotionEnabled() ? "off" : "on";
    localStorage.setItem(STORAGE_KEY, next);
    applyState();
    syncButton();
  });

  onMotionChange(syncButton);
}
