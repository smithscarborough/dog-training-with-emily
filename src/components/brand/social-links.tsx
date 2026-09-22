import type { ReactNode } from "react";
import { Mail, Phone } from "lucide-react";
import {
  PLACEHOLDER_EMAIL,
  PLACEHOLDER_FACEBOOK,
  PLACEHOLDER_INSTAGRAM,
  PLACEHOLDER_PHONE,
  PLACEHOLDER_X,
} from "@/lib/catalog";
import { cn } from "@/lib/utils";

/** Slightly lopsided circle — same doodle language for all three. */
const CIRCLE =
  "M32.2 5.6c12.8-.9 25.4 7.2 26.6 21.2 1.2 14.2-7.6 27.4-21.4 28.8C23.2 57.1 7.4 49.6 6.1 34.8 4.8 20.2 17.8 6.6 32.2 5.6Z";

function DoodleDisc({
  fill,
  className,
  children,
}: {
  fill: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <path
        d={CIRCLE}
        fill={fill}
        stroke="#111"
        strokeWidth="3.6"
        strokeLinejoin="round"
      />
      {children}
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <DoodleDisc fill="#F7C4D4" className={className}>
      <path
        fill="#F7FBFF"
        stroke="#111"
        strokeWidth="2.7"
        strokeLinejoin="round"
        strokeLinecap="round"
        d="M21.4 22.2c.3-4.2 3.1-5.8 7-6.1l10.6-.5c4.1-.2 7.2 2 6.9 6.2l-.8 13.2c-.4 3.9-2.8 6.1-6.8 6.3H27.1c-4.2.2-7-2-6.7-6.2l1-12.9z"
      />
      <path
        fill="none"
        stroke="#111"
        strokeWidth="2.6"
        strokeLinecap="round"
        d="M27.1 28.6c1.6-3.6 8.2-4.4 10.4-.6 2.4 4.1-.8 9.2-5.6 8.9-4.2-.3-6.6-4.8-4.8-8.3z"
      />
      <path
        fill="#111"
        d="M40.2 21.4c1.6-.3 3.1.9 2.8 2.3-.3 1.2-1.8 1.9-3 1.5-1.3-.5-1.6-2.4.2-3.8z"
      />
    </DoodleDisc>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <DoodleDisc fill="#4A90E2" className={className}>
      <path
        fill="#F4F8FF"
        stroke="#111"
        strokeWidth="2.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        d="M31.6 51.6c-.6-7.4-.4-14.6-.2-21.4h-4.6c-.4-2.2-.5-4.2.4-5.8h4.4c.2-2.6.6-5.4 2.2-7.4 1.8-2.2 4.6-3.2 7.8-3.1 1.6.1 3.2.4 4.6.8v6.2c-1.4-.3-2.6-.5-3.8-.4-1.8.1-2.6 1.1-2.8 2.8v2.8h6.2c-.2 2-.6 4-1.1 5.6h-5.2c-.2 6.6.1 13.2.4 19.9h-8.3z"
      />
    </DoodleDisc>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <DoodleDisc fill="#2B2B2B" className={className}>
      <path
        fill="#F4F8FF"
        stroke="#111"
        strokeWidth="2.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        d="M20.6 19.4c1.1-1 3-.4 4.1.8l7.6 10.2 9.2-12c.9-1.1 2.8-1.2 3.9-.1 1.1 1 .8 2.8-.3 3.9L34.6 33.6l11.4 13.8c1 1.1.6 3-.6 3.8-1.3.9-3 .3-4.1-.9l-8.2-10.8-9.8 12.4c-1 1.2-2.9 1.1-4 .1-1.1-1.1-.8-3 .3-4.1l10-11.8-8.8-12.2c-.9-1.2-.4-3 1-3.5z"
      />
    </DoodleDisc>
  );
}

const SOCIALS = [
  { href: PLACEHOLDER_INSTAGRAM, label: "Instagram", Icon: InstagramIcon },
  { href: PLACEHOLDER_FACEBOOK, label: "Facebook", Icon: FacebookIcon },
  { href: PLACEHOLDER_X, label: "X", Icon: XIcon },
] as const;

export function SocialLinks({
  className,
}: {
  className?: string;
  tone?: "ink" | "on-dark";
}) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      {SOCIALS.map(({ href, label, Icon }) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noreferrer"
          aria-label={label}
          title={label}
          className="inline-flex size-12 items-center justify-center rounded-full transition-transform duration-150 hover:-translate-y-0.5"
        >
          <Icon className="size-11" />
        </a>
      ))}
    </div>
  );
}

export function ContactMethods({
  className,
  tone = "ink",
}: {
  className?: string;
  tone?: "ink" | "on-dark";
}) {
  const onDark = tone === "on-dark";
  return (
    <ul className={cn("space-y-1", className)}>
      <li>
        <a
          className={cn(
            "inline-flex min-h-11 items-center gap-3 text-sm",
            onDark ? "text-bg hover:text-accent-soft" : "font-medium text-ink hover:text-ink",
          )}
          href={`mailto:${PLACEHOLDER_EMAIL}`}
        >
          <Mail className={cn("size-4 shrink-0", onDark ? "text-accent-soft" : "text-ink")} />
          {PLACEHOLDER_EMAIL}
        </a>
      </li>
      <li>
        <a
          className={cn(
            "inline-flex min-h-11 items-center gap-3 text-sm",
            onDark ? "text-bg hover:text-accent-soft" : "font-medium text-ink hover:text-ink",
          )}
          href="tel:+17135550148"
        >
          <Phone className={cn("size-4 shrink-0", onDark ? "text-accent-soft" : "text-ink")} />
          {PLACEHOLDER_PHONE}
        </a>
      </li>
    </ul>
  );
}
