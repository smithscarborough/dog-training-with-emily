import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Wordmark } from "@/components/brand/logo";
import { BlobNav } from "@/components/layout/blob-nav";
import { Button } from "@/components/ui/button";
import { SignedIn, UserButton } from "@/lib/auth/gates";
import { useFrozenSignedOutHeader } from "@/lib/auth/header-hold";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { goToHomeSection, scrollHome, syncScrollPadding } from "@/lib/scroll-to-section";
import { cn } from "@/lib/utils";
import { useMe } from "@/lib/use-me";
import { HolidayPreviewBar } from "@/components/layout/holiday-chrome";
import { useHolidayTouch } from "@/lib/use-holiday";

const LINKS = [
  { href: "/#about", label: "About" },
  { href: "/#services", label: "Sessions" },
  { href: "/#contact", label: "Contact" },
];

export function SiteHeader(_props?: { solid?: boolean }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { me, user } = useMe();
  const { preview } = useHolidayTouch();
  const { user: sessionUser, isPending } = useCurrentUserState();
  const frozenOut = useFrozenSignedOutHeader();
  const authMode = useRef<"in" | "out" | "pending">("pending");
  if (sessionUser) authMode.current = "in";
  else if (!isPending) authMode.current = "out";
  const signedOut = frozenOut || authMode.current === "out";
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
          <Wordmark signedIn={Boolean(user)} gleam />
        </Link>
        <BlobNav links={LINKS} />
        <div className="relative z-20 flex items-center gap-2">
          <div className="grid items-center [&>*]:col-start-1 [&>*]:row-start-1">
            <div
              className={cn(
                "flex items-center gap-2 transition-opacity duration-200",
                signedOut ? "opacity-100" : "pointer-events-none opacity-0 max-md:hidden",
              )}
            >
              <Button asChild className="note-cta hidden sm:inline-flex shrink-0">
                <Link to="/login">Log in</Link>
              </Button>
              <Button asChild className="book-cta shrink-0">
                <Link to="/intake">
                  <span className="sm:hidden">Book</span>
                  <span className="hidden sm:inline">Book a consult</span>
                </Link>
              </Button>
            </div>
            <div
              className={cn(
                "hidden justify-self-end transition-opacity duration-200 md:block",
                signedOut ? "pointer-events-none opacity-0" : "opacity-100",
              )}
            >
              <UserButton nameTo={me?.isTrainer ? "/studio" : "/portal"} />
            </div>
          </div>
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
      {preview ? <HolidayPreviewBar id={preview} /> : null}
      <div className={open ? "menu-panel is-open md:hidden" : "menu-panel md:hidden"}>
        <div>
            <SignedIn>
              <div className="border-t border-ink/15 bg-bg px-4 pt-2">
                <UserButton
                  variant="menu"
                  nameTo={me?.isTrainer ? "/studio" : "/portal"}
                  onNavigate={() => setOpen(false)}
                />
              </div>
            </SignedIn>
          <nav className="flex flex-col border-t border-ink/15 bg-bg px-4 py-4 text-center">
            {LINKS.map((l) => {
              const id = l.href.split("#")[1];
              return (
                <a
                  key={l.href}
                  href={l.href}
                  className="menu-link"
                  onClick={(e) => {
                    e.preventDefault();
                    setOpen(false);
                    if (!id) return;
                    goToHomeSection(id, navigate);
                  }}
                >
                  {l.label}
                </a>
              );
            })}
            <Link
              to="/intake"
              className="menu-link"
              onClick={() => setOpen(false)}
            >
              Book a consult
            </Link>
            {signedOut ? (
              <Link
                to="/login"
                className="menu-link"
                onClick={() => setOpen(false)}
              >
                Log in
              </Link>
            ) : null}
          </nav>
        </div>
      </div>
    </header>
  );
}
