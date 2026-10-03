const TZ = "America/Chicago";

export function formatWhen(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(d);
}

export function formatDay(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(d);
}

export function toDatetimeLocalValue(iso?: string) {
  const d = iso ? new Date(iso) : new Date();
  const tz = d.toLocaleString("en-US", { timeZone: TZ });
  const local = new Date(tz);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${local.getFullYear()}-${pad(local.getMonth() + 1)}-${pad(local.getDate())}T${pad(local.getHours())}:${pad(local.getMinutes())}`;
}

function chicagoDay(iso: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));
}

/** Upcoming visits first, soonest at the top. Past visits that are still open come next. Then cancelled, then completed. */
export function compareSessionList(
  a: { status: string; scheduled_at: string; updated_at?: string },
  b: { status: string; scheduled_at: string; updated_at?: string },
) {
  const today = chicagoDay(new Date().toISOString());
  const rank = (row: { status: string; scheduled_at: string }) => {
    if (row.status === "requested" || row.status === "confirmed") {
      return chicagoDay(row.scheduled_at) >= today ? 0 : 1;
    }
    if (row.status === "cancelled") return 2;
    return 3;
  };
  const byRank = rank(a) - rank(b);
  if (byRank !== 0) return byRank;
  const when = (row: { status: string; scheduled_at: string; updated_at?: string }) => {
    const stamp = row.status === "cancelled" && row.updated_at ? row.updated_at : row.scheduled_at;
    return new Date(stamp).getTime();
  };
  const at = when(a);
  const bt = when(b);
  return rank(a) === 0 ? at - bt : bt - at;
}

export function statusTone(status: string): "default" | "accent" | "ok" | "warn" | "muted" | "solid" | "done" {
  if (status === "confirmed") return "solid";
  if (status === "completed") return "done";
  if (status === "active") return "ok";
  if (status === "requested" || status === "pending") return "accent";
  if (status === "cancelled" || status === "archived") return "warn";
  if (status === "paused") return "muted";
  return "default";
}

export function checkinTone(status: string): "practiced" | "skipped" | "stuck" | "note" | "default" {
  if (status === "practiced") return "practiced";
  if (status === "skipped") return "skipped";
  if (status === "stuck") return "stuck";
  if (status === "note") return "note";
  return "default";
}
