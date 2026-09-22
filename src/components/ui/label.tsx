import * as React from "react";
import { cn } from "@/lib/utils";

export function Label({ className, ...props }: React.ComponentProps<"label">) {
  return (
    <label
      className={cn("text-sm font-bold text-[#1a0e0a]", className)}
      {...props}
    />
  );
}

export function Field({
  label,
  hint,
  required,
  children,
  className,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("flex flex-col gap-2", className)}>
      <span className="text-sm font-bold text-[#1a0e0a]">
        {label}
        {required ? (
          <span className="ml-0.5 text-accent-deep" aria-hidden="true">
            *
          </span>
        ) : null}
      </span>
      {children}
      {hint ? <span className="text-xs text-faint">{hint}</span> : null}
    </label>
  );
}
