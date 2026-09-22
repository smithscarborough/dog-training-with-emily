/** Set false so boot-time “pin to top” does not fight a menu jump. */
export let allowHomePin = true;

let scrollAnim = 0;

export function getAppScroller(): HTMLElement | null {
  return document.getElementById("app-scroll");
}

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function easeOutCubic(t: number) {
  return 1 - (1 - t) ** 3;
}

function readScroll() {
  const scroller = getAppScroller();
  return scroller ? scroller.scrollTop : window.scrollY;
}

function writeScroll(v: number) {
  const scroller = getAppScroller();
  if (scroller) scroller.scrollTop = v;
  else window.scrollTo(0, v);
}

/** Section top flush with the sticky header’s bottom edge. */
function flushTop(el: HTMLElement): number {
  const scroller = getAppScroller();
  const header = document.querySelector("header");
  if (!scroller) return 0;
  const headerBottom =
    header?.getBoundingClientRect().bottom ?? scroller.getBoundingClientRect().top;
  const delta = el.getBoundingClientRect().top - headerBottom;
  return Math.max(0, Math.round(scroller.scrollTop + delta));
}

function animateTo(getTarget: () => number) {
  cancelAnimationFrame(scrollAnim);
  const start = readScroll();
  const first = getTarget();
  if (Math.abs(first - start) < 1 || prefersReducedMotion()) {
    writeScroll(first);
    return;
  }
  const dist = first - start;
  const duration = Math.min(520, Math.max(280, Math.abs(dist) * 0.35));
  const t0 = performance.now();
  const step = (now: number) => {
    const t = Math.min(1, (now - t0) / duration);
    writeScroll(start + dist * easeOutCubic(t));
    if (t < 1) {
      scrollAnim = requestAnimationFrame(step);
    } else {
      writeScroll(getTarget());
    }
  };
  scrollAnim = requestAnimationFrame(step);
}

/** Clears leftover CSS scroll-padding so calibrated jumps land correctly. */
export function syncScrollPadding() {
  const scroller = getAppScroller();
  if (scroller) scroller.style.scrollPaddingTop = "0px";
}

export function scrollAppTo(top: number, _behavior: ScrollBehavior = "auto") {
  cancelAnimationFrame(scrollAnim);
  writeScroll(top);
}

export function pauseHomePin() {
  allowHomePin = false;
  cancelScrollAnim();
}

export function scrollHome() {
  allowHomePin = true;
  animateTo(() => 0);
  if (typeof history !== "undefined" && window.location.hash) {
    history.replaceState(null, "", window.location.pathname + window.location.search);
  }
}

export function goToHomeSection(
  id: string,
  navigate: (opts: { to: "/"; hash: string }) => unknown,
) {
  const onHome = window.location.pathname === "/" || window.location.pathname === "";
  if (onHome) {
    scrollToSection(id);
    history.replaceState(null, "", `#${id}`);
    return;
  }
  pauseHomePin();
  try {
    void Promise.resolve(navigate({ to: "/", hash: id }));
  } catch {
    window.location.assign(`/#${id}`);
  }
}

export function scrollToSection(id: string) {
  allowHomePin = false;
  syncScrollPadding();
  const el = document.getElementById(id);
  if (!el) return;
  requestAnimationFrame(() => {
    const target = document.getElementById(id);
    if (!target) return;
    animateTo(() => flushTop(target));
  });
}

export function cancelScrollAnim() {
  cancelAnimationFrame(scrollAnim);
}
