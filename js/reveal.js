// Scroll-triggered reveal: each `.reveal` element fades/translates in once,
// the first time it enters the viewport. Runs at most once per element.
export function initRevealAnimations() {
  const items = [...document.querySelectorAll(".reveal")];
  if (!items.length) return;

  if (!("IntersectionObserver" in window)) {
    items.forEach((el) => el.classList.add("visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const delay = Number(entry.target.dataset.delay || 0);
        setTimeout(() => entry.target.classList.add("visible"), delay);
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.12 },
  );

  items.forEach((el) => observer.observe(el));
}
