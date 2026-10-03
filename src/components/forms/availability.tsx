import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
const TIMES = ["Morning", "Afternoon", "After 4"] as const;

function pickedInOrder(order: readonly string[], selected: readonly string[]) {
  return order.filter((item) => selected.includes(item));
}

function tokens(value: string) {
  return value.split(",").map((part) => part.trim()).filter(Boolean);
}

function compose(days: readonly string[], times: readonly string[], note: string) {
  const base = [days.join(", "), times.join(", ")].filter(Boolean).join(" · ");
  const extra = note.trim();
  if (base && extra) return `${base} · ${extra}`;
  return base || extra;
}

function parseAvailability(value: string) {
  const parts = value.split(" · ").map((part) => part.trim()).filter(Boolean);
  const days = pickedInOrder(DAYS, tokens(parts[0] ?? ""));
  const daysMatch = days.length > 0 && days.join(", ") === parts[0];
  const timeSource = daysMatch ? (parts[1] ?? "") : (parts[0] ?? "");
  const times = pickedInOrder(TIMES, tokens(timeSource));
  const timesMatch = times.length > 0 && times.join(", ") === timeSource;
  if (daysMatch && timesMatch) {
    return { days, times, note: parts.slice(2).join(" · ") };
  }
  if (daysMatch) return { days, times: [], note: parts.slice(1).join(" · ") };
  if (timesMatch && !daysMatch && parts[0] === timeSource) {
    return { days: [], times, note: parts.slice(1).join(" · ") };
  }
  return { days: [], times: [], note: value.trim() };
}

export function AvailabilityFields({
  value,
  onChange,
  compact = false,
}: {
  value: string;
  onChange: (next: string) => void;
  compact?: boolean;
}) {
  const { days, times, note } = parseAvailability(value);
  const legend = compact ? "text-sm font-bold text-[#1a0e0a]" : "text-base font-bold text-[#1a0e0a]";

  function toggle(kind: "days" | "times", item: string) {
    const order = kind === "days" ? DAYS : TIMES;
    const current = kind === "days" ? days : times;
    const next = pickedInOrder(
      order,
      current.includes(item) ? current.filter((entry) => entry !== item) : [...current, item],
    );
    onChange(compose(kind === "days" ? next : days, kind === "times" ? next : times, note));
  }

  return (
    <fieldset>
      <legend className={legend}>Days that usually work</legend>
      <p className="mt-1 text-xs text-faint">Optional. For visits after the consult. Tap any that fit.</p>
      <div className="mt-4">
        <p className="text-sm font-bold text-[#1a0e0a]">Days</p>
        <div role="group" aria-label="Days that usually work" className="mt-2 flex flex-wrap gap-2">
          {DAYS.map((day) => {
            const on = days.includes(day);
            return (
              <button
                key={day}
                type="button"
                aria-pressed={on}
                onClick={() => toggle("days", day)}
                className={cn("chip-3d rounded-full px-3 py-2 text-sm", on && "is-on")}
              >
                {day}
              </button>
            );
          })}
        </div>
      </div>
      <div className="mt-4">
        <p className="text-sm font-bold text-[#1a0e0a]">Time of day</p>
        <div role="group" aria-label="Times of day that usually work" className="mt-2 flex flex-wrap gap-2">
          {TIMES.map((time) => {
            const on = times.includes(time);
            return (
              <button
                key={time}
                type="button"
                aria-pressed={on}
                onClick={() => toggle("times", time)}
                className={cn("chip-3d rounded-full px-3 py-2 text-sm", on && "is-on")}
              >
                {time}
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-xs text-faint">Morning is before noon. Afternoon is noon to 4.</p>
      </div>
      {note ? (
        <label className="mt-4 flex max-w-lg flex-col gap-2">
          <span className="text-sm font-bold text-[#1a0e0a]">Other detail</span>
          <Input value={note} onChange={(e) => onChange(compose(days, times, e.target.value))} />
          <span className="text-xs text-faint">From an earlier note. Clear it if the days above cover it.</span>
        </label>
      ) : null}
    </fieldset>
  );
}
