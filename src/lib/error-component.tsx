import { useEffect } from "react";
import type { ErrorComponentProps } from "@tanstack/react-router";
import { TriangleAlert } from "lucide-react";

const FALLBACK_MESSAGE = "An unexpected error occurred. Try reloading the page.";
const CHUNK_RELOAD_KEY = "dtwe-chunk-reload";

export function clearChunkReloadFlag() {
  try {
    sessionStorage.removeItem(CHUNK_RELOAD_KEY);
  } catch {
    /* ignore */
  }
}

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

function freshUrl(): string {
  const url = new URL(window.location.href);
  url.searchParams.set("v", String(Date.now()));
  return url.toString();
}

function readAttempt(): { n: number; t: number } {
  try {
    const raw = sessionStorage.getItem(CHUNK_RELOAD_KEY);
    if (!raw) return { n: 0, t: 0 };
    if (raw.startsWith("{")) {
      const parsed = JSON.parse(raw) as { n?: number; t?: number };
      return { n: Number(parsed.n) || 0, t: Number(parsed.t) || 0 };
    }
    return { n: Number(raw) || 0, t: Date.now() };
  } catch {
    return { n: 0, t: 0 };
  }
}

export function AppErrorComponent({ error }: ErrorComponentProps) {
  const stale = isStaleChunk(error);

  useEffect(() => {
    if (!stale) return;
    const now = Date.now();
    let { n, t } = readAttempt();
    if (now - t > 60000) n = 0;
    if (n >= 8) return;
    const next = n + 1;
    try {
      sessionStorage.setItem(CHUNK_RELOAD_KEY, JSON.stringify({ n: next, t: now }));
    } catch {
      /* ignore */
    }
    const delay = next === 1 ? 300 : 1200;
    const id = window.setTimeout(() => window.location.replace(freshUrl()), delay);
    return () => window.clearTimeout(id);
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
          clearChunkReloadFlag();
          window.location.replace(freshUrl());
        }}
      >
        Reload
      </button>
    </main>
  );
}
