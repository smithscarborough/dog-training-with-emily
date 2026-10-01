import * as React from "react";
import { cn } from "@/lib/utils";

export function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      className={cn(
        "flex h-11 w-full rounded-md border border-line bg-surface px-3 text-base text-ink sm:text-sm",
        "placeholder:text-[#a39284] shadow-[inset_0_1px_0_rgba(47,28,18,0.04)]",
        "transition-[border-color,box-shadow,transform] duration-150 ease-out",
        "focus-visible:outline-none focus-visible:border-accent focus-visible:-translate-y-px",
        "focus-visible:[box-shadow:0_0_0_3px_color-mix(in_oklab,var(--color-accent)_35%,transparent)]",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

function GrowingTextarea({
  className,
  growMin,
  growMax,
  ...props
}: React.ComponentProps<"textarea"> & { growMin: number; growMax: number }) {
  const area = React.useRef<HTMLTextAreaElement>(null);
  const [height, setHeight] = React.useState(growMin);

  React.useEffect(() => {
    const el = area.current;
    if (!el) return;
    const native = typeof CSS !== "undefined" && CSS.supports("field-sizing", "content");
    const measure = () => {
      if (!native) {
        el.style.height = "auto";
        const content = Math.min(Math.max(el.scrollHeight, growMin), growMax);
        el.style.height = `${content}px`;
      }
      const next = Math.min(Math.max(el.offsetHeight, growMin), growMax);
      setHeight((prev) => (Math.abs(prev - next) < 1 ? prev : next));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [props.value, growMin, growMax]);

  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border border-line bg-surface shadow-[inset_0_1px_0_rgba(47,28,18,0.04)]",
        "transition-[height,border-color,box-shadow] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
        "focus-within:border-accent focus-within:[box-shadow:0_0_0_3px_color-mix(in_oklab,var(--color-accent)_35%,transparent)]",
        className,
      )}
      style={{ height }}
    >
      <textarea
        ref={area}
        {...props}
        style={{ minHeight: growMin, maxHeight: growMax }}
        className="block w-full resize-none overflow-y-auto border-0 bg-transparent px-3 py-2.5 text-base leading-relaxed text-ink outline-none placeholder:text-[#a39284] [field-sizing:content] sm:text-sm"
      />
    </div>
  );
}

export function Textarea({
  className,
  grow = false,
  growMin = 152,
  growMax = 352,
  ...props
}: React.ComponentProps<"textarea"> & {
  grow?: boolean;
  growMin?: number;
  growMax?: number;
}) {
  if (grow) {
    return <GrowingTextarea className={className} growMin={growMin} growMax={growMax} {...props} />;
  }
  return (
    <textarea
      className={cn(
        "flex min-h-28 w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-base text-ink sm:text-sm",
        "placeholder:text-[#a39284] shadow-[inset_0_1px_0_rgba(47,28,18,0.04)]",
        "transition-[border-color,box-shadow,transform] duration-150 ease-out",
        "focus-visible:outline-none focus-visible:border-accent focus-visible:-translate-y-px",
        "focus-visible:[box-shadow:0_0_0_3px_color-mix(in_oklab,var(--color-accent)_35%,transparent)]",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}