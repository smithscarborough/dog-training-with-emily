import { useEffect, useRef, useState } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { goToHomeSection } from "@/lib/scroll-to-section";

type NavLink = { href: string; label: string };

export function BlobNav({ links }: { links: NavLink[] }) {
  const navRef = useRef<HTMLElement>(null);
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const [active, setActive] = useState<number | null>(null);
  const [hover, setHover] = useState<number | null>(null);
  const [blob, setBlob] = useState({ x: 0, w: 0, on: false });
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const hash = useRouterState({ select: (s) => s.location.hash });
  const navigate = useNavigate();

  const lit = hover ?? active;

  function place(index: number | null) {
    const nav = navRef.current;
    const el = index === null ? null : itemRefs.current[index];
    if (!nav || !el) {
      setBlob((b) => ({ ...b, on: false }));
      return;
    }
    const nr = nav.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    setBlob({ x: r.left - nr.left, w: r.width, on: true });
  }

  useEffect(() => {
    place(lit);
  }, [lit]);

  useEffect(() => {
    function onResize() {
      place(hover ?? active);
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [hover, active]);

  useEffect(() => {
    const id = (hash || window.location.hash).replace(/^#/, "");
    const i = links.findIndex((l) => l.href.split("#")[1] === id);
    if (i >= 0) setActive(i);
  }, [hash, links, pathname]);

  useEffect(() => {
    const ids = links.map((l) => l.href.replace("/#", ""));
    const els = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => Boolean(el));
    if (els.length === 0) return;

    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible) return;
        const i = ids.indexOf(visible.target.id);
        if (i >= 0) setActive(i);
      },
      { rootMargin: "-28% 0px -55% 0px", threshold: [0.1, 0.35, 0.6] },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [links, pathname]);

  return (
    <nav
      ref={navRef}
      className="relative hidden items-center md:flex"
      onMouseLeave={() => setHover(null)}
    >
      <span
        className="nav-underline"
        style={{
          transform: `translate3d(${blob.x}px, 0, 0) scaleX(${Math.max(blob.w, 1)})`,
          opacity: blob.on ? 1 : 0,
        }}
        aria-hidden="true"
      />
      {links.map((l, i) => (
        <a
          key={l.href}
          href={l.href}
          ref={(node) => {
            itemRefs.current[i] = node;
          }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setActive(i);
            const id = l.href.split("#")[1];
            if (!id) return;
            goToHomeSection(id, navigate);
          }}
          onMouseEnter={() => setHover(i)}
          onFocus={() => setHover(i)}
          onBlur={() => setHover(null)}
          className={cn(
            "relative z-10 px-3.5 py-1.5 text-base font-medium transition-colors duration-200",
            lit === i ? "text-ink" : "text-ink-soft hover:text-ink",
          )}
        >
          {l.label}
        </a>
      ))}
    </nav>
  );
}
