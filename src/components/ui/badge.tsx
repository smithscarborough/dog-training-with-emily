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
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium tracking-wide uppercase",
        tone === "default" && "bg-surface-2 text-ink-soft",
        tone === "accent" && "bg-[#43C5B9] px-3 py-1 font-bold text-ink",
        tone === "solid" && "badge-confirmed px-3 py-1 font-bold text-bg",
        tone === "done" && "bg-[#4a6670] px-3 py-1 font-bold text-bg",
        tone === "ok" && "bg-ok/40 font-semibold text-ink",
        tone === "warn" && "bg-[#9b3a2f] px-3 py-1 font-bold text-bg",
        tone === "muted" && "bg-ink/16 font-semibold text-ink ring-1 ring-ink/30",
        tone === "stuck" && "bg-[#e07062] px-3 py-1 font-bold text-ink shadow-[inset_0_1px_0_rgba(255,255,255,0.4)]",
        tone === "practiced" && "bg-[#7dcc93] px-3 py-1 font-bold text-ink shadow-[inset_0_1px_0_rgba(255,255,255,0.45)]",
        tone === "skipped" && "bg-[#f0e2cf] px-3 py-1 font-bold text-ink ring-1 ring-[#d3c0a6] shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]",
        className,
      )}
      {...props}
    />
  );
}
