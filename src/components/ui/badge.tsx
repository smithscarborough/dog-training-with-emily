import { cn } from "@/lib/utils";

export function Badge({
  className,
  tone = "default",
  ...props
}: React.ComponentProps<"span"> & {
  tone?: "default" | "accent" | "ok" | "warn" | "muted" | "solid" | "done" | "stuck" | "practiced" | "skipped";
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-medium tracking-wide uppercase",
        tone === "default" && "bg-surface-2 text-ink-soft",
        tone === "accent" && "bg-[#43C5B9] px-3 py-1 font-bold text-ink",
        tone === "solid" && "badge-confirmed px-3 py-1 font-bold text-bg",
        tone === "done" && "bg-[#4a6670] px-3 py-1 font-bold text-bg",
        tone === "ok" && "bg-ok/40 font-semibold text-ink",
        tone === "warn" && "bg-[#9b3a2f] px-3 py-1 font-bold text-bg",
        tone === "muted" && "bg-ink/16 font-semibold text-ink ring-1 ring-ink/30",
        tone === "stuck" && "badge-stuck px-3 py-1 font-bold text-ink",
        tone === "practiced" && "badge-practiced px-3 py-1 font-bold text-ink",
        tone === "skipped" && "badge-skipped px-3 py-1 font-bold text-ink",
        className,
      )}
      {...props}
    />
  );
}
