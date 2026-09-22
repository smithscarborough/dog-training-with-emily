import { cn } from "@/lib/utils";

const ASPECT = 793 / 1513;

/** Placeholder hero photo — swap `src` when Emily’s portraits are ready. */
export function TeddyPortrait({ className }: { className?: string }) {
  return (
    <div
      className={cn("hero-photo relative mx-auto w-full", className)}
      style={{ aspectRatio: `${ASPECT}` }}
      aria-hidden="true"
    >
      <img
        src="/images/teddy.png?v=6"
        alt=""
        className="frame-none absolute inset-0 h-full w-full object-contain object-bottom"
      />
    </div>
  );
}
