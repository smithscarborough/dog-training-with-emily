import { PHASES, phaseFor } from "@/lib/catalog";
import { cn } from "@/lib/utils";

export function PhaseMeter({
  rating,
  compact = false,
}: {
  rating: number;
  compact?: boolean;
}) {
  const phase = phaseFor(rating);
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-ink">{phase.label}</span>
        <span className="tabular-nums text-xs text-muted">
          {rating > 0 ? `${rating} / 7` : "—"}
        </span>
      </div>
      <div className="flex gap-1">
        {PHASES.map((p) => (
          <span
            key={p.rating}
            title={p.label}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-colors duration-200",
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
  return (
    <ol className="grid gap-3 sm:grid-cols-2">
      {PHASES.map((p) => (
        <li
          key={p.rating}
          className="flex gap-3 rounded-lg bg-pearl px-3 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.75),0_1px_2px_rgba(44,24,16,0.08),0_8px_16px_-10px_rgba(44,24,16,0.32)]"
        >
          <span className="font-display text-lg font-bold tabular-nums text-accent-deep">{p.rating}</span>
          <span>
            <span className="block text-sm font-bold text-ink">{p.label}</span>
            <span className="text-xs text-muted">{p.blurb}</span>
          </span>
        </li>
      ))}
    </ol>
  );
}
