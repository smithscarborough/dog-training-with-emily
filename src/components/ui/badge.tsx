import { cn } from "@/lib/utils";

export function Badge({
  className,
  tone = "default",
  ...props
}: React.ComponentProps<"span"> & {
  tone?: "default" | "accent" | "ok" | "warn" | "muted" | "solid" | "done" | "stuck" | "practiced" | "skipped" | "note";
}) {
  return (
    <span
      className={cn(
        "inline-flex h-6 shrink-0 items-center whitespace-nowrap rounded-full px-2.5 text-[11px] font-bold uppercase leading-none tracking-wide",
        tone === "default" && "bg-surface-2 text-ink-soft",
        tone === "accent" && "bg-[#43C5B9] text-ink",
        tone === "solid" && "badge-confirmed text-bg",
        tone === "done" && "bg-[#45403C] text-bg",
        tone === "ok" && "bg-ok/40 text-ink",
        tone === "warn" && "bg-[#9b3a2f] text-bg",
        tone === "muted" && "bg-ink/16 text-ink ring-1 ring-ink/25",
        tone === "stuck" && "badge-stuck text-ink",
        tone === "practiced" && "badge-practiced text-ink",
        tone === "skipped" && "badge-skipped text-bg",
        tone === "note" && "badge-note bg-pearl text-ink ring-1 ring-ink/40",
        className,
      )}
      {...props}
    />
  );
}