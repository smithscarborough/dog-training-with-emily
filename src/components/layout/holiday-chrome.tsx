import { createPortal } from "react-dom";
import { HolidayMark } from "@/components/brand/holiday-mark";
import { HolidayScene } from "@/components/brand/holiday-scene";
import { HOLIDAY_IDS, holidayById, type Holiday, type HolidayId } from "@/lib/holidays";
import { cn } from "@/lib/utils";

const LABEL: Record<HolidayId, string> = {
  "new-year": "New Year",
  valentine: "Valentine’s",
  patrick: "St. Patrick’s",
  easter: "Easter",
  mothers: "Mother’s Day",
  memorial: "Memorial Day",
  fathers: "Father’s Day",
  july4: "Fourth of July",
  halloween: "Halloween",
  thanksgiving: "Thanksgiving",
  christmas: "Christmas",
};

export function HolidaySides({ holiday }: { holiday: Holiday }) {
  return (
    <div className="holiday-sides" style={{ ["--holiday" as string]: holiday.color }} aria-hidden="true">
      <span className={cn("holiday-side is-left", holiday.motion && "is-live")}>
        <HolidayScene id={holiday.id} color={holiday.color} />
      </span>
      <span className={cn("holiday-side is-right", holiday.motion && "is-live")}>
        <HolidayScene id={holiday.id} color={holiday.color} />
      </span>
    </div>
  );
}

export function HolidayRule({ holiday }: { holiday: Holiday }) {
  return (
    <div className="holiday-ornament" style={{ ["--holiday" as string]: holiday.color }}>
      <span className="holiday-lockup">
        <HolidayMark id={holiday.id} />
        {LABEL[holiday.id]}
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
