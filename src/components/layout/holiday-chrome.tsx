import { createPortal } from "react-dom";
import { HolidayMark } from "@/components/brand/holiday-mark";
import { HOLIDAY_IDS, holidayById, type Holiday, type HolidayId } from "@/lib/holidays";
import { cn } from "@/lib/utils";

export function HolidayRule({ holiday }: { holiday: Holiday }) {
  return (
    <div className="holiday-ornament" style={{ ["--holiday" as string]: holiday.color }} aria-hidden="true">
      <span className={cn("holiday-seal", holiday.motion && "is-live")}>
        <HolidayMark id={holiday.id} />
      </span>
    </div>
  );
}

function go(id: HolidayId | null) {
  const url = new URL(window.location.href);
  if (id) url.searchParams.set("holiday", id);
  else url.searchParams.delete("holiday");
  const next = `${url.pathname}${url.search}${url.hash}`;
  window.location.assign(next);
}

export function HolidayPreviewBar({ id }: { id: HolidayId }) {
  if (typeof document === "undefined") return null;
  const current = holidayById(id);
  return createPortal(
    <div className="holiday-preview" role="region" aria-label="Holiday preview">
      <p>Previewing {current.name}. Visitors do not see this.</p>
      <label className="sr-only" htmlFor="holiday-preview-pick">
        Holiday
      </label>
      <select id="holiday-preview-pick" value={id} onChange={(event) => go(event.target.value as HolidayId)}>
        {HOLIDAY_IDS.map((holidayId) => (
          <option key={holidayId} value={holidayId}>
            {holidayById(holidayId).name}
          </option>
        ))}
      </select>
      <button type="button" onClick={() => go(null)}>
        Done
      </button>
    </div>,
    document.body,
  );
}
