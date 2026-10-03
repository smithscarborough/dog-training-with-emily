import { createPortal } from "react-dom";
import { HOLIDAY_IDS, holidayById, type HolidayId } from "@/lib/holidays";

function go(id: HolidayId | null) {
  window.location.assign(id ? `/?holiday=${id}` : "/");
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
