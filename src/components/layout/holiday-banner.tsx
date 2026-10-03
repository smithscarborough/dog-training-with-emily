import type { Holiday, HolidayId } from "@/lib/holidays";

const CREAM = "#f4efe4";
const INK = "#24140e";
const RED = "#B22234";
const NAVY = "#1B365D";

const TEXT: Record<HolidayId, string> = {
  "new-year": CREAM,
  valentine: CREAM,
  patrick: CREAM,
  easter: INK,
  mothers: INK,
  memorial: NAVY,
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
      <p className="text-sm sm:text-base">{holiday.line}</p>
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
    const radius = i % 2 === 0 ? r : r * 0.38;
    return `${cx + Math.cos(angle) * radius},${cy + Math.sin(angle) * radius}`;
  }).join(" ");
}

function Star({ x, y, r, fill }: { x: number; y: number; r: number; fill: string }) {
  return <polygon points={starPoints(x, y, r)} fill={fill} />;
}

type Pt = { x: number; y: number };

function mix(a: Pt, b: Pt, t: number): Pt {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

function RibbonStripes({ a, b, c, d }: { a: Pt; b: Pt; c: Pt; d: Pt }) {
  const colors = [RED, "#fff", RED, "#fff", RED];
  return (
    <>
      {colors.map((fill, i) => {
        const t0 = i / colors.length;
        const t1 = (i + 1) / colors.length;
        const p = mix(a, b, t0);
        const q = mix(a, b, t1);
        const r = mix(d, c, t1);
        const s = mix(d, c, t0);
        return <path key={i} fill={fill} d={`M${p.x} ${p.y}L${q.x} ${q.y}L${r.x} ${r.y}L${s.x} ${s.y}Z`} />;
      })}
    </>
  );
}

function Leaf({ fill }: { fill: string }) {
  return <path fill={fill} d="M0 2C4-2 9-9 4-15 2-17 0-14 0-10 0-14-2-17-4-15-9-9-4-2 0 2Z" />;
}

function FourLeaf({ fill }: { fill: string }) {
  return (
    <g fill={fill}>
      {[0, 90, 180, 270].map((deg) => (
        <g key={deg} transform={`rotate(${deg})`}>
          <Leaf fill={fill} />
        </g>
      ))}
    </g>
  );
}

function CloverField() {
  return (
    <svg className="holiday-banner-svg" viewBox="0 0 1440 80" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <pattern id="clover-tile" width="108" height="72" patternUnits="userSpaceOnUse">
          <g transform="translate(36 34) scale(0.7)" opacity="0.38">
            <FourLeaf fill="#E4C56A" />
          </g>
        </pattern>
      </defs>
      <rect width="1440" height="80" fill="url(#clover-tile)" />
    </svg>
  );
}

function Wreath() {
  const leaves = [0, 1, 2, 3, 4, 5];
  return (
    <svg className="emblem emblem-wide" viewBox="0 0 168 40" aria-hidden="true">
      <path d="M84 30C52 30 28 18 12 6" fill="none" stroke="#D4B483" strokeWidth="1" />
      <path d="M84 30C116 30 140 18 156 6" fill="none" stroke="#D4B483" strokeWidth="1" />
      {leaves.map((i) => (
        <ellipse key={i} cx={22 + i * 10} cy={22 - i * 2.6} rx="6" ry="2.3" fill="#D4B483" transform={`rotate(${-48 + i * 7} ${22 + i * 10} ${22 - i * 2.6})`} />
      ))}
      {leaves.map((i) => (
        <ellipse key={`r${i}`} cx={146 - i * 10} cy={22 - i * 2.6} rx="6" ry="2.3" fill="#D4B483" transform={`rotate(${48 - i * 7} ${146 - i * 10} ${22 - i * 2.6})`} />
      ))}
      <path d="M76 30h16" stroke="#D4B483" strokeWidth="1" />
      <path d="M84 26l2.2 4-2.2 4-2.2-4Z" fill="#D4B483" />
    </svg>
  );
}

function HeartMark() {
  return (
    <svg className="emblem" viewBox="0 0 64 58" aria-hidden="true">
      <path fill={CREAM} d="M32 52C20 42 6 31 6 18 6 9 13 3 21 3c5 0 8 3 11 8 3-5 6-8 11-8 8 0 15 6 15 15C58 31 44 42 32 52Z" />
      <path fill="none" stroke="#E7C9C4" strokeWidth="1.2" d="M20 16c4-6 10-8 14-3" />
    </svg>
  );
}

function CloverMark() {
  return (
    <svg className="emblem" viewBox="0 0 64 78" aria-hidden="true">
      <g transform="translate(32 28) scale(1.15)">
        <FourLeaf fill="#E4C56A" />
      </g>
      <path d="M32 42c0 10 0 16 0 22" stroke="#C6A15B" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function Eggs() {
  return (
    <svg className="emblem emblem-eggs" viewBox="0 0 180 86" aria-hidden="true">
      <Egg x={36} fill="#FBF8F2" kind="scallop" />
      <Egg x={90} fill="#F6D5CB" kind="band" />
      <Egg x={144} fill="#E4F0E6" kind="wave" />
    </svg>
  );
}

function Egg({ x, fill, kind }: { x: number; fill: string; kind: "scallop" | "band" | "wave" }) {
  const id = `egg-${kind}`;
  return (
    <g transform={`translate(${x} 44)`}>
      <ellipse cx="0" cy="3" rx="24" ry="32" fill="rgba(36,20,14,0.1)" />
      <defs>
        <clipPath id={id}>
          <ellipse cx="0" cy="0" rx="22" ry="30" />
        </clipPath>
      </defs>
      <ellipse cx="0" cy="0" rx="22" ry="30" fill={fill} stroke={INK} strokeWidth="1" />
      <g clipPath={`url(#${id})`}>
        {kind === "band" ? (
          <>
            <rect x="-22" y="-3" width="44" height="7" fill="#C6A15B" />
            <rect x="-22" y="-6" width="44" height="1.2" fill="#8E5360" />
            <rect x="-22" y="5" width="44" height="1.2" fill="#8E5360" />
          </>
        ) : null}
        {kind === "scallop" ? (
          <>
            <circle cx="-14" cy="16" r="7" fill="#7FA184" />
            <circle cx="0" cy="18" r="7" fill="#7FA184" />
            <circle cx="14" cy="16" r="7" fill="#7FA184" />
            <circle cx="-7" cy="8" r="2" fill="#7FA184" />
            <circle cx="7" cy="6" r="2" fill="#7FA184" />
          </>
        ) : null}
        {kind === "wave" ? <path d="M-22 0c6-6 10-6 16 0s10 6 16 0 10-6 16 0v5c-6 6-10 6-16 0s-10-6-16 0-10 6-16 0Z" fill="#C45C5C" opacity="0.85" /> : null}
      </g>
    </g>
  );
}

function RoseMark() {
  return (
    <svg className="emblem" viewBox="0 0 64 84" aria-hidden="true">
      <path d="M32 46c1 14 8 22 14 28" fill="none" stroke="#6B5344" strokeWidth="1.6" strokeLinecap="round" />
      <ellipse cx="44" cy="62" rx="9" ry="3.5" fill="#5E7A64" transform="rotate(28 44 62)" />
      <ellipse cx="24" cy="58" rx="8" ry="3" fill="#6B8F72" transform="rotate(-36 24 58)" />
      {[0, 72, 144, 216, 288].map((deg) => (
        <ellipse key={deg} cx="32" cy="22" rx="6" ry="11" fill="#8E5360" transform={`rotate(${deg} 32 30)`} />
      ))}
      {[36, 108, 180, 252, 324].map((deg) => (
        <ellipse key={deg} cx="32" cy="26" rx="4" ry="7" fill="#C48B96" transform={`rotate(${deg} 32 30)`} />
      ))}
      <circle cx="32" cy="30" r="3.2" fill="#F6EBE8" />
    </svg>
  );
}

function Ribbon() {
  const leftA = { x: 58, y: 48 };
  const leftB = { x: 76, y: 60 };
  const leftC = { x: 34, y: 124 };
  const leftD = { x: 16, y: 112 };
  const rightA = { x: 84, y: 60 };
  const rightB = { x: 102, y: 48 };
  const rightC = { x: 144, y: 112 };
  const rightD = { x: 126, y: 124 };
  return (
    <svg className="emblem emblem-ribbon" viewBox="0 0 160 132" aria-hidden="true">
      <RibbonStripes a={leftA} b={leftB} c={leftC} d={leftD} />
      <RibbonStripes a={rightA} b={rightB} c={rightC} d={rightD} />
      <path d="M80 62C56 54 40 36 46 18 50 6 68 4 80 18 92 4 110 6 114 18 120 36 104 54 80 62Z" fill="none" stroke={RED} strokeWidth="16" strokeLinejoin="round" />
      <path d="M80 58C60 52 48 36 52 22 55 12 70 12 80 22 90 12 105 12 108 22 112 36 100 52 80 58Z" fill="none" stroke="#fff" strokeWidth="4" />
      <path d="M72 16c5 4 11 4 16 0" fill="none" stroke="#7A1422" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M22 118 40 128 112 56 96 44Z" fill="#0E2244" />
      <path d="M26 114 42 124 108 56 94 46Z" fill={NAVY} />
      <Star x={44} y={108} r={3.4} fill="#fff" />
      <Star x={58} y={96} r={3.4} fill="#fff" />
      <Star x={72} y={84} r={3.4} fill="#fff" />
      <Star x={86} y={72} r={3.4} fill="#fff" />
      <Star x={52} y={96} r={2.5} fill="#fff" />
      <Star x={66} y={84} r={2.5} fill="#fff" />
      <Star x={80} y={72} r={2.5} fill="#fff" />
    </svg>
  );
}

function TieMark() {
  return (
    <svg className="emblem emblem-tie" viewBox="0 0 48 96" aria-hidden="true">
      <path fill={NAVY} d="M15 2h18l5 14H10L15 2Zm-5 14h28L30 40 24 94 18 40 10 16Z" />
      <path d="M18 22h12" stroke="#D4B483" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M21 36l3 8 3-8" fill="none" stroke="#152238" strokeWidth="1" opacity="0.45" />
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
        <rect key={i} x="0" y={i * stripe} width="190" height={stripe + 0.25} fill={i % 2 === 0 ? RED : "#fff"} />
      ))}
      <rect width={cantonW} height={cantonH} fill={NAVY} />
      {stars.map((spot) => (
        <Star key={spot.key} x={spot.x} y={spot.y} r={2.05} fill="#fff" />
      ))}
      <rect x="0.6" y="0.6" width="188.8" height="98.8" fill="none" stroke="rgba(20,16,12,0.28)" strokeWidth="1.2" />
    </svg>
  );
}

function PumpkinMark() {
  return (
    <svg className="emblem" viewBox="0 0 76 70" aria-hidden="true">
      <path d="M38 16c-16 0-26 14-26 28 0 14 11 22 26 22s26-8 26-22c0-14-10-28-26-28Z" fill="#E08A3C" />
      <path d="M38 16c-6 8-8 20-8 28 0 10 3 18 8 22 5-4 8-12 8-22 0-8-2-20-8-28Z" fill="#C56E28" opacity="0.55" />
      <path d="M28 20c-6 8-8 18-6 32M48 20c6 8 8 18 6 32" fill="none" stroke="#A85A22" strokeWidth="1.3" opacity="0.7" />
      <path d="M38 16c2-8 8-12 12-8-4 1-8 5-9 10" fill="#5C3A16" />
    </svg>
  );
}

function WheatMark() {
  return (
    <svg className="emblem" viewBox="0 0 72 78" aria-hidden="true">
      <path d="M36 74V28" stroke="#F4EFE4" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M30 74c2-16 2-28 6-42M42 74c-2-16-2-28-6-42" stroke="#E7C27A" strokeWidth="1.2" fill="none" />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <ellipse key={i} cx={i % 2 ? 28 : 44} cy={24 + i * 7} rx="6" ry="2.5" fill="#F4EFE4" transform={`rotate(${i % 2 ? -35 : 35} ${i % 2 ? 28 : 44} ${24 + i * 7})`} />
      ))}
      <path d="M28 62h16" stroke="#C6A15B" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function HollyMark() {
  return (
    <svg className="emblem" viewBox="0 0 80 70" aria-hidden="true">
      <path fill="#7EAF8C" d="M40 42C28 28 18 22 10 24c8 8 16 14 22 22-8 2-14 8-16 16 10-2 16-8 18-14 2 8 8 14 16 16-2-10-8-16-14-18 8-2 16-8 24-16-10 0-18 4-24 12Z" />
      <path d="M22 30c6 4 10 8 12 14M58 30c-6 4-10 8-12 14M40 36v16" fill="none" stroke="#14352A" strokeWidth="0.8" opacity="0.45" />
      <circle cx="30" cy="26" r="4" fill="#C45C5C" />
      <circle cx="50" cy="26" r="4" fill="#C45C5C" />
      <circle cx="40" cy="18" r="3.4" fill="#A63E42" />
    </svg>
  );
}
