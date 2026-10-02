import { useState, type KeyboardEvent } from "react";
import { PHASES, phaseFor } from "@/lib/catalog";
import { cn } from "@/lib/utils";

export function PhaseMeter({
  rating,
  compact = false,
  stable = false,
  className,
}: {
  rating: number;
  compact?: boolean;
  stable?: boolean;
  className?: string;
}) {
  const phase = phaseFor(rating);
  return (
    <div className={cn("flex w-full min-w-0 flex-col gap-1.5", className)}>
      <div className={cn("flex items-start justify-between gap-2", stable && "min-h-10")}>
        <span className="min-w-0 text-sm font-medium leading-snug text-ink">{phase.label}</span>
        <span className="shrink-0 pt-0.5 tabular-nums text-xs text-muted">
          {rating > 0 ? `${rating} / 7` : "—"}
        </span>
      </div>
      <div className="flex gap-1">
        {PHASES.map((p) => (
          <span
            key={p.rating}
            title={p.label}
            className={cn(
              "h-1.5 min-w-0 flex-1 rounded-full",
              rating >= p.rating ? "bg-accent" : "bg-surface-2",
            )}
          />
        ))}
      </div>
      {compact ? null : (
        <p className="text-xs leading-relaxed text-muted">{phase.blurb}</p>
      )}
    </div>
  );
}

export function PhaseLegend() {
  const [active, setActive] = useState(1);
  const phase = PHASES[active - 1] ?? PHASES[0];
  const stage = active <= 4 ? "Foundations" : "Proofing";

  function move(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    event.preventDefault();
    const next =
      event.key === "ArrowRight" ? (active % PHASES.length) + 1 : active === 1 ? PHASES.length : active - 1;
    setActive(next);
    event.currentTarget.querySelector<HTMLButtonElement>(`[data-phase="${next}"]`)?.focus();
  }

  return (
    <div>
      <div
        role="tablist"
        aria-label="Score phases"
        className="relative flex items-center justify-between"
        onKeyDown={move}
      >
        <span aria-hidden className="absolute top-1/2 right-4 left-4 h-px -translate-y-1/2 bg-line" />
        {PHASES.map((p) => {
          const on = p.rating === active;
          return (
            <button
              key={p.rating}
              type="button"
              role="tab"
              data-phase={p.rating}
              aria-selected={on}
              aria-label={`${p.rating}. ${p.label}`}
              className={cn(
                "relative z-10 grid size-9 place-items-center rounded-full text-sm font-semibold tabular-nums transition-colors duration-150",
                "focus-visible:outline-none focus-visible:[box-shadow:0_0_0_3px_color-mix(in_oklab,var(--color-accent)_35%,transparent)]",
                on
                  ? "bg-accent text-ink shadow-[0_0_0_4px_var(--color-surface)]"
                  : "bg-pearl text-muted shadow-[0_0_0_4px_var(--color-surface),0_0_0_5px_rgba(44,24,16,0.12)] hover:text-ink",
              )}
              onClick={() => setActive(p.rating)}
            >
              {p.rating}
            </button>
          );
        })}
      </div>
      <div className="mt-4 rounded-lg bg-pearl px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.75),0_1px_2px_rgba(44,24,16,0.08),0_8px_16px_-10px_rgba(44,24,16,0.32)]">
        <p className="text-[11px] font-semibold tracking-[0.14em] text-accent-deep uppercase">{stage}</p>
        <p className="mt-1 text-sm font-bold text-ink">{phase.label}</p>
        <p className="mt-1 text-sm leading-relaxed text-muted">{phase.blurb}</p>
      </div>
    </div>
  );
}
