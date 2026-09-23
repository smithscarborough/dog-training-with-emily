import { Link, useNavigate } from "@tanstack/react-router";
import { Wordmark } from "@/components/brand/logo";
import { ContactMethods, SocialLinks } from "@/components/brand/social-links";
import { goToHomeSection } from "@/lib/scroll-to-section";

export function SiteFooter() {
  const navigate = useNavigate();
  return (
    <footer className="mt-auto flex flex-1 flex-col bg-ink text-bg">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Wordmark invert className="h-20 max-w-[18rem] rounded-md sm:h-24 sm:max-w-[22rem] lg:h-28 lg:max-w-[26rem]" />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-bg/70">
            In-home dog training in the Greater Houston area. Enrichment and
            structure — not a list of tricks for the internet.
          </p>
        </div>
        <div>
          <p className="text-sm text-accent-soft">Visit</p>
          <ul className="mt-3 space-y-2 text-sm text-bg/70">
            <li>
              <a
                href="/#about"
                className="hover:text-bg"
                onClick={(e) => {
                  e.preventDefault();
                  goToHomeSection("about", navigate);
                }}
              >
                About
              </a>
            </li>
            <li>
              <a
                href="/#services"
                className="hover:text-bg"
                onClick={(e) => {
                  e.preventDefault();
                  goToHomeSection("services", navigate);
                }}
              >
                Sessions
              </a>
            </li>
            <li>
              <Link to="/intake" className="hover:text-bg">
                Book a consult
              </Link>
            </li>
            <li>
              <Link to="/login" className="hover:text-bg">
                Client login
              </Link>
            </li>
            <li>
              <Link to="/login" className="hover:text-bg">
                Trainer studio
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-sm text-accent-soft">Contact</p>
          <ContactMethods className="mt-2" tone="on-dark" />
          <SocialLinks className="mt-4" tone="on-dark" />
        </div>
      </div>
      <p className="mx-auto mt-auto flex max-w-6xl items-center justify-center gap-2 px-4 py-4 text-xs tracking-wide text-bg/55 sm:px-6">
          <img
            src="/images/us-flag.svg"
            alt=""
            width={22}
            height={12}
            className="frame-none h-3 w-[1.375rem] shrink-0 rounded-[1px] object-cover"
          />
          A proud American small business.
        </p>
    </footer>
  );
}