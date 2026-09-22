import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function EspressoBanner({
  kicker,
  children,
  className,
}: {
  kicker?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("bg-ink text-bg", className)}>
      <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-3.5 sm:flex-row sm:items-center sm:gap-4 sm:px-6">
        {kicker ? (
          <p className="shrink-0 text-sm font-semibold text-accent-soft">{kicker}</p>
        ) : null}
        <p className="text-sm leading-relaxed text-bg/80">{children}</p>
      </div>
    </div>
  );
}
