import { useSyncExternalStore } from "react";

let frozen = false;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

/** Keep Log in / Book a consult up through a sign-in, so they don't blink mid-handoff. */
export function freezeSignedOutHeader(on: boolean) {
  if (frozen === on) return;
  frozen = on;
  emit();
}

export function useFrozenSignedOutHeader() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => frozen,
    () => false,
  );
}
