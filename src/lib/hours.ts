export type HoursDay = {
  day: number;
  open: boolean;
  start: string;
  end: string;
};

export const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
export const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;
export const HOURS_ORDER = [1, 2, 3, 4, 5, 6, 0];

const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function toMinutes(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  return h! * 60 + m!;
}

export function defaultHours(): HoursDay[] {
  return [0, 1, 2, 3, 4, 5, 6].map((day) => ({
    day,
    open: day >= 1 && day <= 5,
    start: "09:00",
    end: "17:00",
  }));
}

export function clockOptions() {
  const out: string[] = [];
  for (let m = 6 * 60; m <= 21 * 60; m += 30) {
    out.push(`${pad(Math.floor(m / 60))}:${pad(m % 60)}`);
  }
  return out;
}

export function formatClock(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  const d = new Date(2000, 0, 1, h, m, 0, 0);
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export function parseHours(raw: string | null | undefined): HoursDay[] {
  const fallback = defaultHours();
  if (!raw?.trim()) return fallback;
  try {
    return normalizeHours(JSON.parse(raw));
  } catch {
    return fallback;
  }
}

export function normalizeHours(input: unknown): HoursDay[] {
  const base = defaultHours();
  if (!Array.isArray(input)) throw new Error("Hours are missing.");
  const byDay = new Map<number, HoursDay>();
  for (const row of input) {
    if (!row || typeof row !== "object") continue;
    const day = Number((row as HoursDay).day);
    if (!Number.isInteger(day) || day < 0 || day > 6) continue;
    const start = String((row as HoursDay).start ?? "");
    const end = String((row as HoursDay).end ?? "");
    if (!TIME_RE.test(start) || !TIME_RE.test(end)) throw new Error("Use a real start and end time.");
    const open = Boolean((row as HoursDay).open);
    if (open && toMinutes(end) <= toMinutes(start)) {
      throw new Error(`${DAY_NAMES[day]} needs an end time after the start.`);
    }
    byDay.set(day, { day, open, start, end });
  }
  return base.map((d) => byDay.get(d.day) ?? d);
}

export function serializeHours(hours: HoursDay[]) {
  return JSON.stringify(normalizeHours(hours));
}

export function chicagoParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const weekday = parts.find((p) => p.type === "weekday")?.value ?? "Sun";
  let hour = Number(parts.find((p) => p.type === "hour")?.value ?? "0");
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? "0");
  if (hour === 24) hour = 0;
  const day = DAY_SHORT.indexOf(weekday as (typeof DAY_SHORT)[number]);
  return { day: day < 0 ? date.getDay() : day, minutes: hour * 60 + minute };
}

export function isWithinHours(date: Date, hours: HoursDay[], durationMin: number) {
  if (Number.isNaN(date.getTime())) return false;
  const { day, minutes } = chicagoParts(date);
  const spec = hours.find((h) => h.day === day);
  if (!spec?.open) return false;
  const start = toMinutes(spec.start);
  const end = toMinutes(spec.end);
  if (minutes % 15 !== 0) return false;
  return minutes >= start && minutes + durationMin <= end;
}

export function slotsForDate(day: Date, hours: HoursDay[], durationMin: number, now = new Date()) {
  const spec = hours.find((h) => h.day === day.getDay());
  if (!spec?.open) return [];
  const start = toMinutes(spec.start);
  const end = toMinutes(spec.end);
  const out: string[] = [];
  for (let t = start; t + durationMin <= end; t += 15) {
    const h = Math.floor(t / 60);
    const m = t % 60;
    const slot = new Date(day);
    slot.setHours(h, m, 0, 0);
    if (slot.getTime() <= now.getTime()) continue;
    out.push(`${pad(h)}:${pad(m)}`);
  }
  return out;
}

export function dayIsOpen(day: Date, hours: HoursDay[]) {
  return Boolean(hours.find((h) => h.day === day.getDay())?.open);
}

export function nextOpenSlot(hours: HoursDay[], durationMin: number, now = new Date()) {
  const cursor = new Date(now);
  cursor.setHours(0, 0, 0, 0);
  for (let i = 0; i < 60; i += 1) {
    const slots = slotsForDate(cursor, hours, durationMin, now);
    if (slots[0]) {
      const [h, m] = slots[0].split(":").map(Number);
      const next = new Date(cursor);
      next.setHours(h!, m, 0, 0);
      return next;
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return null;
}

export function hoursSummary(hours: HoursDay[]) {
  const open = HOURS_ORDER.map((day) => hours.find((h) => h.day === day)).filter((d): d is HoursDay => Boolean(d?.open));
  if (!open.length) return "Closed. No one can request a time.";
  const groups: { days: number[]; start: string; end: string }[] = [];
  for (const day of open) {
    const last = groups[groups.length - 1];
    const prev = last ? HOURS_ORDER.indexOf(last.days[last.days.length - 1]!) : -1;
    const here = HOURS_ORDER.indexOf(day.day);
    if (last && last.start === day.start && last.end === day.end && here === prev + 1) last.days.push(day.day);
    else groups.push({ days: [day.day], start: day.start, end: day.end });
  }
  return groups
    .map((group) => {
      const names = group.days.map((day) => DAY_SHORT[day]);
      const label =
        names.length > 2 ? `${names[0]}–${names[names.length - 1]}` : names.join(", ");
      return `${label} · ${formatClock(group.start)}–${formatClock(group.end)}`;
    })
    .join("   ");
}
