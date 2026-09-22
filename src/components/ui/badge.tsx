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
        tone === "accent" && "bg-accent/25 text-ink",
        tone === "solid" && "badge-confirmed px-3 py-1 font-bold text-bg",
        tone === "done" && "bg-ink px-3 py-1 font-bold text-bg",
        tone === "ok" && "bg-ok/15 text-ok",
        tone === "warn" && "bg-danger/10 text-danger",
        tone === "muted" && "bg-transparent text-muted ring-1 ring-line",
        className,
      )}
      {...props}
    />
  );
}
