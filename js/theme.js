// Light/dark theme toggle with persisted preference and a soft
// View Transition cross-fade where the browser supports it.
export function initTheme() {
  const root = document.documentElement;
  const button = document.getElementById("theme-toggle");
  const metaThemeColor = document.querySelector('meta[name="theme-color"]');

  const stored = localStorage.getItem("theme");
  const systemDark = matchMedia("(prefers-color-scheme: dark)").matches;
  root.dataset.theme = stored || (systemDark ? "dark" : "light");

  function syncMeta() {
    const isDark = root.dataset.theme === "dark";
    button?.setAttribute("aria-label", isDark ? "Açık temaya geç" : "Koyu temaya geç");
    metaThemeColor?.setAttribute("content", isDark ? "#0B0D10" : "#F5F6F8");
  }

  syncMeta();

  function applyNextTheme() {
    root.dataset.theme = root.dataset.theme === "dark" ? "light" : "dark";
    localStorage.setItem("theme", root.dataset.theme);
    syncMeta();
  }

  button?.addEventListener("click", () => {
    const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!reduceMotion && document.startViewTransition) {
      document.startViewTransition(applyNextTheme);
    } else {
      applyNextTheme();
    }
  });
}
