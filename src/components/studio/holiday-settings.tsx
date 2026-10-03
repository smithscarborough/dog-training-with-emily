import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { HOLIDAY_IDS, holidayById, holidayOn, nextHoliday, skipKey } from "@/lib/holidays";
import { invalidateHolidaySettings } from "@/lib/use-holiday";
import { updateStudioHoliday } from "@/lib/server/me";
import { cn } from "@/lib/utils";

export function HolidaySettings({
  mode,
  skip,
  onRefresh,
}: {
  mode: string;
  skip: string;
  onRefresh: () => void;
}) {
  const [currentMode, setCurrentMode] = useState<"auto" | "off">(mode === "off" ? "off" : "auto");
  const [currentSkip, setCurrentSkip] = useState(skip);
  const [busy, setBusy] = useState(false);
  const onNow = holidayOn();
  const upcoming = nextHoliday();
  const skipped = Boolean(onNow && currentSkip === skipKey(onNow));
  const showing = currentMode === "auto" && onNow && !skipped;

  function save(nextMode: "auto" | "off", nextSkip: string, done: string) {
    setBusy(true);
    void updateStudioHoliday({ data: { mode: nextMode, skip: nextSkip } })
      .then((res) => {
        const savedMode = res.holiday_mode === "off" ? "off" : "auto";
        setCurrentMode(savedMode);
        setCurrentSkip(res.holiday_skip);
        invalidateHolidaySettings();
        toast.success(done);
        onRefresh();
      })
      .catch((err: unknown) => toast.error(err instanceof Error ? err.message : "Could not save."))
      .finally(() => setBusy(false));
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Holiday touches</CardTitle>
      </CardHeader>
      <CardBody className="space-y-4">
        <p className="text-sm leading-relaxed text-muted">
          A banner at the top of the home page for a few days around each holiday.
          If you post your own banner, yours shows instead.
        </p>
        <div className="inline-flex rounded-full bg-ink p-1">
          {(
            [
              ["auto", "Automatic"],
              ["off", "Off"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              disabled={busy}
              onClick={() => {
                if (id !== currentMode) save(id, currentSkip, id === "off" ? "Holiday touches are off." : "Holiday touches are automatic.");
              }}
              className={cn(
                "h-9 rounded-full px-4 text-sm font-medium transition-colors duration-150",
                currentMode === id ? "bg-white text-ink" : "text-bg/80 hover:text-bg",
              )}
            >
              {label}
            </button>
          ))}
        </div>
        {currentMode === "off" ? (
          <p className="text-sm text-ink">The site stays the same all year.</p>
        ) : showing && onNow ? (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <p className="text-sm text-ink">
              {onNow.name} is on through {onNow.through}.
            </p>
            <Button size="sm" variant="outline" disabled={busy} onClick={() => save("auto", skipKey(onNow), "Skipped this year.")}>
              Skip this one
            </Button>
          </div>
        ) : skipped && onNow ? (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <p className="text-sm text-ink">{onNow.name} is skipped this year.</p>
            <Button size="sm" variant="outline" disabled={busy} onClick={() => save("auto", "", "It will show again.")}>
              Use it again
            </Button>
          </div>
        ) : (
          <p className="text-sm text-ink">
            {upcoming ? `Nothing is on right now. Next is ${upcoming.name}, ${upcoming.range}.` : "Nothing is on right now."}
          </p>
        )}
        <div className="border-t border-line pt-4">
          <p className="text-sm font-semibold text-ink">Look at a holiday</p>
          <p className="mt-1 text-sm leading-relaxed text-muted">
            Open the home page as that holiday. Only you see it. Visitors still see the setting above.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {HOLIDAY_IDS.map((id) => {
              const holiday = holidayById(id);
              return (
                <a
                  key={id}
                  href={`/?holiday=${id}`}
                  className="inline-flex items-center gap-2 rounded-full border border-line bg-pearl px-3 py-1.5 text-sm text-ink hover:border-ink/30"
                >
                  <span className="size-2 rounded-full" style={{ background: holiday.color }} aria-hidden="true" />
                  {holiday.name}
                </a>
              );
            })}
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
