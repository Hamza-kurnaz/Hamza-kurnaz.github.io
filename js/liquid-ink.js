// Liquid Ink / Code Ink — the site's signature pointer trail.
//
// Architecture (three canvases, only one ever in the DOM):
//   inkCanvas  (offscreen) — persistent, slowly-fading accumulation buffer
//                            that receives every stroke, pool and drip.
//   gridCanvas (offscreen) — a sparse abstract circuit pattern, redrawn only
//                            on resize.
//   #ink-canvas (visible)  — each frame: draw inkCanvas, then draw gridCanvas
//                            with "source-atop" so the grid only shows up
//                            through the ink's own alpha shape.
//
// The render loop only runs while there is something to animate: active
// pointer input, a growing pool, live drips, or ink still fading out.
import { isMotionEnabled, onMotionChange, prefersReducedMotion } from "./motion-preferences.js";

const POOL_GROWTH_MS = 420;
const DRIP_DELAY_MS = 260;
const FADE_DECAY_MS = 1100;
const IDLE_THRESHOLD_MS = 120;
const LOOP_IDLE_TIMEOUT_MS = 1700;

export function initLiquidInk() {
  const canvas = document.getElementById("ink-canvas");
  if (!canvas) return () => {};

  let ctx;
  try {
    ctx = canvas.getContext("2d", { alpha: true });
  } catch {
    ctx = null;
  }
  if (!ctx) return () => {};

  const inkCanvas = document.createElement("canvas");
  const inkCtx = inkCanvas.getContext("2d", { alpha: true });
  const gridCanvas = document.createElement("canvas");
  const gridCtx = gridCanvas.getContext("2d", { alpha: true });
  if (!inkCtx || !gridCtx) return () => {};

  const mobileQuery = matchMedia("(max-width: 700px)");
  const finePointerQuery = matchMedia("(hover: hover) and (pointer: fine)");

  let dpr = 1;
  let width = 0;
  let height = 0;
  let colors = readInkColors();
  let rafId = 0;
  let lastFrameTime = 0;
  let lastActivityTime = 0;
  let running = false;

  // Freehand smoothing needs the last three raw samples.
  let samples = [];
  let hasPendingSample = false;
  let pointerActive = false;
  let idleSince = 0;
  let poolPoint = null;
  let dripsResolved = true;

  // Touch gesture bookkeeping (tap / short drag / long hold vs. scroll).
  let touch = null;

  const drips = [];

  function resize() {
    dpr = Math.min(devicePixelRatio || 1, mobileQuery.matches ? 1.5 : 2);
    width = innerWidth;
    height = innerHeight;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";

    inkCanvas.width = width * dpr;
    inkCanvas.height = height * dpr;
    inkCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

    gridCanvas.width = width * dpr;
    gridCanvas.height = height * dpr;
    gridCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

    drawGrid();
  }

  // A sparse, deterministic-looking circuit pattern — right-angle traces
  // with small pads at the joints. Purely decorative, regenerated on resize.
  function drawGrid() {
    gridCtx.clearRect(0, 0, width, height);
    gridCtx.strokeStyle = "rgba(160, 176, 196, 0.9)";
    gridCtx.lineWidth = 1;
    const cell = 88;
    const cols = Math.ceil(width / cell) + 1;
    const rows = Math.ceil(height / cell) + 1;
    let seed = 42;
    const rand = () => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return (seed % 1000) / 1000;
    };

    for (let gy = 0; gy < rows; gy++) {
      for (let gx = 0; gx < cols; gx++) {
        if (rand() > 0.4) continue;
        const x = gx * cell + rand() * 20;
        const y = gy * cell + rand() * 20;
        const horizontal = rand() > 0.5;
        const len = 28 + rand() * 40;
        gridCtx.beginPath();
        gridCtx.moveTo(x, y);
        if (horizontal) {
          gridCtx.lineTo(x + len, y);
          gridCtx.lineTo(x + len, y + (rand() > 0.5 ? 18 : -18));
        } else {
          gridCtx.lineTo(x, y + len);
          gridCtx.lineTo(x + (rand() > 0.5 ? 18 : -18), y + len);
        }
        gridCtx.stroke();
        if (rand() > 0.55) {
          gridCtx.fillStyle = "rgba(160, 176, 196, 0.9)";
          gridCtx.fillRect(x - 1.5, y - 1.5, 3, 3);
        }
      }
    }
  }

  function readInkColors() {
    const styles = getComputedStyle(document.documentElement);
    return {
      primary: hexToRgb(styles.getPropertyValue("--color-primary").trim()) || "91, 141, 239",
      accent: hexToRgb(styles.getPropertyValue("--color-accent").trim()) || "229, 138, 69",
    };
  }

  function hexToRgb(hex) {
    const match = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!match) return null;
    return [1, 2, 3].map((i) => parseInt(match[i], 16)).join(", ");
  }

  function pickColor() {
    return Math.random() > 0.86 ? colors.accent : colors.primary;
  }

  function pushSample(x, y) {
    samples.push({ x, y, t: performance.now() });
    if (samples.length > 3) samples.shift();
    hasPendingSample = true;
    wake();
  }

  function wake() {
    lastActivityTime = performance.now();
    if (!running) startLoop();
  }

  function brushRange() {
    return mobileQuery.matches ? { min: 5, max: 22 } : { min: 8, max: 32 };
  }

  function maxDrips() {
    return mobileQuery.matches ? 1 : 3;
  }

  function strokeSegment(from, mid, to, radius, alpha, color) {
    inkCtx.lineCap = "round";
    inkCtx.lineJoin = "round";
    inkCtx.strokeStyle = `rgba(${color}, ${alpha * 0.32})`;
    inkCtx.lineWidth = radius * 2;
    inkCtx.beginPath();
    inkCtx.moveTo(from.x, from.y);
    inkCtx.quadraticCurveTo(mid.x, mid.y, to.x, to.y);
    inkCtx.stroke();

    inkCtx.strokeStyle = `rgba(${color}, ${alpha})`;
    inkCtx.lineWidth = Math.max(1, radius * 1.05);
    inkCtx.beginPath();
    inkCtx.moveTo(from.x, from.y);
    inkCtx.quadraticCurveTo(mid.x, mid.y, to.x, to.y);
    inkCtx.stroke();
  }

  function drawPool(point, radius, alpha, color) {
    const gradient = inkCtx.createRadialGradient(point.x, point.y, 0, point.x, point.y, radius);
    gradient.addColorStop(0, `rgba(${color}, ${alpha})`);
    gradient.addColorStop(0.6, `rgba(${color}, ${alpha * 0.5})`);
    gradient.addColorStop(1, `rgba(${color}, 0)`);
    inkCtx.fillStyle = gradient;
    inkCtx.beginPath();
    inkCtx.arc(point.x, point.y, radius, 0, Math.PI * 2);
    inkCtx.fill();
  }

  function spawnDrips(point, count) {
    for (let i = 0; i < count && drips.length < maxDrips(); i++) {
      if (Math.random() > 0.7) continue; // not every slot fills — keeps it natural
      drips.push({
        x: point.x + (Math.random() - 0.5) * 10,
        y: point.y,
        length: 40 + Math.random() * 120,
        grown: 0,
        vy: 18 + Math.random() * 12,
        jitterSeed: Math.random() * 100,
        color: pickColor(),
      });
    }
  }

  function updateDrips(dt) {
    for (let i = drips.length - 1; i >= 0; i--) {
      const drip = drips[i];
      if (drip.grown >= drip.length) {
        drips.splice(i, 1);
        continue;
      }
      const prevGrown = drip.grown;
      drip.vy += dt * 0.02;
      drip.grown = Math.min(drip.length, drip.grown + drip.vy * (dt / 16));
      const x1 = drip.x + Math.sin(drip.jitterSeed + prevGrown * 0.1) * 3;
      const y1 = drip.y + prevGrown;
      const x2 = drip.x + Math.sin(drip.jitterSeed + drip.grown * 0.1) * 3;
      const y2 = drip.y + drip.grown;
      const taper = 1 - drip.grown / drip.length;
      strokeSegment({ x: x1, y: y1 }, { x: (x1 + x2) / 2, y: (y1 + y2) / 2 }, { x: x2, y: y2 }, 3 + taper * 4, 0.5, drip.color);
    }
  }

  function frame(now) {
    rafId = 0;
    if (!lastFrameTime) lastFrameTime = now;
    const dt = Math.min(64, now - lastFrameTime);
    lastFrameTime = now;

    // Slow, continuous fade so trails dry up rather than vanish.
    const fadeAlpha = 1 - Math.exp(-dt / FADE_DECAY_MS);
    inkCtx.globalCompositeOperation = "destination-out";
    inkCtx.fillStyle = `rgba(0, 0, 0, ${fadeAlpha})`;
    inkCtx.fillRect(0, 0, width, height);
    inkCtx.globalCompositeOperation = "source-over";

    if (hasPendingSample && samples.length >= 2) {
      hasPendingSample = false;
      pointerActive = true;
      idleSince = 0;
      poolPoint = null;
      dripsResolved = true;

      const [p0, p1, p2] = samples.length === 3 ? samples : [samples[0], samples[0], samples[1]];
      const segDt = Math.max(1, p2.t - p1.t);
      const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
      const speed = dist / segDt; // px/ms

      const { min, max } = brushRange();
      const speedNorm = Math.min(1, speed / 1.6);
      const radius = max - speedNorm * (max - min) * (0.85 + Math.random() * 0.15);
      const alpha = 0.5 - speedNorm * 0.28;

      const mid = { x: (p0.x + p1.x) / 2, y: (p0.y + p1.y) / 2 };
      const end = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
      strokeSegment(mid, p1, end, radius, alpha, pickColor());
      lastActivityTime = now;
    } else if (pointerActive) {
      if (!idleSince) {
        idleSince = now;
        poolPoint = samples[samples.length - 1] || null;
        dripsResolved = false;
      }
      const idleFor = now - idleSince;
      if (poolPoint && idleFor < POOL_GROWTH_MS + DRIP_DELAY_MS) {
        if (idleFor < POOL_GROWTH_MS) {
          const { max } = brushRange();
          const growth = Math.min(1, idleFor / POOL_GROWTH_MS);
          drawPool(poolPoint, max * (0.9 + growth * 0.7), 0.4, pickColor());
          lastActivityTime = now;
        } else if (!dripsResolved) {
          dripsResolved = true;
          spawnDrips(poolPoint, maxDrips());
          lastActivityTime = now;
        }
      }
    }

    updateDrips(dt);
    if (drips.length) lastActivityTime = now;

    // Composite: ink first, then the technical grid masked to the ink's
    // own alpha shape (source-atop draws only where the destination has
    // existing pixels), so the grid is only ever visible "through" the paint.
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = "source-over";
    ctx.drawImage(inkCanvas, 0, 0);
    ctx.globalCompositeOperation = "source-atop";
    ctx.globalAlpha = 0.4;
    ctx.drawImage(gridCanvas, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";

    if (document.visibilityState === "visible" && now - lastActivityTime < LOOP_IDLE_TIMEOUT_MS) {
      rafId = requestAnimationFrame(frame);
    } else {
      running = false;
      pointerActive = false;
      idleSince = 0;
      poolPoint = null;
    }
  }

  function startLoop() {
    if (rafId || running) return;
    running = true;
    lastFrameTime = 0;
    rafId = requestAnimationFrame(frame);
  }

  function stopLoop() {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = 0;
    running = false;
  }

  // ---- Desktop / pen: continuous hover trail ----
  function onPointerMove(event) {
    if (event.pointerType === "touch") return; // handled by the touch gesture path below
    pushSample(event.clientX, event.clientY);
  }

  function onPointerDown(event) {
    if (event.pointerType === "touch") {
      touch = { x: event.clientX, y: event.clientY, t: performance.now(), decided: null };
      return;
    }
    samples = [];
    pushSample(event.clientX, event.clientY);
  }

  function onPointerLeave() {
    samples = [];
    hasPendingSample = false;
  }

  // ---- Touch: tap = dab, short drag = thin trail, long hold = single drip,
  // vertical drag = native scroll (never drawn on, never blocked). ----
  function onTouchMove(event) {
    if (!touch || event.pointerType !== "touch") return;
    const dx = event.clientX - touch.x;
    const dy = event.clientY - touch.y;
    if (!touch.decided && Math.abs(dx) + Math.abs(dy) > 8) {
      touch.decided = Math.abs(dy) > Math.abs(dx) * 1.2 ? "scroll" : "draw";
      if (touch.decided === "draw") {
        samples = [];
        pushSample(touch.x, touch.y);
      }
    }
    if (touch.decided === "draw") pushSample(event.clientX, event.clientY);
  }

  function onTouchEnd(event) {
    if (!touch || event.pointerType !== "touch") return;
    const elapsed = performance.now() - touch.t;
    const dx = event.clientX - touch.x;
    const dy = event.clientY - touch.y;
    const moved = Math.hypot(dx, dy);

    if (!touch.decided && moved < 6 && elapsed < 250) {
      drawPool({ x: touch.x, y: touch.y }, brushRange().max * 0.7, 0.4, pickColor());
      wake();
    } else if (!touch.decided && elapsed > 450 && moved < 10) {
      spawnDrips({ x: touch.x, y: touch.y }, 1);
      wake();
    }
    touch = null;
    samples = [];
  }

  let resizeTimer;
  function onResize() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 150);
  }

  function onVisibilityChange() {
    if (document.visibilityState === "visible" && (lastActivityTime && performance.now() - lastActivityTime < LOOP_IDLE_TIMEOUT_MS)) {
      startLoop();
    }
  }

  let themeObserver;
  function watchTheme() {
    themeObserver = new MutationObserver(() => {
      colors = readInkColors();
    });
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  }

  let listenersAttached = false;
  function attach() {
    if (listenersAttached) return;
    listenersAttached = true;
    resize();
    watchTheme();
    addEventListener("pointermove", onPointerMove, { passive: true });
    addEventListener("pointermove", onTouchMove, { passive: true });
    addEventListener("pointerdown", onPointerDown, { passive: true });
    addEventListener("pointerup", onTouchEnd, { passive: true });
    addEventListener("pointercancel", onTouchEnd, { passive: true });
    addEventListener("pointerleave", onPointerLeave, { passive: true });
    addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", onVisibilityChange);
  }

  function detach() {
    if (!listenersAttached) return;
    listenersAttached = false;
    stopLoop();
    removeEventListener("pointermove", onPointerMove);
    removeEventListener("pointermove", onTouchMove);
    removeEventListener("pointerdown", onPointerDown);
    removeEventListener("pointerup", onTouchEnd);
    removeEventListener("pointercancel", onTouchEnd);
    removeEventListener("pointerleave", onPointerLeave);
    removeEventListener("resize", onResize);
    document.removeEventListener("visibilitychange", onVisibilityChange);
    themeObserver?.disconnect();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    inkCtx.clearRect(0, 0, inkCanvas.width, inkCanvas.height);
  }

  function sync(enabled) {
    if (enabled && !prefersReducedMotion()) attach();
    else detach();
  }

  sync(isMotionEnabled());
  const unsubscribe = onMotionChange(sync);

  return function destroy() {
    detach();
    unsubscribe();
  };
}
