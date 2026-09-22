import { useEffect, useState } from "react";
import { DayPicker } from "react-day-picker";
import { cn } from "@/lib/utils";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function toLocalInput(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function nextSessionSlot() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(10, 0, 0, 0);
  if (d.getDay() === 0) d.setDate(d.getDate() + 1);
  if (d.getDay() === 6) d.setDate(d.getDate() + 2);
  return toLocalInput(d);
}

function parseLocal(value: string): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function labelFor(value: string) {
  const d = parseLocal(value);
  if (!d) return "Pick a date and time";
  return d.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

const MINUTES = [0, 15, 30, 45];

export function WhenPicker({
  value,
  onChange,
  enabled = true,
}: {
  value: string;
  onChange: (v: string) => void;
  enabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!enabled) setOpen(false);
  }, [enabled]);
  const selected = parseLocal(value);
  const hour24 = selected?.getHours() ?? 10;
  const minute = selected?.getMinutes() ?? 0;
  const isPm = hour24 >= 12;
  const hour12 = hour24 % 12 || 12;

  function commit(next: Date) {
    onChange(toLocalInput(next));
  }

  function ensureDate(): Date {
    return selected ?? parseLocal(nextSessionSlot())!;
  }

  function onDay(day: Date | undefined) {
    if (!day) return;
    const next = ensureDate();
    next.setFullYear(day.getFullYear(), day.getMonth(), day.getDate());
    commit(next);
  }

  function onHour(h12: number, pm: boolean) {
    const next = ensureDate();
    const h = (h12 % 12) + (pm ? 12 : 0);
    next.setHours(h, next.getMinutes(), 0, 0);
    commit(next);
  }

  function onMinute(m: number) {
    const next = ensureDate();
    next.setMinutes(m, 0, 0);
    commit(next);
  }

  return (
    <div className="relative">
      <button
        type="button"
        className="flex h-11 w-full items-center rounded-md border border-line bg-surface px-3 text-left text-base text-ink sm:text-sm"
        onClick={() => {
          if (!value) onChange(nextSessionSlot());
          setOpen((o) => !o);
        }}
      >
        {labelFor(value)}
      </button>
      {open ? (
        <>
          <button
            type="button"
            aria-label="Close calendar"
            className="fixed inset-0 z-20 cursor-default bg-transparent"
            onClick={() => setOpen(false)}
          />
          <div className="absolute z-30 mt-2 w-[min(100%,20rem)] rounded-xl border border-line bg-surface p-3 shadow-[0_12px_28px_-16px_rgba(44,24,16,0.35)]">
          <DayPicker
            mode="single"
            selected={selected ?? undefined}
            onSelect={onDay}
            disabled={{ before: new Date(new Date().setHours(0, 0, 0, 0)) }}
            classNames={{
              root: "w-full",
              months: "w-full",
              month: "w-full",
              month_caption: "flex items-center justify-center pb-2 text-sm font-semibold text-ink",
              nav: "absolute inset-x-0 top-0 flex justify-between px-1",
              button_previous: "size-8 rounded-full text-ink hover:bg-surface-2",
              button_next: "size-8 rounded-full text-ink hover:bg-surface-2",
              weekdays: "flex",
              weekday: "flex-1 py-1 text-center text-[11px] font-medium text-muted",
              week: "flex",
              day: "flex flex-1 items-center justify-center p-0.5",
              day_button: cn(
                "size-9 rounded-full text-sm text-ink transition-colors",
                "hover:bg-accent/20",
              ),
              selected: "[&_button]:bg-accent [&_button]:font-semibold [&_button]:text-ink",
              today: "[&_button]:font-bold",
              disabled: "[&_button]:text-faint [&_button]:hover:bg-transparent",
              outside: "[&_button]:text-faint",
            }}
          />
          <div className="mt-3 flex gap-2">
            <select
              className="h-10 flex-1 rounded-full border border-line bg-bg px-3 text-sm"
              value={hour12}
              onChange={(e) => onHour(Number(e.target.value), isPm)}
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
            <select
              className="h-10 flex-1 rounded-full border border-line bg-bg px-3 text-sm"
              value={minute}
              onChange={(e) => onMinute(Number(e.target.value))}
            >
              {MINUTES.map((m) => (
                <option key={m} value={m}>
                  {pad(m)}
                </option>
              ))}
            </select>
            <select
              className="h-10 flex-1 rounded-full border border-line bg-bg px-3 text-sm"
              value={isPm ? "pm" : "am"}
              onChange={(e) => onHour(hour12, e.target.value === "pm")}
            >
              <option value="am">AM</option>
              <option value="pm">PM</option>
            </select>
          </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
