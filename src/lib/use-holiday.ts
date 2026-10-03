import { useEffect, useState } from "react";
import { getPublicStudio } from "@/lib/server/public";
import { holidayById, isHolidayId, visibleHoliday, type Holiday, type HolidayId } from "@/lib/holidays";
import { useMe } from "@/lib/use-me";

type Bits = { banner: string; mode: "auto" | "off"; skip: string };

let cache: Promise<Bits> | null = null;
const listeners = new Set<() => void>();

function loadBits() {
  cache ??= getPublicStudio()
    .then((studio) => ({
      banner: studio.banner_text ?? "",
      mode: studio.holiday_mode === "off" ? "off" as const : "auto" as const,
      skip: studio.holiday_skip ?? "",
    }))
    .catch((err: unknown) => {
      cache = null;
      throw err;
    });
  return cache;
}

export function invalidateHolidaySettings() {
  cache = null;
  listeners.forEach((listener) => listener());
}

function previewId() {
  if (typeof window === "undefined") return null;
  const value = new URLSearchParams(window.location.search).get("holiday");
  return value && isHolidayId(value) ? value : null;
}

export function useHolidayTouch(): { ready: boolean; banner: string; holiday: Holiday | null; preview: HolidayId | null } {
  const { me } = useMe();
  const [bits, setBits] = useState<Bits | null>(null);
  const [preview, setPreview] = useState<HolidayId | null>(null);
  const trainer = Boolean(me?.isTrainer);

  useEffect(() => {
    let live = true;
    const pull = () => {
      void loadBits()
        .then((next) => {
          if (live) setBits(next);
        })
        .catch(() => {
          if (live) setBits({ banner: "", mode: "auto", skip: "" });
        });
    };
    pull();
    listeners.add(pull);
    return () => {
      live = false;
      listeners.delete(pull);
    };
  }, []);

  useEffect(() => {
    const read = () => setPreview(previewId());
    read();
    window.addEventListener("popstate", read);
    return () => window.removeEventListener("popstate", read);
  }, []);

  const shown = trainer && preview ? holidayById(preview, undefined, true) : bits ? visibleHoliday(bits.mode, bits.skip) : null;
  return {
    ready: bits != null,
    banner: bits?.banner ?? "",
    holiday: shown,
    preview: trainer ? preview : null,
  };
}
