export const HOLIDAY_IDS = [
  "new-year",
  "valentine",
  "patrick",
  "easter",
  "mothers",
  "memorial",
  "fathers",
  "july4",
  "halloween",
  "thanksgiving",
  "christmas",
] as const;

export type HolidayId = (typeof HOLIDAY_IDS)[number];

export type Holiday = {
  id: HolidayId;
  name: string;
  line: string;
  color: string;
  motion: boolean;
  year: number;
  range: string;
  through: string;
  preview: boolean;
};

type Ymd = { year: number; month: number; day: number };

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const COPY: Record<HolidayId, { name: string; line: string; color: string; motion: boolean }> = {
  "new-year": {
    name: "New Year’s Day",
    line: "Happy New Year!",
    color: "#9A7A4A",
    motion: false,
  },
  valentine: {
    name: "Valentine’s Day",
    line: "Happy Valentine’s Day!",
    color: "#9B4E5E",
    motion: true,
  },
  patrick: {
    name: "St. Patrick’s Day",
    line: "Happy St. Patrick’s Day!",
    color: "#2C6B4A",
    motion: false,
  },
  easter: {
    name: "Easter",
    line: "Happy Easter!",
    color: "#6E8B74",
    motion: false,
  },
  mothers: {
    name: "Mother’s Day",
    line: "Happy Mother’s Day!",
    color: "#8E5360",
    motion: false,
  },
  memorial: {
    name: "Memorial Day",
    line: "With gratitude this Memorial Day.",
    color: "#3E4C5E",
    motion: false,
  },
  fathers: {
    name: "Father’s Day",
    line: "Happy Father’s Day!",
    color: "#6B5344",
    motion: false,
  },
  july4: {
    name: "Independence Day",
    line: "Happy Fourth of July!",
    color: "#3E4C5E",
    motion: false,
  },
  halloween: {
    name: "Halloween",
    line: "Happy Halloween!",
    color: "#B56A32",
    motion: true,
  },
  thanksgiving: {
    name: "Thanksgiving",
    line: "Happy Thanksgiving!",
    color: "#8A5A32",
    motion: false,
  },
  christmas: {
    name: "Christmas",
    line: "Merry Christmas!",
    color: "#7A3E45",
    motion: true,
  },
};

export function isHolidayId(value: string): value is HolidayId {
  return (HOLIDAY_IDS as readonly string[]).includes(value);
}

export function skipKey(holiday: Pick<Holiday, "id" | "year">) {
  return `${holiday.id}:${holiday.year}`;
}

export function chicagoToday(date = new Date()): Ymd {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(date);
  const read = (type: string) => Number(parts.find((part) => part.type === type)?.value);
  return { year: read("year"), month: read("month"), day: read("day") };
}

function stamp(date: Ymd) {
  return date.year * 10000 + date.month * 100 + date.day;
}

function shift(date: Ymd, days: number): Ymd {
  const next = new Date(Date.UTC(date.year, date.month - 1, date.day + days));
  return { year: next.getUTCFullYear(), month: next.getUTCMonth() + 1, day: next.getUTCDate() };
}

function contains(today: Ymd, start: Ymd, end: Ymd) {
  const value = stamp(today);
  return value >= stamp(start) && value <= stamp(end);
}

function nthWeekday(year: number, month: number, weekday: number, n: number) {
  const first = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  return 1 + ((weekday - first + 7) % 7) + (n - 1) * 7;
}

function lastWeekday(year: number, month: number, weekday: number) {
  const last = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const lastDow = new Date(Date.UTC(year, month - 1, last)).getUTCDay();
  return last - ((lastDow - weekday + 7) % 7);
}

/** Anonymous Gregorian computus. Month is 1–12. */
function easterSunday(year: number): Ymd {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return { year, month, day };
}

function windowFor(id: HolidayId, year: number): { start: Ymd; end: Ymd; year: number } {
  if (id === "new-year") {
    const end = { year, month: 1, day: 1 };
    return { start: shift(end, -1), end, year };
  }
  if (id === "valentine") return { start: { year, month: 2, day: 12 }, end: { year, month: 2, day: 14 }, year };
  if (id === "patrick") return { start: { year, month: 3, day: 16 }, end: { year, month: 3, day: 17 }, year };
  if (id === "easter") {
    const end = easterSunday(year);
    return { start: shift(end, -2), end, year };
  }
  if (id === "mothers") {
    const end = { year, month: 5, day: nthWeekday(year, 5, 0, 2) };
    return { start: shift(end, -1), end, year };
  }
  if (id === "memorial") {
    const end = { year, month: 5, day: lastWeekday(year, 5, 1) };
    return { start: shift(end, -2), end, year };
  }
  if (id === "fathers") {
    const end = { year, month: 6, day: nthWeekday(year, 6, 0, 3) };
    return { start: shift(end, -1), end, year };
  }
  if (id === "july4") return { start: { year, month: 7, day: 3 }, end: { year, month: 7, day: 4 }, year };
  if (id === "halloween") return { start: { year, month: 10, day: 29 }, end: { year, month: 10, day: 31 }, year };
  if (id === "thanksgiving") {
    const end = { year, month: 11, day: nthWeekday(year, 11, 4, 4) };
    return { start: shift(end, -1), end, year };
  }
  return { start: { year, month: 12, day: 23 }, end: { year, month: 12, day: 26 }, year };
}

function formatRange(start: Ymd, end: Ymd) {
  const a = MONTHS[start.month - 1];
  const b = MONTHS[end.month - 1];
  if (start.month === end.month && start.year === end.year) return `${a} ${start.day}–${end.day}`;
  return `${a} ${start.day}–${b} ${end.day}`;
}

function toHoliday(id: HolidayId, year: number, preview: boolean): Holiday {
  const span = windowFor(id, year);
  const copy = COPY[id];
  return {
    ...copy,
    id,
    year: span.year,
    range: formatRange(span.start, span.end),
    through: `${MONTHS[span.end.month - 1]} ${span.end.day}`,
    preview,
  };
}

export function holidayById(id: HolidayId, year = chicagoToday().year, preview = false) {
  return toHoliday(id, year, preview);
}

export function holidayOn(date = new Date()): Holiday | null {
  const today = chicagoToday(date);
  for (const year of [today.year - 1, today.year, today.year + 1]) {
    for (const id of HOLIDAY_IDS) {
      const span = windowFor(id, year);
      if (contains(today, span.start, span.end)) return toHoliday(id, year, false);
    }
  }
  return null;
}

export function nextHoliday(date = new Date()): Holiday | null {
  const today = chicagoToday(date);
  const todayStamp = stamp(today);
  let best: { at: number; holiday: Holiday } | null = null;
  for (const year of [today.year, today.year + 1]) {
    for (const id of HOLIDAY_IDS) {
      const span = windowFor(id, year);
      const at = stamp(span.start);
      if (at < todayStamp) continue;
      if (!best || at < best.at) best = { at, holiday: toHoliday(id, year, false) };
    }
  }
  return best?.holiday ?? null;
}

export function visibleHoliday(mode: string, skip: string, date = new Date()): Holiday | null {
  if (mode === "off") return null;
  const current = holidayOn(date);
  if (!current) return null;
  if (skip === skipKey(current)) return null;
  return current;
}
