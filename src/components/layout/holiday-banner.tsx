import type { Holiday, HolidayId } from "@/lib/holidays";

const CREAM = "#f4efe4";
const INK = "#24140e";

const TEXT: Record<HolidayId, string> = {
  "new-year": CREAM,
  valentine: CREAM,
  patrick: "#F3F7F2",
  easter: INK,
  mothers: INK,
  memorial: "#1B365D",
  fathers: CREAM,
  july4: CREAM,
  halloween: CREAM,
  thanksgiving: CREAM,
  christmas: CREAM,
};

export function HolidayBanner({ holiday }: { holiday: Holiday }) {
  return (
    <aside className={`holiday-banner is-${holiday.id}`} style={{ color: TEXT[holiday.id] }} aria-label={holiday.name}>
      {holiday.id === "july4" ? <JulyStars /> : null}
      <p className="relative z-[1] mx-auto flex max-w-3xl items-center justify-center gap-2.5 px-6 py-2.5 text-center text-sm leading-none sm:gap-3 sm:py-3 sm:text-base">
        <Insignia id={holiday.id} />
        <span>{holiday.line}</span>
      </p>
    </aside>
  );
}

function Insignia({ id }: { id: HolidayId }) {
  return (
    <svg className="holiday-insignia" viewBox="0 0 64 64" aria-hidden="true">
      {id === "new-year" ? <NewYearStar /> : null}
      {id === "valentine" ? <Heart /> : null}
      {id === "patrick" ? <Shamrock /> : null}
      {id === "easter" ? <Egg /> : null}
      {id === "mothers" ? <Rose /> : null}
      {id === "memorial" ? <Ribbon /> : null}
      {id === "fathers" ? <Tie /> : null}
      {id === "july4" ? <PointStar fill="#F4EFE4" /> : null}
      {id === "halloween" ? <Pumpkin /> : null}
      {id === "thanksgiving" ? <Wheat /> : null}
      {id === "christmas" ? <Holly /> : null}
    </svg>
  );
}

function NewYearStar() {
  return (
    <polygon
      fill="#D4B483"
      points="32,4 36.5,22 54,14 42,30 60,32 42,34 54,50 36.5,42 32,60 27.5,42 10,50 22,34 4,32 22,30 10,14 27.5,22"
    />
  );
}

function PointStar({ fill, x = 32, y = 32, r = 22 }: { fill: string; x?: number; y?: number; r?: number }) {
  const points = Array.from({ length: 10 }, (_, i) => {
    const angle = (Math.PI / 5) * i - Math.PI / 2;
    const radius = i % 2 === 0 ? r : r * 0.4;
    return `${x + Math.cos(angle) * radius},${y + Math.sin(angle) * radius}`;
  }).join(" ");
  return <polygon points={points} fill={fill} />;
}

function Heart() {
  return <path fill="#F4EFE4" d="M32 54C24 46 8 36 8 22 8 14 14 8 22 8c5 0 8 3 10 7 2-4 5-7 10-7 8 0 14 6 14 14C56 36 40 46 32 54Z" />;
}

function Shamrock() {
  return (
    <>
      <path
        fill="#E4C56A"
        d="M32 28c0-10-8-16-8-10s8 6 8 10c0-10 8-16 8-10s-8 6-8 10c-10-2-16 6-10 12s10 2 10-4c0 6 4 10 10 4s0-14-10-12Z"
      />
      <path d="M32 36v16" stroke="#E4C56A" strokeWidth="3" strokeLinecap="round" />
    </>
  );
}

function Egg() {
  return (
    <>
      <ellipse cx="32" cy="34" rx="16" ry="22" fill="#F7FBF6" stroke={INK} strokeWidth="1.6" />
      <path d="M17 34h30c-.4 5-3 9-7 12H24c-4-3-6.6-7-7-12Z" fill="#7FA184" />
      <circle cx="26" cy="22" r="1.7" fill="#7FA184" />
      <circle cx="32" cy="19" r="1.7" fill="#7FA184" />
      <circle cx="38" cy="22" r="1.7" fill="#7FA184" />
    </>
  );
}

function Rose() {
  return (
    <>
      <path d="M32 36c2 10 8 16 14 18" fill="none" stroke="#6B5344" strokeWidth="2" strokeLinecap="round" />
      <ellipse cx="40" cy="46" rx="7" ry="3.2" fill="#6B8F72" transform="rotate(28 40 46)" />
      <circle cx="32" cy="24" r="7" fill="#8E5360" />
      <circle cx="24" cy="28" r="6.5" fill="#A86B76" />
      <circle cx="40" cy="28" r="6.5" fill="#A86B76" />
      <circle cx="32" cy="32" r="6" fill="#C48B96" />
      <circle cx="32" cy="27" r="3" fill="#F6EBE8" />
    </>
  );
}

function Ribbon() {
  return (
    <>
      <path d="M26 34C18 44 14 52 12 60" stroke="#A61D2E" strokeWidth="11" fill="none" strokeLinecap="round" />
      <path d="M26 34C18 44 14 52 12 60" stroke="#fff" strokeWidth="4.5" fill="none" strokeLinecap="round" />
      <path d="M26 34C18 44 14 52 12 60" stroke="#A61D2E" strokeWidth="1.7" fill="none" strokeLinecap="round" />
      <path d="M38 34C46 44 52 52 56 60" stroke="#A61D2E" strokeWidth="11" fill="none" strokeLinecap="round" />
      <path d="M38 34C46 44 52 52 56 60" stroke="#fff" strokeWidth="4.5" fill="none" strokeLinecap="round" />
      <path d="M38 34C46 44 52 52 56 60" stroke="#A61D2E" strokeWidth="1.7" fill="none" strokeLinecap="round" />
      <path d="M32 36C20 32 14 24 17 14 19 6 28 6 32 14 36 6 45 6 47 14 50 24 44 32 32 36Z" fill="none" stroke="#A61D2E" strokeWidth="8" strokeLinejoin="round" />
      <path d="M32 34C22 31 18 24 20 16 22 10 28 11 32 16 36 11 42 10 44 16 46 24 42 31 32 34Z" fill="none" stroke="#fff" strokeWidth="2.6" />
      <path d="M30 12c2 2 3 2 5 0" stroke="#7E1524" strokeWidth="2" strokeLinecap="round" />
      <path d="M16 56 48 32" stroke="#1B365D" strokeWidth="11" strokeLinecap="butt" />
      <PointStar fill="#fff" x={24} y={50} r={2.6} />
      <PointStar fill="#fff" x={32} y={44} r={2.6} />
      <PointStar fill="#fff" x={40} y={38} r={2.6} />
      <PointStar fill="#fff" x={27} y={43} r={2} />
      <PointStar fill="#fff" x={36} y={36} r={2} />
    </>
  );
}

function Tie() {
  return <path fill="#1B365D" d="M26 8h12l3 8H23l3-8Zm-3 8h18l-4 12L32 58 27 28l-4-12Z" />;
}

function Pumpkin() {
  return (
    <>
      <ellipse cx="32" cy="36" rx="18" ry="14" fill="#E08A3C" />
      <ellipse cx="22" cy="37" rx="8" ry="13" fill="#C56E28" />
      <ellipse cx="42" cy="37" rx="8" ry="13" fill="#C56E28" />
      <path d="M30 22c4-8 10-10 12-6-4 1-8 6-8 10" fill="#5C3A16" />
    </>
  );
}

function Wheat() {
  return (
    <>
      <path d="M32 58V16M24 58V24M40 58V24" stroke="#F4EFE4" strokeWidth="1.6" strokeLinecap="round" />
      {[0, 1, 2, 3].map((i) => (
        <ellipse key={i} cx={i % 2 ? 27 : 37} cy={20 + i * 8} rx="4" ry="2.2" fill="#F4EFE4" transform={`rotate(${i % 2 ? -30 : 30} ${i % 2 ? 27 : 37} ${20 + i * 8})`} />
      ))}
    </>
  );
}

function Holly() {
  return (
    <>
      <path fill="#8FBF9A" d="M32 40c-2-12 6-22 16-26-8 2-14 10-16 20 6-4 12-4 16 0-8 1-14 4-16 6Z" />
      <path fill="#8FBF9A" d="M32 40c2-12-6-22-16-26 8 2 14 10 16 20-6-4-12-4-16 0 8 1 14 4 16 6Z" />
      <path fill="#7EAF8C" d="M32 42c-10 1-16 8-18 14 8-2 14-6 16-12 1 6 6 12 12 15-1-8-4-14-10-17Z" />
      <circle cx="26" cy="30" r="3.2" fill="#C45C5C" />
      <circle cx="38" cy="28" r="3.2" fill="#C45C5C" />
      <circle cx="32" cy="22" r="2.6" fill="#C45C5C" />
    </>
  );
}

function JulyStars() {
  const spots = [48, 96, 144, 192, 1296, 1344, 1392];
  return (
    <svg className="holiday-banner-svg" viewBox="0 0 1440 48" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      {spots.map((x) => (
        <PointStar key={x} fill="#F4EFE4" x={x} y={24} r={5} />
      ))}
    </svg>
  );
}
