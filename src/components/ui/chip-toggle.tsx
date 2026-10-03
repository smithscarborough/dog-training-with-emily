import { useRef, type ButtonHTMLAttributes, type PointerEvent as ReactPointerEvent } from "react";
import { cn } from "@/lib/utils";

type ChipToggleProps = {
  pressed: boolean;
  onToggle: () => void;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onClick" | "onPointerDown" | "onPointerUp" | "aria-pressed" | "aria-checked">;

/** Toggles the chip that was pressed, even if a phone retargets the click onto a neighbor. */
export function ChipToggle({ pressed, onToggle, className, role, type = "button", ...props }: ChipToggleProps) {
  const arm = useRef<"captured" | "pending" | null>(null);

  function onPointerDown(e: ReactPointerEvent<HTMLButtonElement>) {
    if (e.button !== 0) return;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
      arm.current = "captured";
    } catch {
      arm.current = "pending";
    }
  }

  function onPointerUp() {
    if (arm.current !== "captured") return;
    arm.current = null;
    onToggle();
  }

  return (
    <button
      type={type}
      role={role}
      aria-pressed={role === "radio" ? undefined : pressed}
      aria-checked={role === "radio" ? pressed : undefined}
      className={cn("chip-3d rounded-full px-3 py-2 text-sm", pressed && "is-on", className)}
      {...props}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={() => {
        arm.current = null;
      }}
      onClick={(e) => {
        if (e.detail === 0 || arm.current === "pending") {
          arm.current = null;
          onToggle();
          return;
        }
        e.preventDefault();
      }}
    />
  );
}
