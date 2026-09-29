import { useEffect, useState, type ReactNode } from "react";
import { DayPicker, type Matcher } from "react-day-picker";
import { cn } from "@/lib/utils";
import { dayIsOpen, formatClock, nextOpenSlot, slotsForDate, type HoursDay } from "@/lib/hours";

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

const dayPickerClassNames = {
  root: "w-full",
  months: "w-full",
  month: "relative w-full",
  month_caption: "pointer-events-none relative z-0 flex h-9 items-center justify-center text-sm font-semibold text-ink",
  nav: "absolute inset-x-0 top-0 z-10 flex items-center justify-between",
  button_previous:
    "inline-flex size-9 cursor-pointer items-center justify-center rounded-full border border-line bg-pearl text-ink hover:border-ink/30 hover:bg-accent-soft [&_svg]:size-4 [&_svg]:fill-current",
  button_next:
    "inline-flex size-9 cursor-pointer items-center justify-center rounded-full border border-line bg-pearl text-ink hover:border-ink/30 hover:bg-accent-soft [&_svg]:size-4 [&_svg]:fill-current",
  weekdays: "mt-2 flex",
  weekday: "flex-1 py-1 text-center text-[11px] font-medium text-muted",
  week: "flex",
  day: "flex flex-1 items-center justify-center p-0.5",
  day_button: cn(
    "size-9 cursor-pointer rounded-full text-sm text-ink transition-colors",
    "hover:bg-accent/20",
  ),
  selected: "[&_button]:bg-accent [&_button]:font-semibold [&_button]:text-ink",
  today: "[&_button]:font-bold",
  disabled: "[&_button]:text-faint [&_button]:hover:bg-transparent",
  outside: "[&_button]:text-faint",
};

function CalendarPopover({
  selected,
  onSelect,
  onClose,
  disabled,
  defaultMonth,
  children,
}: {
  selected?: Date;
  onSelect: (day: Date | undefined) => void;
  onClose: () => void;
  disabled?: Matcher | Matcher[];
  defaultMonth?: Date;
  children?: ReactNode;
}) {
  return (
    <>
      <button
        type="button"
        aria-label="Close calendar"
        className="fixed inset-0 z-20 cursor-default bg-transparent"
        onClick={onClose}
      />
      <div className="absolute z-30 mt-2 w-80 max-w-[calc(100vw-2.5rem)] rounded-xl border border-line bg-surface p-3 shadow-[0_12px_28px_-16px_rgba(44,24,16,0.35)]">
        <DayPicker
          mode="single"
          selected={selected}
          defaultMonth={defaultMonth ?? selected}
          onSelect={onSelect}
          disabled={disabled}
          classNames={dayPickerClassNames}
        />
        {children}
      </div>
    </>
  );
}

export function WhenPicker({
  value,
  onChange,
  enabled = true,
  hours,
  durationMin = 60,
  triggerClassName,
}: {
  value: string;
  onChange: (v: string) => void;
  enabled?: boolean;
  hours?: HoursDay[];
  durationMin?: number;
  triggerClassName?: string;
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
  const limited = Boolean(hours);
  const slots = selected && hours ? slotsForDate(selected, hours, durationMin) : [];
  const slotValue = `${pad(hour24)}:${pad(minute)}`;

  function commit(next: Date) {
    onChange(toLocalInput(next));
  }

  function ensureDate(): Date {
    if (selected) return selected;
    if (hours) return nextOpenSlot(hours, durationMin) ?? parseLocal(nextSessionSlot())!;
    return parseLocal(nextSessionSlot())!;
  }

  function onDay(day: Date | undefined) {
    if (!day) return;
    if (hours) {
      const slot = slotsForDate(day, hours, durationMin)[0];
      if (!slot) return;
      const [h, m] = slot.split(":").map(Number);
      const next = new Date(day);
      next.setHours(h!, m, 0, 0);
      commit(next);
      return;
    }
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

  function onSlot(hhmm: string) {
    const base = selected ?? new Date();
    const [h, m] = hhmm.split(":").map(Number);
    const next = new Date(base);
    next.setHours(h!, m, 0, 0);
    commit(next);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="relative">
      <button
        type="button"
        className={cn(
          "flex h-11 w-full items-center rounded-md border border-line bg-surface px-3 text-left text-base sm:text-sm",
          value ? "text-ink" : "text-[#a39284]",
          triggerClassName,
        )}
        onClick={() => {
          if (!value) {
            const next = hours ? nextOpenSlot(hours, durationMin) : parseLocal(nextSessionSlot());
            if (next) onChange(toLocalInput(next));
          }
          setOpen((o) => !o);
        }}
      >
        {labelFor(value)}
      </button>
      {open ? (
        <CalendarPopover
          selected={selected ?? undefined}
          onClose={() => setOpen(false)}
          onSelect={onDay}
          disabled={
            hours
              ? [{ before: today }, (date: Date) => !dayIsOpen(date, hours)]
              : { before: today }
          }
        >
          {limited ? (
            slots.length ? (
              <select
                className="mt-3 h-10 w-full rounded-full border border-line bg-bg px-3 text-sm"
                value={slots.includes(slotValue) ? slotValue : slots[0]}
                onChange={(e) => onSlot(e.target.value)}
              >
                {slots.map((slot) => (
                  <option key={slot} value={slot}>
                    {formatClock(slot)}
                  </option>
                ))}
              </select>
            ) : (
              <p className="mt-3 text-sm text-muted">No open times that day.</p>
            )
          ) : (
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
          )}
        </CalendarPopover>
      ) : null}
    </div>
  );
}

function parseDay(value: string): Date | undefined {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  const [y, m, d] = value.split("-").map(Number);
  const date = new Date(y!, m! - 1, d);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function dayValue(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function DateField({
  value,
  onChange,
  max,
  placeholder = "mm/dd/yyyy",
}: {
  value: string;
  onChange: (value: string) => void;
  max?: string;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = parseDay(value);
  const maxDate = max ? parseDay(max) : undefined;
  const label = selected
    ? selected.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : placeholder;

  return (
    <div className="relative">
      <button
        type="button"
        className="date-trigger flex h-12 w-full items-center rounded-md border border-line bg-surface px-3 text-left text-base text-ink shadow-[inset_0_1px_0_rgba(47,28,18,0.04)]"
        onClick={() => setOpen((current) => !current)}
      >
        <span className={selected ? "text-ink" : "text-[#a39284]"}>{label}</span>
      </button>
      {open ? (
        <CalendarPopover
          selected={selected}
          defaultMonth={selected ?? maxDate}
          onClose={() => setOpen(false)}
          onSelect={(day) => {
            if (!day) return;
            onChange(dayValue(day));
            setOpen(false);
          }}
          disabled={maxDate ? { after: maxDate } : undefined}
        />
      ) : null}
    </div>
  );
}
