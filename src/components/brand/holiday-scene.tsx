import type { HolidayId } from "@/lib/holidays";

const INK = "#24140e";

export function HolidayScene({ id, color }: { id: HolidayId; color: string }) {
  if (id === "new-year") {
    return (
      <svg viewBox="0 0 96 96" aria-hidden="true">
        <path fill={color} d="M48 14 52.2 36.4 74 32.2 58.6 48 74 63.8 52.2 59.6 48 82 43.8 59.6 22 63.8 37.4 48 22 32.2 43.8 36.4Z" />
        <path fill={INK} d="M22 22.5 23.4 29 30 30.4 23.4 31.8 22 38.4 20.6 31.8 14 30.4 20.6 29Z" />
        <path fill={color} d="M74 18.5 75.1 23.4 80 24.5 75.1 25.6 74 30.5 72.9 25.6 68 24.5 72.9 23.4Z" />
        <circle cx="30" cy="70" r="2.2" fill={color} />
        <circle cx="68" cy="72" r="1.6" fill={INK} />
      </svg>
    );
  }
  if (id === "valentine") {
    return (
      <svg viewBox="0 0 96 96" aria-hidden="true">
        <path fill={color} d="M48 78C28 64 16 52 16 36.5 16 25 24.2 18 33.5 18 40 18 45 22 48 28 51 22 56 18 62.5 18 71.8 18 80 25 80 36.5 80 52 68 64 48 78Z" />
        <path fill={INK} d="M48 70.5C33.5 60 24.5 51 24.5 39.2 24.5 31 30.2 26 36.6 26c4.2 0 7.6 2.4 9.8 6.4h3.2c2.2-4 5.6-6.4 9.8-6.4 6.4 0 12.1 5 12.1 13.2 0 11.8-9 20.8-23.5 31.3Z" opacity="0.18" />
        <path fill="#f8f5ee" d="M36 34c2.4-3.2 5.4-4.2 7.2-2.2 1.2 1.4.6 3.4-1.4 5.2-2.6-1.2-4.8-2-5.8-3Z" opacity="0.55" />
      </svg>
    );
  }
  if (id === "patrick") {
    return (
      <svg viewBox="0 0 96 96" aria-hidden="true">
        <circle cx="48" cy="30" r="14" fill={color} />
        <circle cx="30" cy="48" r="14" fill={color} />
        <circle cx="66" cy="48" r="14" fill={color} />
        <path d="M48 46v28" stroke={INK} strokeWidth="3.2" strokeLinecap="round" />
        <path d="M48 30c-3 2-4 6-2 8M30 48c2-3 6-4 8-2M66 48c-2-3-6-4-8-2" stroke="#143C28" strokeWidth="1.4" strokeLinecap="round" fill="none" />
      </svg>
    );
  }
  if (id === "easter") {
    return (
      <svg viewBox="0 0 96 96" aria-hidden="true">
        <path fill="#f8f5ee" stroke={INK} strokeWidth="2.2" d="M48 12c14 0 24 16 24 34S62 86 48 86 24 64 24 46 34 12 48 12Z" />
        <path fill={color} d="M26.8 46h42.4c-.6 6.2-3.2 12-7.2 16.2H34c-4-4.2-6.6-10-7.2-16.2Z" />
        <circle cx="40" cy="32" r="1.7" fill={color} />
        <circle cx="48" cy="28" r="1.7" fill={color} />
        <circle cx="56" cy="32" r="1.7" fill={color} />
        <circle cx="42" cy="70" r="1.6" fill={INK} />
        <circle cx="54" cy="70" r="1.6" fill={INK} />
      </svg>
    );
  }
  if (id === "mothers") {
    return (
      <svg viewBox="0 0 96 96" aria-hidden="true">
        <path d="M48 50v30" stroke={INK} strokeWidth="2.2" strokeLinecap="round" />
        <path d="M48 62c-10 2-16 10-16 10 2-12 10-16 16-14M48 68c10 1 16 8 18 12-4-10-12-14-18-12" fill={color} />
        <ellipse cx="48" cy="28" rx="8" ry="14" fill={color} />
        <ellipse cx="48" cy="50" rx="8" ry="12" fill={color} />
        <ellipse cx="30" cy="38" rx="12" ry="8" fill={color} />
        <ellipse cx="66" cy="38" rx="12" ry="8" fill={color} />
        <circle cx="48" cy="38" r="6.5" fill={INK} />
        <circle cx="48" cy="38" r="2.4" fill="#f8f5ee" />
      </svg>
    );
  }
  if (id === "memorial") {
    return (
      <svg viewBox="0 0 96 96" aria-hidden="true">
        <path fill={color} d="m48 16 6.4 16.8H72l-14 10.6 5.2 17L48 50.2 32.8 60.4 38 43.4 24 32.8h17.6Z" />
        <path fill="#8C3E3A" d="M28 66h40l-6 8H34Z" />
        <path fill={color} d="M34 74h28v4H34Z" />
      </svg>
    );
  }
  if (id === "fathers") {
    return (
      <svg viewBox="0 0 96 96" aria-hidden="true">
        <path fill={color} stroke={INK} strokeWidth="2" strokeLinejoin="round" d="M36 16h24l4 10H32l4-10Z" />
        <path fill={color} stroke={INK} strokeWidth="2" strokeLinejoin="round" d="M32 26h32l-6 14L48 82 38 40 32 26Z" />
        <path d="M40 40h16" stroke="#f8f5ee" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
      </svg>
    );
  }
  if (id === "july4") {
    return (
      <svg viewBox="0 0 96 96" aria-hidden="true">
        <path fill={color} d="m24 18 4.2 10.6h11.2L30.6 35l3.4 10.6L24 39.2 14 45.6l3.4-10.6-8.8-6.4h11.2Z" />
        <path fill={color} d="m48 14 4.6 11.6h12.2L55.2 33l3.6 11.4L48 37.4 37.2 44.4 40.8 33 33.2 25.6h12.2Z" />
        <path fill={color} d="m72 18 4.2 10.6H87.4L79.6 35l3.4 10.6L72 39.2 62 45.6l3.4-10.6-8.8-6.4h11.2Z" />
        <path stroke="#8C3E3A" strokeWidth="3" strokeLinecap="round" d="M18 62c14-8 46-8 60 0" />
        <path stroke={color} strokeWidth="3" strokeLinecap="round" d="M22 72c12-6 40-6 52 0" />
      </svg>
    );
  }
  if (id === "halloween") {
    return (
      <svg viewBox="0 0 96 96" aria-hidden="true">
        <path fill={INK} d="M14 34c6-2 10 2 14 0 1-7 5-10 10-8-2 6 1 10 6 11-6 1-8 6-7 12-4-5-8-6-13-3-5-3-9-2-13 3 1-6-1-11-7-12 5-1 8-5 6-11-5-2-9 6-10 8 4 2 8-2 14 0Z" />
        <path fill={color} d="M48 40c14 0 24 10 24 22 0 12-10 22-24 22S24 74 24 62c0-12 10-22 24-22Z" />
        <path d="M48 42c2 8 2 28 0 40M36 48c1 8 2 24 6 32M60 48c-1 8-2 24-6 32" stroke="#8A4E22" strokeWidth="1.6" strokeLinecap="round" fill="none" />
        <path fill="#5C3A16" d="M44 34c2-8 6-12 8-8 0 4-2 8-4 10-2-1-4-1-4-2Z" />
        <path fill={INK} d="M70 22a8 8 0 1 0 0 14 6 6 0 1 1 0-14Z" />
      </svg>
    );
  }
  if (id === "thanksgiving") {
    return (
      <svg viewBox="0 0 96 96" aria-hidden="true">
        <path d="M48 82V38" stroke={INK} strokeWidth="2.2" strokeLinecap="round" />
        <path d="M34 82V46M62 82V46" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
        <ellipse cx="48" cy="30" rx="7" ry="12" fill={color} />
        <ellipse cx="34" cy="36" rx="6" ry="10" fill={color} />
        <ellipse cx="62" cy="36" rx="6" ry="10" fill={color} />
        <path stroke={INK} strokeWidth="1.3" strokeLinecap="round" d="M48 22v16M34 28v14M62 28v14" />
        <path fill="#8C3E3A" d="M30 58h36l-2 6H32Z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 96 96" aria-hidden="true">
      <path fill="#1F4D3A" d="M48 58c-2-14 6-26 16-32-8 2-16 10-18 22 8-4 14-4 20 0-10 2-16 6-18 10Z" />
      <path fill="#1F4D3A" d="M48 58c2-14-6-26-16-32 8 2 16 10 18 22-8-4-14-4-20 0 10 2 16 6 18 10Z" />
      <path fill="#1F4D3A" d="M48 60c-14 2-24 10-28 18 10-2 18-8 22-16 2 8 8 16 16 20-2-10-6-18-10-22Z" />
      <circle cx="40" cy="46" r="4.2" fill={color} />
      <circle cx="56" cy="44" r="4.2" fill={color} />
      <circle cx="48" cy="36" r="3.6" fill={color} />
    </svg>
  );
}
