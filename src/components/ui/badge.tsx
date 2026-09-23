import { cn } from "@/lib/utils";

export function Badge({
  className,
  tone = "default",
  ...props
}: React.ComponentProps<"span"> & {
  tone?: "default" | "accent" | "ok" | "warn" | "muted" | "solid" | "done";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium tracking-wide uppercase",
        tone === "default" && "bg-surface-2 text-ink-soft",
        tone === "accent" && "bg-accent/60 font-semibold text-accent-deep",
        tone === "solid" && "badge-confirmed px-3 py-1 font-bold text-bg",
        tone === "done" && "bg-ink px-3 py-1 font-bold text-bg",
        tone === "ok" && "bg-ok/40 font-semibold text-[#245233]",
        tone === "warn" && "bg-danger/32 font-semibold text-danger",
        tone === "muted" && "bg-ink/16 font-semibold text-ink-soft ring-1 ring-ink/30",
        className,
      )}
      {...props}
    />
  );
}
