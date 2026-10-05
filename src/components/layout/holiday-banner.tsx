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
  if (id === "valentine") return <PhotoEmblem src="/images/holidays/heart-red.webp" className="emblem-heart" />;
  if (id === "patrick") return <PhotoEmblem src="/images/holidays/clover-mark.webp" className="emblem-clover" />;
  if (id === "easter") return <Eggs />;
  if (id === "mothers") return <PhotoEmblem src="/images/holidays/rose-mark.webp" className="emblem-rose" />;
  if (id === "memorial") return <Ribbon />;
  if (id === "fathers") return <TieMark />;
  if (id === "july4") return <Flag />;
  if (id === "halloween") return <PhotoEmblem src="/images/holidays/pumpkin-mark.webp" className="emblem-pumpkin" />;
  if (id === "thanksgiving") return <TurkeyMark />;
  return <PhotoEmblem src="/images/holidays/tree-mark.webp" className="emblem-tree" />;
}

function PhotoEmblem({ src, className }: { src: string; className: string }) {
  return <img src={src} alt="" className={`emblem emblem-photo frame-none ${className}`} />;
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

const EGG = "M0-20C11.5-20 17.5-10 17.5-1 17.5 11 11.5 20 0 20-11.5 20-17.5 11-17.5-1-17.5-10-11.5-20 0-20Z";

function Eggs() {
  return (
    <svg className="emblem emblem-eggs" viewBox="0 0 156 54" aria-hidden="true">
      <defs>
        <linearGradient id="egg-ivory" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fffdf9" />
          <stop offset="0.46" stopColor="#f4ecdf" />
          <stop offset="1" stopColor="#e3d0b6" />
        </linearGradient>
        <linearGradient id="egg-blush" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff7f5" />
          <stop offset="0.42" stopColor="#f6c9c5" />
          <stop offset="1" stopColor="#e09099" />
        </linearGradient>
        <linearGradient id="egg-mint" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f7fffb" />
          <stop offset="0.5" stopColor="#d7f2e4" />
          <stop offset="1" stopColor="#b4d9cb" />
        </linearGradient>
        <linearGradient id="egg-gold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f8e7b4" />
          <stop offset="0.48" stopColor="#d4b06a" />
          <stop offset="1" stopColor="#8d6a32" />
        </linearGradient>
        <linearGradient id="egg-satin" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.5" stopColor="#f4ece8" />
          <stop offset="1" stopColor="#ffffff" />
        </linearGradient>
        <clipPath id="egg-shell">
          <path d={EGG} />
        </clipPath>
      </defs>
      <ellipse cx="26" cy="49" rx="12" ry="1.7" fill="rgba(36,20,14,0.16)" />
      <ellipse cx="78" cy="49" rx="12" ry="1.7" fill="rgba(36,20,14,0.16)" />
      <ellipse cx="130" cy="49" rx="12" ry="1.7" fill="rgba(36,20,14,0.16)" />
      <g transform="translate(26 26)">
        <path d={EGG} fill="url(#egg-ivory)" />
        <g clipPath="url(#egg-shell)">
          <rect x="-20" y="-2.1" width="40" height="4.2" fill="url(#egg-gold)" />
          <path d="M-18-2.1h36" stroke="#fff6d8" strokeWidth="0.6" />
          {[
            [-9, -12, 1.15],
            [-2, -13, 1.45],
            [7, -10, 1.05],
            [11, -3, 1.2],
            [-12, -3, 0.9],
            [2, -6, 1.05],
            [-6, 7, 1.25],
            [8, 6, 0.95],
            [-2, 11, 1.15],
            [6, 13, 0.8],
            [-11, 9, 0.85],
          ].map(([cx, cy, r]) => (
            <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={r} fill="#6d9274" opacity={cy < 0 ? 0.85 : 0.7} />
          ))}
          <ellipse cx="-6" cy="-8" rx="4.6" ry="7" fill="#fff" opacity="0.55" transform="rotate(-24 -6 -8)" />
        </g>
        <path d={EGG} fill="none" stroke="rgba(90,62,40,0.28)" strokeWidth="0.8" />
      </g>
      <g transform="translate(78 26)">
        <path d={EGG} fill="url(#egg-blush)" />
        <g clipPath="url(#egg-shell)">
          <rect x="-20" y="-3.4" width="40" height="6.6" fill="url(#egg-satin)" />
          <path d="M-20-3.4h40M-20 3.2h40" stroke="#e7b4b4" strokeWidth="0.45" />
          <path d="M-1.1-0.6C-1.1-5.4-8.2-6.6-10.2-2.8-11.8 0.2-7.8 3.6-4.4 2.6-2.6 2-1.5 0.8-1.1-0.6Z" fill="#fff" />
          <path d="M1.1-0.6C1.1-5.4 8.2-6.6 10.2-2.8 11.8 0.2 7.8 3.6 4.4 2.6 2.6 2 1.5 0.8 1.1-0.6Z" fill="#fff" />
          <path d="M-1.4 1.4-6.6 9.2-3.8 9.8-0.2 2.8Z" fill="#fff" />
          <path d="M1.4 1.4 6.6 9.2 3.8 9.8 0.2 2.8Z" fill="#fff" />
          <circle cy="0.6" r="1.9" fill="#f6e4b4" stroke="#a67c38" strokeWidth="0.45" />
          <ellipse cx="-6" cy="-9" rx="4.4" ry="6.4" fill="#fff" opacity="0.42" transform="rotate(-24 -6 -9)" />
        </g>
        <path d={EGG} fill="none" stroke="rgba(120,60,68,0.28)" strokeWidth="0.8" />
      </g>
      <g transform="translate(130 26)">
        <path d={EGG} fill="url(#egg-mint)" />
        <g clipPath="url(#egg-shell)" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d="M-13-7 0 1 13-7" stroke="#7f9788" strokeWidth="1.15" />
          <path d="M-13 0 0 8 13 0" stroke="#c6a15b" strokeWidth="1.15" />
          <path d="M-13 7 0 15 13 7" stroke="#7f9788" strokeWidth="1.15" />
          <ellipse cx="-6" cy="-8" rx="4.6" ry="7" fill="#fff" stroke="none" opacity="0.5" transform="rotate(-24 -6 -8)" />
        </g>
        <path d={EGG} fill="none" stroke="rgba(50,90,74,0.28)" strokeWidth="0.8" />
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

