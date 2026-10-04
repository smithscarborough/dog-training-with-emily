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
      <p className="text-sm sm:text-base">{holiday.id === "thanksgiving" ? <ThanksLine /> : holiday.line}</p>
      <div className={`holiday-emblem is-${holiday.id}`}>
        <Emblem id={holiday.id} />
      </div>
    </aside>
  );
}

function ThanksLine() {
  return (
    <>
      We're thankful for <span className="holiday-you">you</span>! Happy Thanksgiving to you and yours.
    </>
  );
}

function Emblem({ id }: { id: HolidayId }) {
  if (id === "new-year") return <Firework />;
  if (id === "valentine") return <HeartMark />;
  if (id === "patrick") return <CloverMark />;
  if (id === "easter") return <Eggs />;
  if (id === "mothers") return <RoseMark />;
  if (id === "memorial") return <Ribbon />;
  if (id === "fathers") return <TieMark />;
  if (id === "july4") return <Flag />;
  if (id === "halloween") return <PumpkinMark />;
  if (id === "thanksgiving") return <TurkeyMark />;
  return <TreeMark />;
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

function Firework() {
  const rays = Array.from({ length: 18 }, (_, i) => {
    const angle = (Math.PI / 9) * i - Math.PI / 2;
    const kind = i % 3;
    const length = kind === 0 ? 30 : kind === 1 ? 20 : 13;
    return {
      x2: 40 + Math.cos(angle) * length,
      y2: 40 + Math.sin(angle) * length,
      kind,
      angle,
    };
  });
  return (
    <svg className="emblem emblem-wide" viewBox="0 0 80 80" aria-hidden="true">
      <circle cx="40" cy="40" r="18" fill="#E8C872" opacity="0.16" />
      {rays.map((ray) => (
        <line
          key={`${ray.x2}-${ray.y2}`}
          x1={40 + Math.cos(ray.angle) * 5}
          y1={40 + Math.sin(ray.angle) * 5}
          x2={ray.x2}
          y2={ray.y2}
          stroke={ray.kind === 0 ? "#F8E7B0" : ray.kind === 1 ? "#E8C872" : "#F4EFE4"}
          strokeWidth={ray.kind === 0 ? 2.1 : 1.25}
          strokeLinecap="round"
        />
      ))}
      {rays
        .filter((ray) => ray.kind === 0)
        .map((ray) => (
          <Star key={`s-${ray.x2}`} x={ray.x2} y={ray.y2} r={3.1} fill="#FFF8E8" />
        ))}
      {rays
        .filter((ray) => ray.kind === 1)
        .map((ray) => (
          <circle key={`d-${ray.x2}`} cx={ray.x2} cy={ray.y2} r="1.7" fill="#F4EFE4" />
        ))}
      <circle cx="40" cy="40" r="6.5" fill="#E8C872" />
      <circle cx="40" cy="40" r="3.2" fill="#FFF8E8" />
      <circle cx="38.6" cy="38.4" r="1.3" fill="#fff" />
    </svg>
  );
}

function HeartMark() {
  return (
    <svg className="emblem" viewBox="0 0 72 66" aria-hidden="true">
      <path
        fill="rgba(80,8,18,0.28)"
        d="M36 60C22 49 6 36 6 21 6 10 14 3 23 3c6 0 9 3 13 9 4-6 7-9 13-9 9 0 17 7 17 18C66 36 50 49 36 60Z"
        transform="translate(0 2)"
      />
      <path
        fill="#fff7f5"
        d="M36 58C22 47 6 34 6 19 6 8 14 1 23 1c6 0 9 3 13 9 4-6 7-9 13-9 9 0 17 7 17 18C66 34 50 47 36 58Z"
      />
      <path
        fill="#E11D3A"
        d="M36 50C25 41 14 32 14 22c0-6 4-10 9-10 3 0 6 2 8 6 2-4 5-6 8-6 5 0 9 4 9 10 0 10-11 19-18 28Z"
      />
      <ellipse cx="24" cy="16" rx="5.5" ry="3.2" fill="#fff" opacity="0.72" transform="rotate(-28 24 16)" />
    </svg>
  );
}

function CloverMark() {
  const leaf = "M0 2C-9 2-18-7-13-18-9-26 0-20 0-14 0-20 9-26 13-18 18-7 9 2 0 2Z";
  return (
    <svg className="emblem" viewBox="0 0 92 112" aria-hidden="true">
      <defs>
        <radialGradient id="clover-leaf" cx="32%" cy="28%" r="78%">
          <stop offset="0%" stopColor="#5ed08c" />
          <stop offset="48%" stopColor="#1c9450" />
          <stop offset="100%" stopColor="#0a5530" />
        </radialGradient>
      </defs>
      <path d="M46 54c2 16 7 32 5 52" stroke="#084428" strokeWidth="4.4" fill="none" strokeLinecap="round" />
      <path d="M46 54c2 16 7 32 5 52" stroke="#3cb371" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <g transform="translate(46 36)">
        {[0, 90, 180, 270].map((deg) => (
          <g key={deg} transform={`rotate(${deg}) translate(0 -11)`}>
            <path d={leaf} fill="url(#clover-leaf)" stroke="#08381e" strokeWidth="0.7" />
            <path d="M0 1C-1-7-1-12 0-17" stroke="#06321c" strokeWidth="0.8" fill="none" opacity="0.55" />
            <ellipse cx="-4" cy="-10" rx="3.2" ry="5" fill="#fff" opacity="0.22" transform="rotate(-16)" />
          </g>
        ))}
        <circle r="5.2" fill="#e8c872" stroke="#8a6824" strokeWidth="0.7" />
        <circle cx="-1.3" cy="-1.3" r="1.7" fill="#fff6d4" />
      </g>
    </svg>
  );
}

function Eggs() {
  return (
    <svg className="emblem emblem-eggs" viewBox="0 0 236 126" aria-hidden="true">
      <Egg x={40} fill="#fbf6ee" accent="#5f9474" motif="speckle" />
      <Egg x={118} fill="#f6c3bb" accent="#c44555" motif="ribbon" />
      <Egg x={196} fill="#d7f0e6" accent="#3d7c9c" motif="chevron" />
    </svg>
  );
}

const EGG = "M0 0C14 1 25 28 25 60 25 96 14 116 0 116-14 116-25 96-25 60-25 28-14 1 0 0Z";

function Egg({ x, fill, accent, motif }: { x: number; fill: string; accent: string; motif: "speckle" | "ribbon" | "chevron" }) {
  const id = `egg-${motif}`;
  return (
    <g transform={`translate(${x} 2)`}>
      <ellipse cx="1" cy="112" rx="18" ry="4.5" fill="rgba(36,20,14,0.16)" />
      <defs>
        <clipPath id={id}>
          <path d={EGG} />
        </clipPath>
        <linearGradient id={`${id}-body`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff" />
          <stop offset="0.35" stopColor={fill} />
          <stop offset="1" stopColor={fill} />
        </linearGradient>
      </defs>
      <path d={EGG} fill={`url(#${id}-body)`} />
      <g clipPath={`url(#${id})`}>
        {motif === "speckle" ? (
          <>
            <path d="M-25 70h50v7H-25z" fill={accent} />
            <path d="M-25 68h50" stroke="#c6a15b" strokeWidth="1.3" />
            {[
              [-12, 18, 1.7],
              [-2, 12, 2.1],
              [9, 20, 1.6],
              [-8, 32, 1.5],
              [6, 36, 2],
              [13, 28, 1.4],
              [-14, 46, 1.6],
              [2, 50, 1.3],
              [11, 84, 1.5],
              [-6, 90, 1.8],
            ].map(([cx, cy, r]) => (
              <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={r} fill={accent} />
            ))}
          </>
        ) : null}
        {motif === "ribbon" ? (
          <>
            <path d="M-26 48h52v18H-26z" fill="#fffaf7" />
            <path d="M-26 48h52M-26 66h52" stroke={accent} strokeWidth="1.4" />
            <path d="M-4 48c0 6-8 8-8 14 0-6 8-8 8-14 0 6 8 8 8 14 0-6-8-8-8-14z" fill={accent} />
            <circle cx="-8" cy="62" r="2.2" fill="#c6a15b" />
            <circle cx="8" cy="62" r="2.2" fill="#c6a15b" />
          </>
        ) : null}
        {motif === "chevron" ? (
          <>
            <path d="M-26 28h52l-7 9H-19z" fill={accent} />
            <path d="M-26 46h52l-7 9H-19z" fill="#f4c96a" />
            <path d="M-26 64h52l-7 9H-19z" fill={accent} opacity="0.9" />
            <path d="M-26 82h52l-7 9H-19z" fill="#fff" opacity="0.55" />
          </>
        ) : null}
      </g>
      <ellipse cx="-8" cy="28" rx="8" ry="16" fill="#fff" opacity="0.38" transform="rotate(-18 -8 28)" />
      <path d={EGG} fill="none" stroke={INK} strokeWidth="1.35" />
    </g>
  );
}

function RoseMark() {
  return (
    <svg className="emblem emblem-rose" viewBox="0 0 100 132" aria-hidden="true">
      <path d="M42 0h16c0 8-2 12-8 14s-8-6-8-14z" fill="#c45368" />
      <path d="M50 12c1 22 2 36 0 52" stroke="#245c38" strokeWidth="3.2" fill="none" strokeLinecap="round" />
      <path d="M50 46c-16 4-26 16-16 26 8-8 14-12 16-16z" fill="#2f7a48" />
      <path d="M50 62c14 0 26 10 16 20-8-6-14-12-16-14z" fill="#3e9460" />
      <path d="M48 52c-8 4-12 8-6 10M54 68c8 3 12 7 8 9" stroke="#1c432c" strokeWidth="0.8" fill="none" />
      <g transform="translate(50 92)">
        <path d="M-24 2c-6-20 6-34 18-28 2 12-2 22-6 26-6 2-10 2-12 2z" fill="#9a384c" />
        <path d="M24 2c6-20-6-34-18-28-2 12 2 22 6 26 6 2 10 2 12 2z" fill="#c45368" />
        <path d="M-16-2c-2-16 8-26 16-20 1 8-2 16-4 18-5 2-10 2-12 2z" fill="#d97888" />
        <path d="M16-2c2-16-8-26-16-20-1 8 2 16 4 18 5 2 10 2 12 2z" fill="#e7a0ac" />
        <path d="M0 4c-10-2-14-14-8-22 6 6 8 14 8 18 0-6 4-14 10-18 4 10-2 20-10 22z" fill="#f4d5db" />
        <path d="M0 2c-3-8-1-14 0-16 1 2 3 8 0 16z" fill="#9e3048" />
        <ellipse cx="-7" cy="-12" rx="4" ry="2.4" fill="#fff" opacity="0.55" transform="rotate(-28)" />
      </g>
    </svg>
  );
}

type Pt = { x: number; y: number };

function point(x: number, y: number): Pt {
  return { x, y };
}

function ribbonBands(a: Pt, b: Pt, c: Pt, d: Pt, flip: boolean) {
  const mix = (p: Pt, q: Pt, t: number) => ({ x: p.x + (q.x - p.x) * t, y: p.y + (q.y - p.y) * t });
  const count = 11;
  return Array.from({ length: count }, (_, i) => {
    const t0 = i / count;
    const t1 = (i + 1) / count;
    const p = mix(a, b, t0);
    const q = mix(a, b, t1);
    const r = mix(d, c, t1);
    const s = mix(d, c, t0);
    const red = i % 2 === 0;
    return (
      <path
        key={i}
        fill={(red !== flip) ? RED : "#fff"}
        d={`M${p.x} ${p.y}L${q.x} ${q.y}L${r.x} ${r.y}L${s.x} ${s.y}Z`}
      />
    );
  });
}

function Ribbon() {
  const loop = "M75 1C102-1 118 16 113 36 109 52 94 62 75 74 56 62 41 52 37 36 32 16 48-1 75 1Z";
  const edge = "rgba(20,16,12,0.28)";
  return (
    <svg className="emblem emblem-ribbon" viewBox="0 0 150 158" aria-hidden="true">
      {ribbonBands(point(58, 66), point(20, 152), point(44, 144), point(72, 68), false)}
      {ribbonBands(point(92, 66), point(130, 152), point(106, 144), point(78, 68), true)}
      <path d="M58 66 20 152 44 144 72 68Z" fill="none" stroke={edge} strokeWidth="1.15" strokeLinejoin="round" />
      <path d="M92 66 130 152 106 144 78 68Z" fill="none" stroke={edge} strokeWidth="1.15" strokeLinejoin="round" />
      <path d={loop} fill={NAVY} />
      {[
        [58, 24],
        [75, 20],
        [92, 24],
        [66, 36],
        [84, 36],
        [58, 48],
        [75, 44],
        [92, 48],
      ].map(([x, y]) => (
        <Star key={`${x}-${y}`} x={x} y={y} r={2.35} fill="#fff" />
      ))}
      <path d={loop} fill="none" stroke={edge} strokeWidth="1.15" />
      <path d="M64 64h22l-3 8H67z" fill={NAVY} stroke="#fff" strokeWidth="1" />
    </svg>
  );
}

function TieMark() {
  const blade = "M30 40h30l10 22L45 124 20 62 30 40Z";
  return (
    <svg className="emblem emblem-tie" viewBox="0 0 90 128" aria-hidden="true">
      <g transform="translate(0 -4)">
      <path d="M8 10 45 46 82 10 70 4 45 30 20 4Z" fill="#F7F1E8" />
      <path d="M20 6 45 32 70 6" fill="none" stroke="#E4D3C4" strokeWidth="1.2" />
      <path d="M32 18h26l5 20H27Z" fill="#152238" />
      <path d="M36 22h18l2 8H34Z" fill="#3C6494" opacity="0.85" />
      <defs>
        <clipPath id="tie-blade">
          <path d={blade} />
        </clipPath>
        <linearGradient id="tie-silk" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#152238" />
          <stop offset="0.48" stopColor="#3C6494" />
          <stop offset="1" stopColor="#152238" />
        </linearGradient>
      </defs>
      <g clipPath="url(#tie-blade)">
        <rect x="16" y="36" width="60" height="96" fill="url(#tie-silk)" />
        <path d="M8 52h70M4 70h78M0 88h82M-4 106h86" stroke="#E8C872" strokeWidth="3.2" />
      </g>
      <path d={blade} fill="none" stroke="#0E2244" strokeWidth="1.2" strokeLinejoin="round" />
      </g>
    </svg>
  );
}

function PumpkinMark() {
  return (
    <svg className="emblem emblem-pumpkin" viewBox="0 0 128 112" aria-hidden="true">
      <defs>
        <linearGradient id="pumpkin-lobe" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffb15a" />
          <stop offset="0.45" stopColor="#ef7d2c" />
          <stop offset="1" stopColor="#c45112" />
        </linearGradient>
        <radialGradient id="pumpkin-glow" cx="50%" cy="45%" r="60%">
          <stop offset="0" stopColor="#fff4c2" />
          <stop offset="1" stopColor="#f0b44a" />
        </radialGradient>
      </defs>
      <ellipse cx="64" cy="104" rx="28" ry="4" fill="rgba(20,12,8,0.2)" />
      <ellipse cx="30" cy="64" rx="18" ry="32" fill="#b84a10" />
      <ellipse cx="98" cy="64" rx="18" ry="32" fill="#b84a10" />
      <ellipse cx="46" cy="62" rx="22" ry="36" fill="url(#pumpkin-lobe)" />
      <ellipse cx="82" cy="62" rx="22" ry="36" fill="#d86a20" />
      <ellipse cx="64" cy="60" rx="20" ry="38" fill="#f0943a" />
      <path d="M46 30c2 20 2 40 0 58M64 26c1 22 1 44 0 62M82 30c-2 20-2 40 0 58" stroke="#8d3c0e" strokeWidth="1.7" fill="none" opacity="0.8" />
      <ellipse cx="52" cy="46" rx="7" ry="14" fill="#fff" opacity="0.22" />
      <path d="M64 24c1-12 8-20 16-16-7 1-12 8-13 16" fill="#5c3a16" />
      <path d="M66 22c1-8 6-12 11-10" stroke="#8a6230" strokeWidth="1.4" fill="none" strokeLinecap="round" />
      <path d="M40 52l14 11-14 9z" fill="#6a3010" />
      <path d="M43 55l9 7-9 6z" fill="url(#pumpkin-glow)" />
      <path d="M88 52l-14 11 14 9z" fill="#6a3010" />
      <path d="M85 55l-9 7 9 6z" fill="url(#pumpkin-glow)" />
      <path d="M64 66l8 10h-16z" fill="#6a3010" />
      <path d="M64 69l5 7h-10z" fill="url(#pumpkin-glow)" />
      <path d="M36 82c4 4 8 2 10-2 2 6 6 8 10 4 2 6 8 8 12 2 3 6 9 6 14 0-8 10-22 14-36 10-6-2-8-6-10-14z" fill="#6a3010" />
      <path d="M40 82c3 3 7 2 9-1 2 5 6 6 9 3 2 5 7 6 11 2 3 5 8 5 12 1-7 8-20 11-32 8-5-2-7-5-9-13z" fill="url(#pumpkin-glow)" />
    </svg>
  );
}

function TurkeyMark() {
  const feathers = Array.from({ length: 7 }, (_, i) => -78 + i * 22);
  return (
    <svg className="emblem emblem-turkey" viewBox="0 0 150 120" aria-hidden="true">
      {feathers.map((deg, i) => (
        <ellipse
          key={deg}
          cx="0"
          cy="-34"
          rx="8"
          ry="26"
          transform={`translate(62 78) rotate(${deg})`}
          fill={i % 2 === 0 ? "#8A3E1E" : "#C4784A"}
          stroke="#5C2A12"
          strokeWidth="0.8"
        />
      ))}
      {feathers.map((deg) => (
        <ellipse
          key={`tip-${deg}`}
          cx="0"
          cy="-52"
          rx="4.2"
          ry="7"
          transform={`translate(62 78) rotate(${deg})`}
          fill="#E2B656"
        />
      ))}
      <ellipse cx="78" cy="82" rx="30" ry="22" fill="#6B3A24" />
      <ellipse cx="70" cy="84" rx="16" ry="10" fill="#C4784A" transform="rotate(-18 70 84)" />
      <path d="M100 74c10-2 18 6 16 14" stroke="#6B3A24" strokeWidth="8" fill="none" strokeLinecap="round" />
      <circle cx="118" cy="66" r="11" fill="#6B3A24" />
      <path d="M126 66l14 4-14 4z" fill="#E2B656" />
      <ellipse cx="120" cy="76" rx="4" ry="6.5" fill="#B4232A" />
      <circle cx="122" cy="63" r="1.7" fill="#1A120E" />
      <circle cx="122.6" cy="62.4" r="0.6" fill="#fff" />
    </svg>
  );
}

function TreeMark() {
  return (
    <svg className="emblem emblem-tree" viewBox="-4 0 128 136" aria-hidden="true">
      <defs>
        <linearGradient id="tree-a" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2f8f5b" />
          <stop offset="1" stopColor="#14553a" />
        </linearGradient>
        <linearGradient id="tree-b" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#257a4c" />
          <stop offset="1" stopColor="#0f3f2c" />
        </linearGradient>
      </defs>
      <Star x={60} y={11} r={8.5} fill="#e8c872" />
      <path d="M60 16c2 2 4 3 6 2-8 6-16 16-18 28h24C68 34 64 24 60 16z" fill="#e8c872" opacity="0.9" />
      <path d="M60 18C82 34 96 46 98 56H22C24 46 38 34 60 18Z" fill="url(#tree-a)" />
      <path d="M60 20C74 32 84 42 86 52" fill="none" stroke="#d7f0e2" strokeWidth="1.2" opacity="0.55" />
      <path d="M60 44C90 62 108 78 112 92H8C12 78 30 62 60 44Z" fill="url(#tree-b)" />
      <path d="M60 46C78 58 92 70 96 84" fill="none" stroke="#d7f0e2" strokeWidth="1.2" opacity="0.4" />
      <path d="M60 70C96 90 116 108 122 124H-2C4 108 24 90 60 70Z" fill="#123f2c" />
      <path d="M22 56h76" stroke="#0d3324" strokeWidth="1" opacity="0.35" />
      <path d="M8 92h104" stroke="#0d3324" strokeWidth="1" opacity="0.35" />
      <rect x="52" y="122" width="16" height="12" rx="1.5" fill="#6b3a24" />
      <circle cx="46" cy="78" r="4.2" fill="#c8102e" />
      <circle cx="74" cy="96" r="4.4" fill="#e8c872" />
      <circle cx="40" cy="108" r="3.8" fill="#f4efe4" />
      <circle cx="78" cy="70" r="3.4" fill="#c8102e" />
      <circle cx="58" cy="112" r="3.6" fill="#2e8b57" stroke="#f4efe4" strokeWidth="0.8" />
      <circle cx="44.6" cy="76.4" r="1.2" fill="#fff" opacity="0.75" />
      <circle cx="72.6" cy="94.4" r="1.2" fill="#fff" opacity="0.75" />
      <path d="M34 86c10 4 18 2 28-2 8 3 16 2 24-3" fill="none" stroke="#e8c872" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}
