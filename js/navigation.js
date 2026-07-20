// Header chrome: scrolled state, scroll progress bar, mobile menu behavior
// (keyboard, outside click, scroll lock) and active-section nav highlighting.
export function initNavigation() {
  const header = document.getElementById("site-header");
  const progressBar = document.querySelector(".header-progress__bar");

  if (header || progressBar) {
    const updateOnScroll = () => {
      header?.classList.toggle("scrolled", scrollY > 20);
      if (progressBar) {
        const max = document.body.scrollHeight - window.innerHeight;
        const progress = max > 0 ? Math.min(100, Math.max(0, (scrollY / max) * 100)) : 0;
        progressBar.style.width = progress + "%";
      }
    };
    addEventListener("scroll", updateOnScroll, { passive: true });
    updateOnScroll();
  }

  initMobileMenu();
  initActiveSectionTracking();
}

function initMobileMenu() {
  const menuButton = document.getElementById("menu-button");
  const menu = document.getElementById("mobile-menu");
  if (!menuButton || !menu) return;

  const root = document.documentElement;

  function isOpen() {
    return menuButton.getAttribute("aria-expanded") === "true";
  }

  function openMenu() {
    menuButton.setAttribute("aria-expanded", "true");
    menuButton.setAttribute("aria-label", "Menüyü kapat");
    menu.hidden = false;
    root.classList.add("no-scroll");
  }

  function closeMenu({ focusButton = false } = {}) {
    menuButton.setAttribute("aria-expanded", "false");
    menuButton.setAttribute("aria-label", "Menüyü aç");
    menu.hidden = true;
    root.classList.remove("no-scroll");
    if (focusButton) menuButton.focus();
  }

  menuButton.addEventListener("click", () => {
    isOpen() ? closeMenu() : openMenu();
  });

  menu.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => closeMenu()));

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && isOpen()) closeMenu({ focusButton: true });
  });

  document.addEventListener("click", (event) => {
    if (!isOpen()) return;
    const clickedInsideMenu = menu.contains(event.target);
    const clickedButton = menuButton.contains(event.target);
    if (!clickedInsideMenu && !clickedButton) closeMenu();
  });
}

function initActiveSectionTracking() {
  const sections = [...document.querySelectorAll("main section[id]")];
  const links = [...document.querySelectorAll(".desktop-nav a")];
  if (!sections.length || !links.length || !("IntersectionObserver" in window)) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        links.forEach((link) => link.classList.toggle("active", link.getAttribute("href") === "#" + entry.target.id));
      });
    },
    { rootMargin: "-40% 0px -50%", threshold: 0 },
  );

  sections.forEach((section) => observer.observe(section));
}
