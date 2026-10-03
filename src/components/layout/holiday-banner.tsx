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
  if (id === "new-year") return <Clock />;
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

function Leaf({ fill, stroke }: { fill: string; stroke: string }) {
  return (
    <path
      fill={fill}
      stroke={stroke}
      strokeWidth="1.15"
      strokeLinejoin="round"
      d="M0 3C-2 0-9-4-10-11-12-18-4-20 0-15 4-20 12-18 10-11 9-4 2 0 0 3Z"
    />
  );
}

function FourLeaf({ fill, stroke }: { fill: string; stroke: string }) {
  return (
    <>
      {[0, 90, 180, 270].map((deg) => (
        <g key={deg} transform={`rotate(${deg})`}>
          <Leaf fill={fill} stroke={stroke} />
        </g>
      ))}
    </>
  );
}

function CloverField() {
  return (
    <svg className="holiday-banner-svg" viewBox="0 0 1440 80" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <pattern id="clover-tile" width="108" height="72" patternUnits="userSpaceOnUse">
          <g transform="translate(36 34) scale(0.95)" opacity="0.55">
            <FourLeaf fill="#E4C56A" stroke="#0c3328" />
          </g>
        </pattern>
      </defs>
      <rect width="1440" height="80" fill="url(#clover-tile)" />
    </svg>
  );
}

function Clock() {
  return (
    <svg className="emblem emblem-wide" viewBox="0 0 64 64" aria-hidden="true">
      <circle cx="32" cy="32" r="28" fill="#24140e" stroke="#C6A36A" strokeWidth="3.5" />
      {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
        <line
          key={deg}
          x1="32"
          y1="10"
          x2="32"
          y2={deg % 90 === 0 ? 16 : 14}
          stroke="#C6A36A"
          strokeWidth={deg % 90 === 0 ? 2.2 : 1.2}
          transform={`rotate(${deg} 32 32)`}
        />
      ))}
      <line x1="32" y1="34" x2="21" y2="16" stroke="#F4EFE4" strokeWidth="2.2" strokeLinecap="round" />
      <line x1="32" y1="34" x2="30" y2="14" stroke="#F4EFE4" strokeWidth="2.6" strokeLinecap="round" />
      <circle cx="32" cy="34" r="2.4" fill="#C6A36A" />
    </svg>
  );
}

function HeartMark() {
  return (
    <svg className="emblem" viewBox="0 0 64 58" aria-hidden="true">
      <path fill="#6E2436" stroke={CREAM} strokeWidth="3.5" d="M32 52C20 42 6 31 6 18 6 9 13 3 21 3c5 0 8 3 11 8 3-5 6-8 11-8 8 0 15 6 15 15C58 31 44 42 32 52Z" />
    </svg>
  );
}

function CloverMark() {
  return (
    <svg className="emblem" viewBox="0 0 72 90" aria-hidden="true">
      <g transform="translate(36 32) scale(1.45)">
        <FourLeaf fill="#2E8B57" stroke="#E4C56A" />
      </g>
      <path d="M36 50v28" stroke="#0F3D2E" strokeWidth="4" strokeLinecap="round" />
      <path d="M36 50v28" stroke="#3FA56C" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function Eggs() {
  return (
    <svg className="emblem emblem-eggs" viewBox="0 0 220 108" aria-hidden="true">
      <Egg x={42} fill="#FBF7F0" motif="speckle" />
      <Egg x={110} fill="#F4C7BC" motif="ribbon" />
      <Egg x={178} fill="#D5E8DA" motif="chevron" />
    </svg>
  );
}

function Egg({ x, fill, motif }: { x: number; fill: string; motif: "speckle" | "ribbon" | "chevron" }) {
  const id = `egg-${motif}`;
  return (
    <g transform={`translate(${x} 54)`}>
      <ellipse cx="1" cy="4" rx="28" ry="38" fill="rgba(36,20,14,0.12)" />
      <defs>
        <clipPath id={id}>
          <ellipse cx="0" cy="0" rx="26" ry="36" />
        </clipPath>
      </defs>
      <ellipse cx="0" cy="0" rx="26" ry="36" fill={fill} />
      <g clipPath={`url(#${id})`}>
        {motif === "speckle" ? (
          <>
            <rect x="-26" y="8" width="52" height="8" fill="#7FA184" />
            <rect x="-26" y="6" width="52" height="1.4" fill="#C6A15B" />
            {[
              [-12, -16],
              [-2, -20],
              [8, -14],
              [-8, -6],
              [4, -4],
              [12, -24],
            ].map(([cx, cy]) => (
              <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="2.1" fill="#7FA184" />
            ))}
          </>
        ) : null}
        {motif === "ribbon" ? (
          <>
            <rect x="-26" y="-8" width="52" height="16" fill="#FBF7F0" />
            <rect x="-26" y="-8" width="52" height="1.6" fill="#C6A15B" />
            <rect x="-26" y="6.4" width="52" height="1.6" fill="#C6A15B" />
            {[-14, 0, 14].map((cx) => (
              <circle key={cx} cx={cx} cy="0" r="2.4" fill="#A85A62" />
            ))}
          </>
        ) : null}
        {motif === "chevron" ? (
          <>
            <path d="M-26-6h52l-8 8h-36z" fill="#C45C5C" opacity="0.9" />
            <path d="M-26 8h52l-8 8h-36z" fill="#C6A15B" />
            <path d="M-18-22h8l-4 6zM-2-24h8l-4 6zM14-20h8l-4 6z" fill="#FBF7F0" />
          </>
        ) : null}
      </g>
      <ellipse cx="0" cy="0" rx="26" ry="36" fill="none" stroke={INK} strokeWidth="1.6" />
    </g>
  );
}

function RoseMark() {
  return (
    <svg className="emblem emblem-rose" viewBox="0 0 72 100" aria-hidden="true">
      <path d="M36 52c2 16 6 28 4 40" stroke="#245C38" strokeWidth="2.6" fill="none" strokeLinecap="round" />
      <path d="M36 64c-16 0-22 10-14 16 6-6 12-8 14-10z" fill="#2F6B45" />
      <path d="M38 76c14-2 22 6 14 14-8-4-12-8-14-12z" fill="#3E8056" />
      <path d="M34 66c-8 2-12 8-10 8M40 78c8 2 12 6 10 6" stroke="#1C432C" strokeWidth="0.8" fill="none" />
      <path d="M36 50C18 46 12 30 20 20c6 10 12 16 16 16C32 22 42 12 52 16c-2 12 2 20 8 24-10 4-16 8-24 10z" fill="#8E5360" />
      <path d="M28 34c4-12 16-16 22-8-6 4-12 12-14 18-4-2-8-6-8-10z" fill="#B06A78" />
      <path d="M34 28c8-8 18-2 16 8-8 0-14 0-18 4 0-4 0-8 2-12z" fill="#D9A3AB" />
      <path d="M36 36c5 2 9 1 11-3-1 6-6 9-11 8-3-1-4-3-4-5 1 0 3 0 4 0z" fill="#F6E4E2" />
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
    <svg className="emblem" viewBox="0 0 84 76" aria-hidden="true">
      <path d="M18 40c0-12 6-20 14-22 2 10 4 18 2 28-8 2-16 0-16-6z" fill="#C56E28" />
      <path d="M66 40c0-12-6-20-14-22-2 10-4 18-2 28 8 2 16 0 16-6z" fill="#C56E28" />
      <path d="M42 16c-14 0-24 14-24 28 0 14 10 22 24 22s24-8 24-22c0-14-10-28-24-28z" fill="#E08A3C" />
      <path d="M42 16c-5 10-7 22-6 34 0 6 2 12 6 16 4-4 6-10 6-16 1-12-1-24-6-34z" fill="#C56E28" />
      <path d="M30 22c-4 10-5 20-3 34M54 22c4 10 5 20 3 34" fill="none" stroke="#8C4A16" strokeWidth="1.4" />
      <path d="M42 16c1-10 8-16 14-12-6 2-10 8-11 14" fill="#5C3A16" />
    </svg>
  );
}

function WheatMark() {
  return (
    <svg className="emblem" viewBox="0 0 80 92" aria-hidden="true">
      <path d="M40 86V34M28 86c4-18 6-32 12-46M52 86c-4-18-6-32-12-46" stroke="#3C2418" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M40 86V34M28 86c4-18 6-32 12-46M52 86c-4-18-6-32-12-46" stroke="#E2B656" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      {[0, 1, 2, 3, 4].map((i) => (
        <g key={i}>
          <ellipse cx="30" cy={30 + i * 8} rx="7" ry="3.1" fill="#E2B656" stroke="#3C2418" strokeWidth="0.8" transform={`rotate(-40 30 ${30 + i * 8})`} />
          <ellipse cx="50" cy={30 + i * 8} rx="7" ry="3.1" fill="#E2B656" stroke="#3C2418" strokeWidth="0.8" transform={`rotate(40 50 ${30 + i * 8})`} />
        </g>
      ))}
      <path d="M30 70c4 4 16 4 20 0" fill="none" stroke="#F4EFE4" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function HollyMark() {
  return (
    <svg className="emblem" viewBox="0 0 88 78" aria-hidden="true">
      <path fill="#1F6B45" stroke="#0E3324" strokeWidth="1" d="M18 28 28 22 24 12 34 18 40 6 44 18 54 14 48 26 58 30 46 34 50 46 38 38 34 50 28 38 16 42 22 32Z" />
      <path fill="#1F6B45" stroke="#0E3324" strokeWidth="1" d="M46 24 56 16 62 22 58 12 70 16 64 26 76 28 64 34 70 44 58 36 60 48 50 38 44 46 46 34Z" />
      <path fill="#2E8B57" stroke="#0E3324" strokeWidth="1" d="M34 40 28 52 36 48 34 60 44 50 52 58 50 46 60 48 50 38 44 30Z" />
      <circle cx="36" cy="30" r="5" fill="#C0392B" stroke="#F4EFE4" strokeWidth="0.8" />
      <circle cx="52" cy="28" r="5" fill="#C0392B" stroke="#F4EFE4" strokeWidth="0.8" />
      <circle cx="44" cy="40" r="4.2" fill="#A93226" stroke="#F4EFE4" strokeWidth="0.8" />
    </svg>
  );
}
