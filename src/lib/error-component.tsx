import { useEffect } from "react";
import type { ErrorComponentProps } from "@tanstack/react-router";
import { TriangleAlert } from "lucide-react";

const FALLBACK_MESSAGE = "An unexpected error occurred. Try reloading the page.";
const CHUNK_RELOAD_KEY = "dtwe-chunk-reload";

function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string" && error) return error;
  return FALLBACK_MESSAGE;
}

function isStaleChunk(error: unknown): boolean {
  const msg = errorMessage(error);
  return (
    msg.includes("Failed to fetch dynamically imported module") ||
    msg.includes("Importing a module script failed") ||
    msg.includes("error loading dynamically imported module")
  );
}

export function AppErrorComponent({ error }: ErrorComponentProps) {
  const stale = isStaleChunk(error);

  useEffect(() => {
    if (!stale) return;
    try {
      if (sessionStorage.getItem(CHUNK_RELOAD_KEY)) return;
      sessionStorage.setItem(CHUNK_RELOAD_KEY, "1");
      window.location.reload();
    } catch {
      /* ignore */
    }
  }, [stale]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 bg-bg px-6 text-center text-ink">
      <span className="text-danger" aria-hidden="true">
        <TriangleAlert className="size-10" strokeWidth={2} />
      </span>
      <h1 className="font-display text-lg">Something went wrong</h1>
      <p className="max-w-md text-sm break-words text-muted">
        {stale
          ? "The site just updated. Reloading to pick up the latest version…"
          : errorMessage(error)}
      </p>
      <button
        type="button"
        className="mt-2 text-sm font-semibold text-accent-deep underline underline-offset-4"
        onClick={() => {
          try {
            sessionStorage.removeItem(CHUNK_RELOAD_KEY);
          } catch {
            /* ignore */
          }
          window.location.reload();
        }}
      >
        Reload
      </button>
    </main>
  );
}
