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
        tone === "accent" && "badge-status bg-[#1f8a82] text-bg",
        tone === "solid" && "badge-confirmed px-3 py-1 font-bold text-bg",
        tone === "done" && "bg-ink px-3 py-1 font-bold text-bg",
        tone === "ok" && "badge-status bg-[#2f6d62] text-bg",
        tone === "warn" && "badge-status bg-[#9b3a2f] text-bg",
        tone === "muted" && "badge-status bg-[#6d5648] text-bg",
        className,
      )}
      {...props}
    />
  );
}
