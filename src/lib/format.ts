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
