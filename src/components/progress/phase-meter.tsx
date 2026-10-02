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
  const groups = [
    { title: "Foundations", items: PHASES.filter((phase) => phase.rating <= 4) },
    { title: "Proofing", items: PHASES.filter((phase) => phase.rating >= 5) },
  ];

  return (
    <div className="grid gap-8 sm:grid-cols-2 sm:gap-10">
      {groups.map((group) => (
        <section key={group.title}>
          <h4 className="text-sm font-bold tracking-[0.08em] text-accent-deep uppercase sm:text-base">{group.title}</h4>
          <ol className="relative mt-4">
            <span aria-hidden className="absolute top-3 bottom-3 left-[15px] w-px bg-line" />
            {group.items.map((phase) => (
              <li key={phase.rating} className="relative flex gap-3 pb-5 last:pb-0">
                <span className="relative z-10 grid size-8 shrink-0 place-items-center rounded-full bg-pearl text-sm font-semibold text-accent-deep tabular-nums shadow-[0_0_0_1px_rgba(44,24,16,0.12)]">
                  {phase.rating}
                </span>
                <span className="min-w-0 pt-0.5">
                  <span className="block text-sm font-bold text-ink">{phase.label}</span>
                  <span className="mt-0.5 block text-sm leading-relaxed text-muted">{phase.blurb}</span>
                </span>
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}
