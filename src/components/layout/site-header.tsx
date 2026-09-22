import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Wordmark } from "@/components/brand/logo";
import { BlobNav } from "@/components/layout/blob-nav";
import { Button } from "@/components/ui/button";
import { SignedIn, SignedOut, UserButton } from "@/lib/auth/gates";
import { goToHomeSection, scrollHome, syncScrollPadding } from "@/lib/scroll-to-section";
import { cn } from "@/lib/utils";
import { useMe } from "@/lib/use-me";

const LINKS = [
  { href: "/#about", label: "About" },
  { href: "/#services", label: "Sessions" },
  { href: "/#contact", label: "Contact" },
];

export function SiteHeader(_props?: { solid?: boolean }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { me } = useMe();
  const navigate = useNavigate();

  useEffect(() => {
    const scroller = document.getElementById("app-scroll");
    const onScroll = () => {
      const y = scroller ? scroller.scrollTop : window.scrollY;
      setScrolled(y > 24);
    };
    const onResize = () => syncScrollPadding();
    onScroll();
    syncScrollPadding();
    scroller?.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });
    return () => {
      scroller?.removeEventListener("scroll", onScroll);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b bg-header transition-[background-color,border-color,backdrop-filter] duration-300",
        scrolled ? "header-blur border-ink/20" : "border-ink/15",
      )}
    >
      <div id="site-nav-bar" className="mx-auto flex h-[8.75rem] max-w-6xl items-center justify-between gap-2 px-3 py-1.5 sm:h-[7.5rem] sm:gap-4 sm:px-6 lg:h-44">
        <Link
          to="/"
          className="min-w-0 shrink"
          onClick={(e) => {
            setOpen(false);
            const onHome = window.location.pathname === "/" || window.location.pathname === "";
            if (!onHome) return;
            e.preventDefault();
            scrollHome();
          }}
        >
          <Wordmark />
        </Link>
        <BlobNav links={LINKS} />
        <div className="relative z-20 flex items-center gap-2">
          <SignedOut>
            <Button asChild className="note-cta hidden sm:inline-flex shrink-0">
              <Link to="/login">Log in</Link>
            </Button>
            <Button asChild className="book-cta shrink-0">
              <Link to="/intake">
                <span className="sm:hidden">Book</span>
                <span className="hidden sm:inline">Book a consult</span>
              </Link>
            </Button>
          </SignedOut>
          <SignedIn>
            {me?.isTrainer ? (
              <Button asChild className="book-cta shrink-0">
                <Link to="/studio">Studio</Link>
              </Button>
            ) : null}
            <UserButton nameTo={me?.isTrainer ? "/studio" : "/portal"} />
          </SignedIn>
          <button
            type="button"
            className="inline-flex size-16 shrink-0 items-center justify-center rounded-md md:hidden active:scale-[0.96]"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <span className={open ? "menu-toggle is-open" : "menu-toggle"} aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
          </button>
        </div>
      </div>
      <div className={open ? "menu-panel is-open md:hidden" : "menu-panel md:hidden"}>
        <div>
          <nav className="flex flex-col border-t border-ink/15 bg-bg px-4 py-4 text-center">
            {LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="rounded-md px-3 py-3.5 text-base text-ink hover:bg-surface-2"
                onClick={(e) => {
                  e.preventDefault();
                  const id = l.href.split("#")[1];
                  setOpen(false);
                  if (!id) return;
                  goToHomeSection(id, navigate);
                }}
              >
                {l.label}
              </a>
            ))}
            <Link
              to="/intake"
              className="rounded-md px-3 py-3.5 text-base text-ink hover:bg-surface-2"
              onClick={() => setOpen(false)}
            >
              Book a consult
            </Link>
            <Link
              to="/login"
              className="rounded-md px-3 py-3.5 text-base text-ink hover:bg-surface-2"
              onClick={() => setOpen(false)}
            >
              Log in
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
