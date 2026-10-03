import type { Holiday, HolidayId } from "@/lib/holidays";

const CREAM = "#f4efe4";
const INK = "#24140e";

const TEXT: Record<HolidayId, string> = {
  "new-year": CREAM,
  valentine: CREAM,
  patrick: "#F4EFE4",
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
      {holiday.id === "patrick" ? <CloverField /> : null}
      <p className="relative z-[1] mx-auto max-w-3xl px-6 py-2.5 text-center text-sm leading-snug sm:py-3 sm:text-base">{holiday.line}</p>
      <div className={`holiday-emblem is-${holiday.id}`}>
        <Emblem id={holiday.id} />
      </div>
    </aside>
  );
}

function Emblem({ id }: { id: HolidayId }) {
  if (id === "new-year") return <Wreath />;
  if (id === "valentine") return <HeartMark />;
  if (id === "patrick") return <CloverMark />;
  if (id === "easter") return <Eggs />;
  if (id === "mothers") return <RoseMark />;
  if (id === "memorial") return <Ribbon />;
  if (id === "fathers") return <TieMark />;
  if (id === "july4") return <Flag />;
  if (id === "halloween") return <PumpkinMark />;
  if (id === "thanksgiving") return <WheatMark />;
  return <HollyMark />;
}

function starPoints(cx: number, cy: number, r: number) {
  return Array.from({ length: 10 }, (_, i) => {
    const angle = (Math.PI / 5) * i - Math.PI / 2;
    const radius = i % 2 === 0 ? r : r * 0.4;
    return `${cx + Math.cos(angle) * radius},${cy + Math.sin(angle) * radius}`;
  }).join(" ");
}

function Star({ x, y, r, fill }: { x: number; y: number; r: number; fill: string }) {
  return <polygon points={starPoints(x, y, r)} fill={fill} />;
}

function FourLeaf({ fill }: { fill: string }) {
  return (
    <g fill={fill}>
      {[0, 90, 180, 270].map((deg) => (
        <ellipse key={deg} cx="0" cy="-9" rx="5.2" ry="8" transform={`rotate(${deg})`} />
      ))}
    </g>
  );
}

function CloverField() {
  return (
    <svg className="holiday-banner-svg" viewBox="0 0 1440 56" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <pattern id="clover-tile" width="92" height="48" patternUnits="userSpaceOnUse">
          <g transform="translate(28 26) scale(0.62)" opacity="0.42">
            <FourLeaf fill="#E4C56A" />
          </g>
        </pattern>
      </defs>
      <rect width="1440" height="56" fill="url(#clover-tile)" />
    </svg>
  );
}

function Wreath() {
  return (
    <svg className="emblem emblem-wide" viewBox="0 0 140 36" aria-hidden="true">
      <path d="M70 26C46 26 28 16 16 6" fill="none" stroke="#D4B483" strokeWidth="1.2" />
      <path d="M70 26C94 26 112 16 124 6" fill="none" stroke="#D4B483" strokeWidth="1.2" />
      {[18, 32, 46, 58].map((x, i) => (
        <ellipse key={x} cx={x} cy={20 - i * 3.5} rx="5" ry="2.2" fill="#D4B483" transform={`rotate(${-40 + i * 8} ${x} ${20 - i * 3.5})`} />
      ))}
      {[122, 108, 94, 82].map((x, i) => (
        <ellipse key={x} cx={x} cy={20 - i * 3.5} rx="5" ry="2.2" fill="#D4B483" transform={`rotate(${40 - i * 8} ${x} ${20 - i * 3.5})`} />
      ))}
      <path d="M64 26h12" stroke="#D4B483" strokeWidth="1.2" />
      <path d="M70 22l2 4-2 4-2-4Z" fill="#D4B483" />
    </svg>
  );
}

function HeartMark() {
  return (
    <svg className="emblem emblem-sm" viewBox="0 0 64 58" aria-hidden="true">
      <path fill="#F4EFE4" d="M32 52C22 43 6 32 6 18 6 10 12 4 20 4c5 0 8 3 12 8 4-5 7-8 12-8 8 0 14 6 14 14C58 32 42 43 32 52Z" />
      <path fill="#E7C9C4" d="M22 16c2-4 6-6 9-4" stroke="none" />
    </svg>
  );
}

function CloverMark() {
  return (
    <svg className="emblem emblem-sm" viewBox="0 0 64 72" aria-hidden="true">
      <g transform="translate(32 30)">
        <FourLeaf fill="#E4C56A" />
      </g>
      <path d="M32 40v18" stroke="#E4C56A" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

function Eggs() {
  return (
    <svg className="emblem emblem-eggs" viewBox="0 0 168 78" aria-hidden="true">
      <Egg x={34} fill="#F7F3EA" band="#7FA184" dots />
      <Egg x={84} fill="#F4D7CC" stripe="#A85A62" />
      <Egg x={134} fill="#E7F0E4" band="#C6A15B" />
    </svg>
  );
}

function Egg({ x, fill, band, stripe, dots }: { x: number; fill: string; band?: string; stripe?: string; dots?: boolean }) {
  const id = `egg-${x}`;
  return (
    <g transform={`translate(${x} 40)`}>
      <defs>
        <clipPath id={id}>
          <ellipse cx="0" cy="0" rx="22" ry="30" />
        </clipPath>
      </defs>
      <ellipse cx="0" cy="2" rx="24" ry="32" fill="rgba(36,20,14,0.08)" />
      <ellipse cx="0" cy="0" rx="22" ry="30" fill={fill} stroke={INK} strokeWidth="1.4" />
      <g clipPath={`url(#${id})`}>
        {band ? <rect x="-22" y="-2" width="44" height="8" fill={band} /> : null}
        {stripe ? (
          <>
            <rect x="-8" y="-30" width="3.5" height="60" fill={stripe} />
            <rect x="3" y="-30" width="3.5" height="60" fill={stripe} />
          </>
        ) : null}
        {dots ? (
          <>
            <circle cx="-8" cy="-14" r="2" fill="#7FA184" />
            <circle cx="1" cy="-16" r="2" fill="#7FA184" />
            <circle cx="8" cy="-12" r="2" fill="#7FA184" />
          </>
        ) : null}
      </g>
    </g>
  );
}

function RoseMark() {
  return (
    <svg className="emblem emblem-sm" viewBox="0 0 64 78" aria-hidden="true">
      <path d="M32 40c2 12 10 20 16 24" fill="none" stroke="#6B5344" strokeWidth="2" strokeLinecap="round" />
      <ellipse cx="42" cy="54" rx="8" ry="3.4" fill="#6B8F72" transform="rotate(30 42 54)" />
      <circle cx="32" cy="26" r="8" fill="#8E5360" />
      <circle cx="23" cy="31" r="7" fill="#A86B76" />
      <circle cx="41" cy="31" r="7" fill="#A86B76" />
      <circle cx="32" cy="35" r="6.5" fill="#C48B96" />
      <circle cx="32" cy="29" r="3.2" fill="#F6EBE8" />
    </svg>
  );
}

function Ribbon() {
  return (
    <svg className="emblem emblem-ribbon" viewBox="0 0 120 150" aria-hidden="true">
      <path d="M46 62C32 86 20 112 12 142" stroke="#8E1A28" strokeWidth="18" fill="none" strokeLinecap="butt" />
      <path d="M46 62C32 86 20 112 12 142" stroke="#B22234" strokeWidth="16" fill="none" />
      <path d="M46 62C32 86 20 112 12 142" stroke="#fff" strokeWidth="6" fill="none" />
      <path d="M46 62C32 86 20 112 12 142" stroke="#B22234" strokeWidth="2" fill="none" />
      <path d="M74 62C88 86 102 110 112 140" stroke="#8E1A28" strokeWidth="18" fill="none" strokeLinecap="butt" />
      <path d="M74 62C88 86 102 110 112 140" stroke="#B22234" strokeWidth="16" fill="none" />
      <path d="M74 62C88 86 102 110 112 140" stroke="#fff" strokeWidth="6" fill="none" />
      <path d="M74 62C88 86 102 110 112 140" stroke="#B22234" strokeWidth="2" fill="none" />
      <path d="M60 66C36 58 22 40 28 20 32 6 50 4 60 20 70 4 88 6 92 20 98 40 84 58 60 66Z" fill="none" stroke="#8E1A28" strokeWidth="16" />
      <path d="M60 64C40 56 28 40 33 22 36 12 50 11 60 22 70 11 84 12 87 22 92 40 80 56 60 64Z" fill="none" stroke="#B22234" strokeWidth="12" />
      <path d="M60 60C44 54 36 40 40 26 42 18 52 18 60 26 68 18 78 18 80 26 84 40 76 54 60 60Z" fill="none" stroke="#fff" strokeWidth="3.4" />
      <path d="M54 18c4 3 8 3 12 0" stroke="#7A1422" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M22 128 96 58" stroke="#0E2244" strokeWidth="22" strokeLinecap="butt" />
      <path d="M22 128 96 58" stroke="#1B365D" strokeWidth="18" strokeLinecap="butt" />
      <Star x={36} y={112} r={3.3} fill="#fff" />
      <Star x={50} y={100} r={3.3} fill="#fff" />
      <Star x={64} y={88} r={3.3} fill="#fff" />
      <Star x={78} y={76} r={3.3} fill="#fff" />
      <Star x={42} y={100} r={2.5} fill="#fff" />
      <Star x={56} y={88} r={2.5} fill="#fff" />
      <Star x={70} y={76} r={2.5} fill="#fff" />
      <Star x={84} y={64} r={2.5} fill="#fff" />
    </svg>
  );
}

function TieMark() {
  return (
    <svg className="emblem emblem-tie" viewBox="0 0 48 86" aria-hidden="true">
      <path fill="#1B365D" d="M16 4h16l4 12H12L16 4Zm-4 12h24l-6 16L24 82 18 32 12 16Z" />
      <path d="M20 34h8" stroke="#D4B483" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function Flag() {
  const stripe = 100 / 13;
  const cantonW = 76;
  const cantonH = stripe * 7;
  const stars = [];
  for (let row = 0; row < 9; row += 1) {
    const count = row % 2 === 0 ? 6 : 5;
    const y = ((row + 1) * cantonH) / 10;
    for (let col = 0; col < count; col += 1) {
      const x = count === 6 ? ((col + 0.5) * cantonW) / 6 : ((col + 1) * cantonW) / 6;
      stars.push({ x, y, key: `${row}-${col}` });
    }
  }
  return (
    <svg className="emblem emblem-flag" viewBox="0 0 190 100" aria-hidden="true">
      {Array.from({ length: 13 }, (_, i) => (
        <rect key={i} x="0" y={i * stripe} width="190" height={stripe + 0.2} fill={i % 2 === 0 ? "#B22234" : "#fff"} />
      ))}
      <rect width={cantonW} height={cantonH} fill="#1B365D" />
      {stars.map((spot) => (
        <Star key={spot.key} x={spot.x} y={spot.y} r={2.15} fill="#fff" />
      ))}
    </svg>
  );
}

function PumpkinMark() {
  return (
    <svg className="emblem emblem-sm" viewBox="0 0 72 64" aria-hidden="true">
      <ellipse cx="36" cy="38" rx="22" ry="16" fill="#E08A3C" />
      <ellipse cx="24" cy="39" rx="10" ry="15" fill="#C56E28" />
      <ellipse cx="48" cy="39" rx="10" ry="15" fill="#C56E28" />
      <path d="M34 20c3-8 10-12 14-8-5 2-9 7-9 12" fill="#5C3A16" />
      <path d="M36 24v28" stroke="#A85A22" strokeWidth="1.2" opacity="0.7" />
    </svg>
  );
}

function WheatMark() {
  return (
    <svg className="emblem emblem-sm" viewBox="0 0 72 70" aria-hidden="true">
      <path d="M36 64V18M26 64V28M46 64V28" stroke="#F4EFE4" strokeWidth="1.6" strokeLinecap="round" />
      {[0, 1, 2, 3, 4].map((i) => (
        <ellipse key={i} cx={i % 2 ? 30 : 42} cy={22 + i * 7} rx="5" ry="2.4" fill="#E7C27A" transform={`rotate(${i % 2 ? -32 : 32} ${i % 2 ? 30 : 42} ${22 + i * 7})`} />
      ))}
    </svg>
  );
}

function HollyMark() {
  return (
    <svg className="emblem emblem-sm" viewBox="0 0 72 64" aria-hidden="true">
      <path fill="#8FBF9A" d="M36 40c-2-14 8-26 18-30-10 2-16 12-18 24 8-4 14-4 18 0-10 2-16 5-18 6Z" />
      <path fill="#8FBF9A" d="M36 40c2-14-8-26-18-30 10 2 16 12 18 24-8-4-14-4-18 0 10 2 16 5 18 6Z" />
      <path fill="#7EAF8C" d="M36 42c-12 2-20 10-22 18 10-2 16-8 18-16 2 8 8 16 16 18-2-10-6-16-12-20Z" />
      <circle cx="28" cy="28" r="3.4" fill="#C45C5C" />
      <circle cx="44" cy="26" r="3.4" fill="#C45C5C" />
      <circle cx="36" cy="18" r="2.8" fill="#C45C5C" />
    </svg>
  );
}
