// 404 page has no theme toggle, but should still respect a previously
// stored preference instead of always defaulting to dark.
try {
  const stored = localStorage.getItem("theme");
  if (stored) document.documentElement.dataset.theme = stored;
} catch {
  // localStorage unavailable (privacy mode etc.) — dark default stands.
}
