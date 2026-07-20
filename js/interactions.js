import { isMotionEnabled, onMotionChange } from "./motion-preferences.js";

const finePointer = matchMedia("(hover: hover) and (pointer: fine)");

export function initInteractions() {
  initFooterYear();
  initTimelineProgress();
  initMagneticButtons();
  initProjectCardTilt();
  initCopyEmail();
}

function initFooterYear() {
  const year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());
}

/* Timeline: the connecting line fills top-to-bottom once, the first time the
   experience section is visible. It never re-triggers on subsequent scrolls. */
function initTimelineProgress() {
  const timeline = document.getElementById("timeline");
  if (!timeline || !("IntersectionObserver" in window)) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        timeline.classList.add("in-view");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.15 },
  );
  observer.observe(timeline);
}

/* Magnetic pull for primary CTAs — desktop, fine-pointer only, max 6px,
   disabled entirely when motion is off. */
function initMagneticButtons() {
  const buttons = [...document.querySelectorAll(".hero-actions .button-primary, .contact-actions .button-primary")];
  if (!buttons.length) return;

  const MAX_PULL = 6;
  const cleanups = [];

  function attach(button) {
    function onMove(event) {
      const rect = button.getBoundingClientRect();
      const relX = event.clientX - (rect.left + rect.width / 2);
      const relY = event.clientY - (rect.top + rect.height / 2);
      const pullX = Math.max(-MAX_PULL, Math.min(MAX_PULL, relX / 6));
      const pullY = Math.max(-MAX_PULL, Math.min(MAX_PULL, relY / 6));
      button.style.transform = `translate(${pullX}px, ${pullY - 2}px)`;
    }
    function onLeave() {
      button.style.transform = "";
    }
    button.addEventListener("pointermove", onMove);
    button.addEventListener("pointerleave", onLeave);
    return () => {
      button.removeEventListener("pointermove", onMove);
      button.removeEventListener("pointerleave", onLeave);
      button.style.transform = "";
    };
  }

  function sync(enabled) {
    cleanups.splice(0).forEach((fn) => fn());
    if (enabled && finePointer.matches) {
      buttons.forEach((button) => cleanups.push(attach(button)));
    }
  }

  sync(isMotionEnabled());
  onMotionChange(sync);
  finePointer.addEventListener("change", () => sync(isMotionEnabled()));
}

/* Project cards: a soft border-light follows the pointer (CSS custom
   properties) plus a very slight tilt. Fine-pointer only, max ~2.5deg. */
function initProjectCardTilt() {
  const cards = [...document.querySelectorAll(".project")];
  if (!cards.length) return;

  const MAX_TILT = 2.5;
  const cleanups = [];

  function attach(card) {
    function onMove(event) {
      const rect = card.getBoundingClientRect();
      const px = ((event.clientX - rect.left) / rect.width) * 100;
      const py = ((event.clientY - rect.top) / rect.height) * 100;
      card.style.setProperty("--mx", px + "%");
      card.style.setProperty("--my", py + "%");
      const tiltY = ((px - 50) / 50) * MAX_TILT;
      const tiltX = -((py - 50) / 50) * MAX_TILT;
      card.style.setProperty("--tilt-x", tiltX.toFixed(2) + "deg");
      card.style.setProperty("--tilt-y", tiltY.toFixed(2) + "deg");
    }
    function onLeave() {
      card.style.setProperty("--tilt-x", "0deg");
      card.style.setProperty("--tilt-y", "0deg");
    }
    card.addEventListener("pointermove", onMove);
    card.addEventListener("pointerleave", onLeave);
    return () => {
      card.removeEventListener("pointermove", onMove);
      card.removeEventListener("pointerleave", onLeave);
      card.style.removeProperty("--tilt-x");
      card.style.removeProperty("--tilt-y");
    };
  }

  function sync(enabled) {
    cleanups.splice(0).forEach((fn) => fn());
    if (enabled && finePointer.matches) {
      cards.forEach((card) => cleanups.push(attach(card)));
    }
  }

  sync(isMotionEnabled());
  onMotionChange(sync);
  finePointer.addEventListener("change", () => sync(isMotionEnabled()));
}

/* Copy email to clipboard with an accessible toast confirmation. */
function initCopyEmail() {
  const button = document.getElementById("copy-email");
  const toast = document.getElementById("toast");
  if (!button) return;

  let hideTimer;

  button.addEventListener("click", async () => {
    const email = button.dataset.email;
    try {
      await navigator.clipboard.writeText(email);
      showToast("E-posta adresi kopyalandı");
    } catch {
      showToast("Kopyalanamadı, lütfen elle seçin");
    }
  });

  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("visible");
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => toast.classList.remove("visible"), 1800);
  }
}
