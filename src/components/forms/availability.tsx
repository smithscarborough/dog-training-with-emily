import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { ChipToggle } from "@/components/ui/chip-toggle";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
const TIMES = ["Morning", "Afternoon", "After 4"] as const;
const FULL: Record<(typeof DAYS)[number], string> = {
  Mon: "Monday",
  Tue: "Tuesday",
  Wed: "Wednesday",
  Thu: "Thursday",
  Fri: "Friday",
  Sat: "Saturday",
  Sun: "Sunday",
};

type Day = (typeof DAYS)[number];
type Time = (typeof TIMES)[number];
type Slot = { day: Day; times: Time[] };
type Parsed =
  | { kind: "same"; days: Day[]; times: Time[]; note: string }
  | { kind: "byDay"; slots: Slot[]; note: string }
  | { kind: "note"; note: string };

function pickedInOrder<T extends string>(order: readonly T[], selected: readonly string[]): T[] {
  return order.filter((item) => selected.includes(item));
}

function tokens(value: string) {
  return value.split(",").map((part) => part.trim()).filter(Boolean);
}

function listJoin(items: string[]) {
  if (items.length <= 1) return items[0] ?? "";
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

/** "Mon, Wed · After 4" when every day shares times. "Mon · After 4; Sat · Morning" when they don't. */
function composeSame(days: readonly Day[], times: readonly Time[], note: string) {
  const base = [days.join(", "), times.join(", ")].filter(Boolean).join(" · ");
  const extra = note.trim();
  if (base && extra) return `${base} · ${extra}`;
  return base || extra;
}

function composeByDay(slots: readonly Slot[], note: string) {
  const ordered = pickedInOrder(DAYS, slots.map((slot) => slot.day)).map(
    (day) => slots.find((slot) => slot.day === day)!,
  );
  if (ordered.length === 0) return note.trim();
  if (ordered.length === 1) return composeSame([ordered[0].day], ordered[0].times, note);
  const body = ordered
    .map((slot) => (slot.times.length ? `${slot.day} · ${slot.times.join(", ")}` : slot.day))
    .join("; ");
  const extra = note.trim();
  if (!extra) return body;
  const pieces = body.split("; ");
  const last = pieces.length - 1;
  pieces[last] = pieces[last].includes(" · ") ? `${pieces[last]} · ${extra}` : `${pieces[last]} · · ${extra}`;
  return pieces.join("; ");
}

function parseClause(clause: string): { days: Day[]; times: Time[] } | null {
  const bits = clause.split(" · ").map((part) => part.trim());
  const dayPart = bits[0] ?? "";
  const timePart = bits[1] ?? "";
  if (bits.length > 2) return null;
  const days = pickedInOrder(DAYS, tokens(dayPart));
  if (days.length === 0 || days.join(", ") !== dayPart) return null;
  if (!timePart) return { days, times: [] };
  const times = pickedInOrder(TIMES, tokens(timePart));
  if (times.join(", ") !== timePart) return null;
  return { days, times };
}

function parseByDay(value: string): { slots: Slot[]; note: string } | null {
  const clauses = value.split(";").map((part) => part.trim()).filter(Boolean);
  if (clauses.length < 2) return null;
  let note = "";
  const found = new Map<Day, Time[]>();
  for (let i = 0; i < clauses.length; i++) {
    let clause = clauses[i];
    if (i === clauses.length - 1) {
      const bits = clause.split(" · ").map((part) => part.trim());
      if (bits.length >= 3) {
        note = bits.slice(2).join(" · ");
        clause = bits.slice(0, 2).join(" · ");
      }
    }
    const parsed = parseClause(clause);
    if (!parsed) return null;
    for (const day of parsed.days) found.set(day, parsed.times);
  }
  return {
    slots: DAYS.filter((day) => found.has(day)).map((day) => ({ day, times: found.get(day)! })),
    note,
  };
}

function parseAvailability(value: string): Parsed {
  const byDay = parseByDay(value);
  if (byDay) return { kind: "byDay", ...byDay };
  const parts = value.split(" · ").map((part) => part.trim()).filter(Boolean);
  const days = pickedInOrder(DAYS, tokens(parts[0] ?? ""));
  const daysMatch = days.length > 0 && days.join(", ") === parts[0];
  const timeSource = daysMatch ? (parts[1] ?? "") : (parts[0] ?? "");
  const times = pickedInOrder(TIMES, tokens(timeSource));
  const timesMatch = times.length > 0 && times.join(", ") === timeSource;
  if (daysMatch && timesMatch) return { kind: "same", days, times, note: parts.slice(2).join(" · ") };
  if (daysMatch) return { kind: "same", days, times: [], note: parts.slice(1).join(" · ") };
  if (timesMatch && !daysMatch && parts[0] === timeSource) {
    return { kind: "same", days: [], times, note: parts.slice(1).join(" · ") };
  }
  return { kind: "note", note: value.trim() };
}

function slotsOf(parsed: Parsed): Slot[] {
  if (parsed.kind === "byDay") return parsed.slots;
  if (parsed.kind === "same") return parsed.days.map((day) => ({ day, times: parsed.times }));
  return [];
}

function noteOf(parsed: Parsed) {
  return parsed.kind === "note" ? parsed.note : parsed.note;
}

function summary(slots: readonly Slot[], prompt: boolean) {
  const groups = new Map<string, Day[]>();
  for (const slot of slots) {
    const key = slot.times.join("|");
    groups.set(key, [...(groups.get(key) ?? []), slot.day]);
  }
  const ordered = [...groups.entries()].sort(
    (a, b) => DAYS.indexOf(a[1][0]) - DAYS.indexOf(b[1][0]),
  );
  return ordered
    .map(([key, days]) => {
      const names = listJoin(pickedInOrder(DAYS, days).map((day) => FULL[day]));
      const times = key ? key.split("|") : [];
      if (times.length === 0) return prompt ? `${names} still need a time.` : `${names}.`;
      return `${names} ${listJoin(times.map((time) => time.toLowerCase()))}.`;
    })
    .join(" ");
}

export function availabilityLabel(value: string) {
  const parsed = parseAvailability(value);
  if (parsed.kind === "note") return parsed.note;
  const slots = slotsOf(parsed);
  if (slots.length === 0) return "";
  return summary(slots, false);
}

export function AvailabilityFields({
  value,
  onChange,
  compact = false,
  framed = true,
}: {
  value: string;
  onChange: (next: string) => void;
  compact?: boolean;
  framed?: boolean;
}) {
  const parsed = parseAvailability(value);
  const [byDay, setByDay] = useState(() => parsed.kind === "byDay");
  const note = noteOf(parsed);
  const slots = slotsOf(parsed);
  const selected = slots.map((slot) => slot.day);

  useEffect(() => {
    if (!value.trim()) setByDay(false);
    else if (parseAvailability(value).kind === "byDay") setByDay(true);
  }, [value]);

  function writeSame(days: readonly Day[], times: readonly Time[]) {
    onChange(composeSame(pickedInOrder(DAYS, days), pickedInOrder(TIMES, times), note));
  }

  function writeByDay(next: readonly Slot[]) {
    onChange(composeByDay(next, note));
  }

  function toggleDay(day: Day) {
    if (byDay) {
      const next = selected.includes(day)
        ? slots.filter((slot) => slot.day !== day)
        : [...slots, { day, times: [] as Time[] }];
      if (next.length < 2) {
        setByDay(false);
        const only = next[0];
        writeSame(only ? [only.day] : [], only?.times ?? []);
        return;
      }
      writeByDay(next);
      return;
    }
    const days = selected.includes(day) ? selected.filter((item) => item !== day) : [...selected, day];
    const times = parsed.kind === "same" ? parsed.times : [];
    writeSame(days, times);
  }

  function toggleSharedTime(time: Time) {
    const times = parsed.kind === "same" ? parsed.times : [];
    const next = times.includes(time) ? times.filter((item) => item !== time) : [...times, time];
    writeSame(selected, next);
  }

  function toggleSlotTime(day: Day, time: Time) {
    writeByDay(
      slots.map((slot) => {
        if (slot.day !== day) return slot;
        const times = slot.times.includes(time)
          ? slot.times.filter((item) => item !== time)
          : [...slot.times, time];
        return { day, times: pickedInOrder(TIMES, times) };
      }),
    );
  }

  function useDifferentTimes() {
    if (slots.length < 2) return;
    setByDay(true);
    writeByDay(slots);
  }

  function useSameTimes() {
    const shared = TIMES.filter((time) => slots.length > 0 && slots.every((slot) => slot.times.includes(time)));
    const times = shared.length > 0 ? shared : (slots[0]?.times ?? []);
    setByDay(false);
    writeSame(selected, times);
  }

  const legend = compact ? "text-sm font-bold text-[#1a0e0a]" : "text-base font-bold text-[#1a0e0a]";
  const sharedTimes = !byDay && parsed.kind === "same" ? parsed.times : [];
  const showSummary = slots.length > 0;

  return (
    <fieldset>
      <legend className={framed ? legend : "sr-only"}>Days that usually work</legend>
      {framed ? <p className="mt-1 text-xs text-faint">Optional. For visits after the consult.</p> : null}
      <div className="mt-4">
        <p className="text-sm font-bold text-[#1a0e0a]">Days</p>
        <div
          role="group"
          aria-label="Days that usually work"
          className="mt-2 grid grid-cols-7 gap-1.5 sm:flex sm:flex-wrap sm:gap-x-2 sm:gap-y-3"
        >
          {DAYS.map((day) => (
            <ChipToggle
              key={day}
              pressed={selected.includes(day)}
              onToggle={() => toggleDay(day)}
              className="inline-flex w-full items-center justify-center px-0 text-xs sm:w-auto sm:px-3 sm:text-sm"
            >
              {day}
            </ChipToggle>
          ))}
        </div>
      </div>

      {selected.length > 1 ? (
        <div className="mt-5">
          <p className="text-sm font-bold text-[#1a0e0a]">Do the times match?</p>
          <div role="radiogroup" aria-label="Do the times match?" className="mt-2 grid gap-2 sm:grid-cols-2">
            <ChipToggle
              role="radio"
              pressed={!byDay}
              onToggle={useSameTimes}
              className="inline-flex w-full items-center justify-center px-3 text-sm"
            >
              Same every day
            </ChipToggle>
            <ChipToggle
              role="radio"
              pressed={byDay}
              onToggle={useDifferentTimes}
              className="inline-flex w-full items-center justify-center px-3 text-sm"
            >
              Different each day
            </ChipToggle>
          </div>
        </div>
      ) : null}

      {byDay && slots.length > 0 ? (
        <div className="mt-4">
          <p className="text-sm font-bold text-[#1a0e0a]">Time for each day</p>
          <p className="mt-1 text-xs text-faint">Morning is before noon. Afternoon is noon to 4.</p>
          <div className="mt-3 space-y-4">
            {slots.map((slot) => (
              <div key={slot.day} className="sm:grid sm:grid-cols-[6.5rem_1fr] sm:items-center sm:gap-3">
                <p className="text-sm font-bold text-[#1a0e0a]">{FULL[slot.day]}</p>
                <div role="group" aria-label={`${FULL[slot.day]} times`} className="mt-2 grid grid-cols-3 gap-1.5 sm:mt-0">
                  {TIMES.map((time) => (
                    <ChipToggle
                      key={time}
                      pressed={slot.times.includes(time)}
                      onToggle={() => toggleSlotTime(slot.day, time)}
                      className="inline-flex w-full items-center justify-center px-1 text-xs sm:text-sm"
                    >
                      {time}
                    </ChipToggle>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : selected.length > 0 || sharedTimes.length > 0 ? (
        <div className="mt-4">
          <p className="text-sm font-bold text-[#1a0e0a]">{selected.length > 1 ? "Time for those days" : "Time of day"}</p>
          <div role="group" aria-label="Times of day that usually work" className="mt-2 flex flex-wrap gap-x-2 gap-y-3">
            {TIMES.map((time) => (
              <ChipToggle key={time} pressed={sharedTimes.includes(time)} onToggle={() => toggleSharedTime(time)}>
                {time}
              </ChipToggle>
            ))}
          </div>
          <p className="mt-2 text-xs text-faint">
            Morning is before noon. Afternoon is noon to 4.
            {selected.length > 1 ? " Used on every day you picked." : ""}
          </p>
        </div>
      ) : (
        <p className="mt-3 text-xs text-faint">Tap the days you can do.</p>
      )}

      {showSummary && (byDay || slots.some((slot) => slot.times.length > 0)) ? (
        <p className="mt-4 text-sm leading-relaxed text-ink">{summary(slots, byDay)}</p>
      ) : null}

      {note ? (
        <label className="mt-4 flex max-w-lg flex-col gap-2">
          <span className="text-sm font-bold text-[#1a0e0a]">Other detail</span>
          <Input
            value={note}
            onChange={(e) => onChange(byDay ? composeByDay(slots, e.target.value) : composeSame(selected, sharedTimes, e.target.value))}
          />
          <span className="text-xs text-faint">From an earlier note. Clear it if the days above cover it.</span>
        </label>
      ) : null}
    </fieldset>
  );
}
