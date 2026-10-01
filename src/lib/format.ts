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

/** Open visits stay on top, soonest first. Past visits follow by the date they happened, newest first. */
export function compareSessionList(
  a: { status: string; scheduled_at: string },
  b: { status: string; scheduled_at: string },
) {
  const open = (status: string) => status === "requested" || status === "confirmed";
  const aOpen = open(a.status);
  const bOpen = open(b.status);
  if (aOpen !== bOpen) return aOpen ? -1 : 1;
  const at = new Date(a.scheduled_at).getTime();
  const bt = new Date(b.scheduled_at).getTime();
  return aOpen ? at - bt : bt - at;
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

export function checkinTone(status: string): "practiced" | "skipped" | "stuck" | "default" {
  if (status === "practiced") return "practiced";
  if (status === "skipped") return "skipped";
  if (status === "stuck") return "stuck";
  return "default";
}
