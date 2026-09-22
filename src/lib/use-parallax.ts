import { useEffect, useRef } from "react";

export function useParallax<T extends HTMLElement>(factor = 0.16) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (window.matchMedia("(max-width: 767px)").matches) return;

    const scroller = document.getElementById("app-scroll") ?? window;
    let raf = 0;
    const tick = () => {
      const r = el.getBoundingClientRect();
      const mid = r.top + r.height / 2 - window.innerHeight / 2;
      el.style.transform = `translate3d(0, ${mid * factor}px, 0)`;
    };
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(tick);
    };
    tick();
    scroller.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      scroller.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [factor]);

  return ref;
}
