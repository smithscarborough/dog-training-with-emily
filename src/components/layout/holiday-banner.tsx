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

const EGG = "M0-20C11.2-20 16.8-10 16.8-1 16.8 11 11.2 20 0 20-11.2 20-16.8 11-16.8-1-16.8-10-11.2-20 0-20Z";

function Eggs() {
  return (
    <svg className="emblem emblem-eggs" viewBox="0 6 168 60" aria-hidden="true">
      <defs>
        <filter id="egg-soft" x="-70%" y="-80%" width="240%" height="280%">
          <feGaussianBlur stdDeviation="1.5" />
        </filter>
        <radialGradient id="egg-ivory" cx="34%" cy="30%" r="72%">
          <stop offset="0" stopColor="#fffefb" />
          <stop offset="0.58" stopColor="#f4e7d4" />
          <stop offset="1" stopColor="#d8c0a2" />
        </radialGradient>
        <radialGradient id="egg-blush" cx="34%" cy="30%" r="72%">
          <stop offset="0" stopColor="#fff6f4" />
          <stop offset="0.5" stopColor="#f3c3c0" />
          <stop offset="1" stopColor="#d98992" />
        </radialGradient>
        <radialGradient id="egg-mint" cx="34%" cy="30%" r="72%">
          <stop offset="0" stopColor="#f7fffb" />
          <stop offset="0.52" stopColor="#d4f0e2" />
          <stop offset="1" stopColor="#a9d2c2" />
        </radialGradient>
        <linearGradient id="egg-gold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f8e7b2" />
          <stop offset="0.5" stopColor="#d4ae60" />
          <stop offset="1" stopColor="#8d6828" />
        </linearGradient>
        <clipPath id="egg-shell">
          <path d={EGG} />
        </clipPath>
      </defs>
      <ellipse cx="30" cy="57" rx="14" ry="3.6" fill="rgba(36,20,14,0.18)" filter="url(#egg-soft)" />
      <ellipse cx="84" cy="57.5" rx="14" ry="3.6" fill="rgba(36,20,14,0.18)" filter="url(#egg-soft)" />
      <ellipse cx="138" cy="57" rx="14" ry="3.6" fill="rgba(36,20,14,0.16)" filter="url(#egg-soft)" />
      <ellipse cx="30" cy="55.2" rx="8.5" ry="1.5" fill="rgba(36,20,14,0.28)" />
      <ellipse cx="84" cy="55.6" rx="8.5" ry="1.5" fill="rgba(36,20,14,0.28)" />
      <ellipse cx="138" cy="55.2" rx="8.5" ry="1.5" fill="rgba(36,20,14,0.24)" />
      <g transform="translate(30 32)">
        <path d={EGG} fill="url(#egg-ivory)" />
        <g clipPath="url(#egg-shell)">
          <rect x="-20" y="-2.2" width="40" height="4.4" fill="url(#egg-gold)" />
          <path d="M-16-2.2h32" stroke="#fff6d6" strokeWidth="0.55" />
          <circle cx="-8" cy="-12" r="1.35" fill="#5f8a6c" />
          <circle cx="1" cy="-13.2" r="1.7" fill="#6d9478" />
          <circle cx="9" cy="-9" r="1.2" fill="#5f8a6c" />
          <circle cx="-11" cy="7" r="1.15" fill="#6d9478" />
          <circle cx="-2" cy="10" r="1.55" fill="#5f8a6c" />
          <circle cx="8" cy="8" r="1.25" fill="#6d9478" />
          <ellipse cx="-6.5" cy="-9" rx="4.8" ry="7.2" fill="#fff" opacity="0.7" transform="rotate(-26 -6.5 -9)" />
          <ellipse cx="5" cy="13" rx="9" ry="4" fill="#c4a078" opacity="0.2" />
        </g>
        <path d={EGG} fill="none" stroke="rgba(90,62,40,0.25)" strokeWidth="0.7" />
      </g>
      <g transform="translate(84 33)">
        <path d={EGG} fill="url(#egg-blush)" />
        <g clipPath="url(#egg-shell)">
          <rect x="-20" y="-3.2" width="40" height="6.2" fill="#fffaf8" />
          <path d="M-18-3.2h36M-18 3h36" stroke="#e7b4b8" strokeWidth="0.4" />
          <path d="M-1.2-1.2C-1.2-6.2-8.6-7.4-10.6-3.2-12.2 0-8 3.6-4.4 2.4-2.4 1.8-1.6.4-1.2-1.2Z" fill="#fff" />
          <path d="M1.2-1.2C1.2-6.2 8.6-7.4 10.6-3.2 12.2 0 8 3.6 4.4 2.4 2.4 1.8 1.6.4 1.2-1.2Z" fill="#fff" />
          <path d="M-1.2 1.6-6.4 10-3.6 10.6 0 2.8Z" fill="#fff" />
          <path d="M1.2 1.6 6.4 10 3.6 10.6 0 2.8Z" fill="#fff" />
          <circle cy="0.2" r="1.7" fill="#f4d78a" stroke="#a67c38" strokeWidth="0.4" />
          <ellipse cx="-6" cy="-10" rx="4.2" ry="6.2" fill="#fff" opacity="0.55" transform="rotate(-24 -6 -10)" />
          <ellipse cx="4" cy="13" rx="9" ry="4" fill="#c48a90" opacity="0.18" />
        </g>
        <path d={EGG} fill="none" stroke="rgba(120,60,68,0.25)" strokeWidth="0.7" />
      </g>
      <g transform="translate(138 32)">
        <path d={EGG} fill="url(#egg-mint)" />
        <g clipPath="url(#egg-shell)" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d="M-12-8 0 0 12-8" stroke="#c6a15a" strokeWidth="1.45" />
          <path d="M-12-1 0 7 12-1" stroke="#6f8f7c" strokeWidth="1.45" />
          <path d="M-12 6 0 14 12 6" stroke="#c6a15a" strokeWidth="1.45" />
          <ellipse cx="-6" cy="-9" rx="4.4" ry="6.6" fill="#fff" stroke="none" opacity="0.55" transform="rotate(-24 -6 -9)" />
          <ellipse cx="4" cy="13" rx="9" ry="4" fill="#7aa890" stroke="none" opacity="0.16" />
        </g>
        <path d={EGG} fill="none" stroke="rgba(50,90,74,0.25)" strokeWidth="0.7" />
      </g>
    </svg>
  );
}

const ROSE_PETAL = "M0 18C18 14 24-10 11-30 4-36-4-36-11-30-24-10-18 14 0 18Z";
const ROSE_INNER = "M0 9C12 7 15-9 6-20 2-24-2-24-6-20-15-9-12 7 0 9Z";

function RoseMark() {
  return (
    <svg className="emblem emblem-rose" viewBox="0 16 110 104" aria-hidden="true">
      <defs>
        <radialGradient id="petal" cx="30%" cy="26%" r="80%">
          <stop offset="0" stopColor="#fff1f3" />
          <stop offset="0.38" stopColor="#e48998" />
          <stop offset="1" stopColor="#8a2840" />
        </radialGradient>
        <radialGradient id="petal-in" cx="38%" cy="30%" r="72%">
          <stop offset="0" stopColor="#fff7f8" />
          <stop offset="0.46" stopColor="#d85a74" />
          <stop offset="1" stopColor="#8e243c" />
        </radialGradient>
        <linearGradient id="rose-leaf" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#9dcc96" />
          <stop offset="1" stopColor="#2c6844" />
        </linearGradient>
      </defs>
      <path d="M54 86C50 98 46 108 40 116" fill="none" stroke="#3d6b4a" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M50 98C36 94 24 100 18 92 28 90 38 94 48 100Z" fill="url(#rose-leaf)" />
      <path d="M52 102C66 94 80 100 86 90 74 92 64 98 54 104Z" fill="url(#rose-leaf)" />
      <g transform="translate(55 52)">
        <g fill="url(#petal)">
          {[0, 60, 120, 180, 240, 300].map((deg) => (
            <path key={deg} d={ROSE_PETAL} transform={`rotate(${deg})`} />
          ))}
        </g>
        <g fill="url(#petal-in)">
          {[30, 102, 174, 246, 318].map((deg) => (
            <path key={deg} d={ROSE_INNER} transform={`rotate(${deg})`} />
          ))}
        </g>
        <path d="M-2 3C2 6 6 2 4-4 8-2 8-8 3-10 0-6-4-8-4-3-8-6-8 0-4 3Z" fill="#f6c3ce" />
        <circle r="2.2" fill="#f8e4c4" />
        <ellipse cx="-10" cy="-16" rx="8" ry="4.2" fill="#fff" opacity="0.3" transform="rotate(-32 -10 -16)" />
      </g>
    </svg>
  );
}

const CLOVER_LEAF = "M0 2C10 2 16-10 7-20 2-24-2-24-7-20-16-10-10 2 0 2Z";

function CloverMark() {
  return (
    <svg className="emblem emblem-clover" viewBox="0 20 100 92" aria-hidden="true">
      <defs>
        <radialGradient id="clover" cx="32%" cy="28%" r="75%">
          <stop offset="0" stopColor="#d7f5c4" />
          <stop offset="0.5" stopColor="#3f9a56" />
          <stop offset="1" stopColor="#1c6a38" />
        </radialGradient>
      </defs>
      <path d="M50 64C48 80 44 96 36 106" fill="none" stroke="#1c6a38" strokeWidth="2.3" strokeLinecap="round" />
      <g transform="translate(50 46)" fill="url(#clover)">
        {[0, 90, 180, 270].map((deg) => (
          <path key={deg} d={CLOVER_LEAF} transform={`rotate(${deg})`} />
        ))}
      </g>
      <circle cx="50" cy="46" r="3.4" fill="#e8c872" />
    </svg>
  );
}

function PumpkinMark() {
  return (
    <svg className="emblem emblem-pumpkin" viewBox="0 8 112 96" aria-hidden="true">
      <defs>
        <radialGradient id="pump" cx="40%" cy="34%" r="72%">
          <stop offset="0" stopColor="#f6c56a" />
          <stop offset="0.55" stopColor="#e07a22" />
          <stop offset="1" stopColor="#a34712" />
        </radialGradient>
        <filter id="pump-soft" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="1.2" />
        </filter>
      </defs>
      <ellipse cx="56" cy="94" rx="30" ry="4" fill="rgba(36,20,14,0.2)" filter="url(#pump-soft)" />
      <ellipse cx="34" cy="60" rx="18" ry="28" fill="#c46216" />
      <ellipse cx="78" cy="60" rx="18" ry="28" fill="#c46216" />
      <ellipse cx="56" cy="58" rx="26" ry="30" fill="url(#pump)" />
      <path d="M56 30C52 36 50 44 50 52" stroke="#b85a16" strokeWidth="1.4" opacity="0.45" />
      <path d="M56 28C62 16 76 14 80 22 70 18 62 24 58 32Z" fill="#2f6a45" />
      <path d="M40 52l8 7-8 3z" fill="#3a2014" />
      <path d="M72 52l-8 7 8 3z" fill="#3a2014" />
      <path d="M46 72c6 7 14 7 20 0" fill="none" stroke="#3a2014" strokeWidth="2.1" strokeLinecap="round" />
    </svg>
  );
}

function TreeMark() {
  return (
    <svg className="emblem emblem-tree" viewBox="0 0 100 124" aria-hidden="true">
      <defs>
        <linearGradient id="fir" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3d7d58" />
          <stop offset="1" stopColor="#143c2c" />
        </linearGradient>
      </defs>
      <path d="M50 14 76 50H24Z" fill="url(#fir)" />
      <path d="M50 34 84 74H16Z" fill="#1e5c40" />
      <path d="M50 54 92 100H8Z" fill="#163e2e" />
      <rect x="44" y="100" width="12" height="16" rx="1.5" fill="#6b4226" />
      <Star x={50} y={12} r={6} fill="#e8c872" />
      <circle cx="38" cy="62" r="2.4" fill="#c45368" />
      <circle cx="64" cy="76" r="2.4" fill="#e8c872" />
      <circle cx="46" cy="84" r="2.1" fill="#f4efe4" />
      <circle cx="70" cy="58" r="1.8" fill="#f4efe4" />
    </svg>
  );
}

function Ribbon() {
  const loop = "M30 80C8 62 8 24 34 12 50 2 78 2 94 12 120 24 120 62 98 80";
  const stars = [
    [76, 92],
    [64, 100],
    [82, 108],
    [68, 116],
    [56, 124],
    [74, 132],
    [60, 140],
    [70, 150],
  ];
  return (
    <svg className="emblem emblem-ribbon" viewBox="0 0 132 168" aria-hidden="true">
      <defs>
        <linearGradient id="rib-navy" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#31598a" />
          <stop offset="1" stopColor="#101e36" />
        </linearGradient>
        <clipPath id="navy-clip">
          <path d="M62 74 90 92 46 160 18 146Z" />
        </clipPath>
      </defs>
      <path d="M84 76 120 150 104 158 72 88Z" fill="#a12330" />
      <path d="M88 90 116 148 110 150 84 100Z" fill="#fff" />
      <path d="M92 106 112 146 106 148 88 116Z" fill="#b22234" />
      <path d="M74 80 98 154 82 162 60 92Z" fill="#8e1c2c" />
      <path d="M76 96 94 152 88 154 70 106Z" fill="#fff" />
      <path d="M78 112 90 150 86 152 74 122Z" fill="#a12330" />
      <path d="M62 74 90 92 46 160 18 146Z" fill="#fff" />
      <path d="M66 78 86 92 46 156 24 146Z" fill="url(#rib-navy)" />
      <g clipPath="url(#navy-clip)">
        {stars.map(([x, y]) => (
          <Star key={`${x}-${y}`} x={x} y={y} r={3.3} fill="#fff" />
        ))}
      </g>
      <path d={loop} fill="none" stroke="#fff" strokeWidth="22" strokeLinecap="round" />
      <path d={loop} fill="none" stroke="#b22234" strokeWidth="15" strokeLinecap="round" />
      <path d={loop} fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" />
      <path d="M46 28C58 12 84 12 96 28 82 18 58 18 46 28Z" fill="#6e1520" />
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
  const outer = [-78, -62, -46, -30, -14, 2, 18, 34, 50, 66, 80];
  const inner = [-54, -28, -2, 24, 50];
  return (
    <svg className="emblem emblem-turkey" viewBox="0 30 170 102" aria-hidden="true">
      <defs>
        <filter id="tsoft" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="1.6" />
        </filter>
        <linearGradient id="feather" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#4e2612" />
          <stop offset="0.45" stopColor="#a85a30" />
          <stop offset="1" stopColor="#f0d48a" />
        </linearGradient>
        <linearGradient id="feather-b" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#3d1e10" />
          <stop offset="0.5" stopColor="#7d4024" />
          <stop offset="1" stopColor="#e2b15e" />
        </linearGradient>
        <radialGradient id="trk-body" cx="36%" cy="32%" r="75%">
          <stop offset="0" stopColor="#e0b184" />
          <stop offset="0.5" stopColor="#8d4e2e" />
          <stop offset="1" stopColor="#4a2414" />
        </radialGradient>
        <radialGradient id="trk-head" cx="34%" cy="30%" r="70%">
          <stop offset="0" stopColor="#c48a5c" />
          <stop offset="1" stopColor="#5a3018" />
        </radialGradient>
      </defs>
      <ellipse cx="82" cy="120" rx="40" ry="5.2" fill="rgba(36,20,14,0.18)" filter="url(#tsoft)" />
      <ellipse cx="82" cy="118" rx="24" ry="2.1" fill="rgba(36,20,14,0.26)" />
      {outer.map((deg, i) => (
        <g key={deg} transform={`translate(78 92) rotate(${deg})`}>
          <path d="M0 6C9-2 10-30 0-54-10-30-9-2 0 6Z" fill={i % 2 ? "url(#feather-b)" : "url(#feather)"} />
          <path d="M0 2V-44" stroke="#f6e2b4" strokeWidth="0.65" opacity="0.8" />
        </g>
      ))}
      {inner.map((deg) => (
        <g key={`in-${deg}`} transform={`translate(78 94) rotate(${deg})`}>
          <path d="M0 2C6-2 6-20 0-34-6-20-6-2 0 2Z" fill="#6b3820" />
          <path d="M0 0V-26" stroke="#f0d7a4" strokeWidth="0.5" opacity="0.6" />
        </g>
      ))}
      <ellipse cx="78" cy="96" rx="30" ry="21" fill="url(#trk-body)" />
      <path d="M54 94C40 84 36 102 50 112 60 106 66 98 54 94Z" fill="#a8643c" />
      <path d="M48 98C50 106 60 110 66 104" fill="none" stroke="#5a2e18" strokeWidth="0.8" strokeLinecap="round" />
      <path d="M46 104C52 108 60 108 64 102" fill="none" stroke="#5a2e18" strokeWidth="0.7" strokeLinecap="round" />
      <ellipse cx="70" cy="98" rx="10" ry="6" fill="#f3d2b0" opacity="0.28" transform="rotate(-20 70 98)" />
      <path d="M102 86C116 78 128 90 122 102" fill="none" stroke="#6b3a22" strokeWidth="7.5" strokeLinecap="round" />
      <circle cx="126" cy="74" r="12" fill="url(#trk-head)" />
      <path d="M136 74 152 79 136 84Z" fill="#e2ae42" />
      <path d="M140 75.5 148 79 140 82.5Z" fill="#f6d48c" />
      <path d="M124 68C126 60 134 62 132 72" fill="#b4332a" />
      <ellipse cx="128" cy="86" rx="4" ry="7" fill="#b4332a" />
      <circle cx="130" cy="72" r="1.8" fill="#1a120e" />
      <circle cx="130.6" cy="71.4" r="0.55" fill="#fff" />
    </svg>
  );
}
