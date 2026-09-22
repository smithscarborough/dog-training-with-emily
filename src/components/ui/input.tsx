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

export function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
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
