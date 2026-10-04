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
      <p className="text-sm sm:text-base">{holiday.line}</p>
      <div className={`holiday-emblem is-${holiday.id}`}>
        <Emblem id={holiday.id} />
      </div>
    </aside>
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
  const rays = Array.from({ length: 12 }, (_, i) => {
    const angle = (Math.PI / 6) * i - Math.PI / 2;
    const long = i % 2 === 0;
    const length = long ? 24 : 16;
    return {
      x2: 32 + Math.cos(angle) * length,
      y2: 32 + Math.sin(angle) * length,
      dot: long,
    };
  });
  return (
    <svg className="emblem emblem-wide" viewBox="0 0 64 64" aria-hidden="true">
      {rays.map((ray) => (
        <line
          key={`${ray.x2}-${ray.y2}`}
          x1="32"
          y1="32"
          x2={ray.x2}
          y2={ray.y2}
          stroke={ray.dot ? "#E8C872" : "#F4EFE4"}
          strokeWidth={ray.dot ? 2.2 : 1.4}
          strokeLinecap="round"
        />
      ))}
      {rays
        .filter((ray) => ray.dot)
        .map((ray) => (
          <circle key={`d-${ray.x2}`} cx={ray.x2} cy={ray.y2} r="2.1" fill="#F4EFE4" />
        ))}
      <circle cx="32" cy="32" r="4.2" fill="#E8C872" />
      <circle cx="30.4" cy="30.4" r="1.5" fill="#FFF8E8" />
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
  const leaf =
    "M0-2C-7-2-14-10-9-17-5-22 0-15 0-11 0-15 5-22 9-17 14-10 7-2 0-2Z";
  return (
    <svg className="emblem" viewBox="0 0 80 104" aria-hidden="true">
      <path d="M40 58c2 14 8 28 6 40" stroke="#0C4A28" strokeWidth="4.2" fill="none" strokeLinecap="round" />
      <path d="M40 58c2 14 8 28 6 40" stroke="#2E9A55" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      <g transform="translate(40 36)">
        {[0, 90, 180, 270].map((deg) => (
          <g key={deg} transform={`rotate(${deg})`}>
            <path d={leaf} fill="#0E6B3A" />
            <path d={leaf} fill="#1F9A52" transform="scale(0.72)" />
            <path d="M0-6c0-6 0-8 0-10" stroke="#08381E" strokeWidth="0.9" fill="none" strokeLinecap="round" />
            <ellipse cx="-3.2" cy="-12" rx="2.2" ry="3.4" fill="#fff" opacity="0.28" transform="rotate(-18)" />
          </g>
        ))}
        <circle r="4.2" fill="#E8C872" />
        <circle cx="-1" cy="-1" r="1.4" fill="#FFF6D8" />
      </g>
    </svg>
  );
}

function Eggs() {
  return (
    <svg className="emblem emblem-eggs" viewBox="0 0 246 120" aria-hidden="true">
      <Egg x={44} fill="#FBF7F0" accent="#6E9A78" motif="speckle" />
      <Egg x={123} fill="#F7C9C2" accent="#C4505C" motif="ribbon" />
      <Egg x={202} fill="#D5EEE4" accent="#3E7C9A" motif="chevron" />
    </svg>
  );
}

function Egg({ x, fill, accent, motif }: { x: number; fill: string; accent: string; motif: "speckle" | "ribbon" | "chevron" }) {
  const id = `egg-${motif}`;
  return (
    <g transform={`translate(${x} 58)`}>
      <ellipse cx="2" cy="8" rx="30" ry="10" fill="rgba(36,20,14,0.14)" />
      <defs>
        <clipPath id={id}>
          <path d="M0-40c16 2 26 18 26 38 0 16-10 28-26 28S-26 14-26-2C-26-22-16-42 0-40Z" />
        </clipPath>
        <linearGradient id={`${id}-shade`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.7" />
          <stop offset="0.42" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#24140e" stopOpacity="0.16" />
        </linearGradient>
      </defs>
      <path d="M0-40c16 2 26 18 26 38 0 16-10 28-26 28S-26 14-26-2C-26-22-16-42 0-40Z" fill={fill} />
      <g clipPath={`url(#${id})`}>
        {motif === "speckle" ? (
          <>
            <path d="M-28 6h56v9H-28z" fill={accent} />
            <path d="M-28 4.2h56v1.5H-28z" fill="#C6A15B" />
            {[
              [-14, -22],
              [-2, -28],
              [10, -20],
              [-8, -10],
              [6, -8],
              [14, -30],
              [-16, -4],
            ].map(([cx, cy]) => (
              <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="2.3" fill={accent} />
            ))}
          </>
        ) : null}
        {motif === "ribbon" ? (
          <>
            <path d="M-30-2c8 8 16 8 24 0s16-8 24 0v16c-8-8-16-8-24 0s-16 8-24 0z" fill="#fffaf7" />
            <path d="M-30-2c8 8 16 8 24 0s16-8 24 0" fill="none" stroke={accent} strokeWidth="1.6" />
            <path d="M-30 14c8-8 16-8 24 0s16 8 24 0" fill="none" stroke="#C6A15B" strokeWidth="1.4" />
          </>
        ) : null}
        {motif === "chevron" ? (
          <>
            <path d="M-30-14h60l-8 10H-22z" fill={accent} />
            <path d="M-30 2h60l-8 10H-22z" fill="#F4C96A" />
            <path d="M-30 18h60l-8 10H-22z" fill={accent} opacity="0.85" />
          </>
        ) : null}
      </g>
      <path d="M0-40c16 2 26 18 26 38 0 16-10 28-26 28S-26 14-26-2C-26-22-16-42 0-40Z" fill={`url(#${id}-shade)`} />
      <path d="M0-40c16 2 26 18 26 38 0 16-10 28-26 28S-26 14-26-2C-26-22-16-42 0-40Z" fill="none" stroke={INK} strokeWidth="1.5" />
    </g>
  );
}

function RoseMark() {
  return (
    <svg className="emblem emblem-rose" viewBox="0 0 96 128" aria-hidden="true">
      <path d="M48 58c2 18 6 36 4 58" stroke="#245C38" strokeWidth="3.4" fill="none" strokeLinecap="round" />
      <path d="M48 78c-18 2-28 14-18 24 10-8 16-12 18-16z" fill="#2F7A48" />
      <path d="M48 92c16-2 28 8 18 18-10-6-16-12-18-16z" fill="#3E9460" />
      <path d="M46 84c-10 4-14 10-8 12M52 98c8 4 14 8 10 10" stroke="#1C432C" strokeWidth="0.9" fill="none" />
      <g transform="translate(48 36)">
        <ellipse cx="0" cy="2" rx="20" ry="15" fill="#A33D52" transform="rotate(-24)" />
        <ellipse cx="0" cy="2" rx="20" ry="15" fill="#C45368" transform="rotate(28)" />
        <ellipse cx="0" cy="1" rx="18" ry="14" fill="#D97888" transform="rotate(78)" />
        <ellipse cx="0" cy="1" rx="18" ry="14" fill="#E7A0AC" transform="rotate(-62)" />
        <ellipse cx="0" cy="1" rx="11" ry="8.5" fill="#F6D5DB" />
        <path d="M0 6C-4 2-8 1-8-2c0-3 3-4 5-2 1-3 4-5 6-2 2-2 6-1 6 2 0 4-5 6-9 4z" fill="#9E3048" />
        <ellipse cx="-6" cy="-6" rx="4" ry="2.2" fill="#fff" opacity="0.55" transform="rotate(-32)" />
      </g>
    </svg>
  );
}

function Ribbon() {
  const tailL = "M54 68 18 154 42 144 64 72Z";
  const tailR = "M96 68 132 154 108 144 86 72Z";
  const loop = "M75 70C50 68 30 54 34 34 37 16 54 12 66 28 62 12 70 4 75 12 80 4 88 12 84 28 96 12 113 16 116 34 120 54 100 68 75 70Z";
  return (
    <svg className="emblem emblem-ribbon" viewBox="0 0 150 164" aria-hidden="true">
      <path d={tailL} fill="rgba(14,34,68,0.2)" transform="translate(2 3)" />
      <path d={tailR} fill="rgba(14,34,68,0.2)" transform="translate(2 3)" />
      <defs>
        <clipPath id="memorial-left">
          <path d={tailL} />
        </clipPath>
        <clipPath id="memorial-right">
          <path d={tailR} />
        </clipPath>
        <clipPath id="memorial-loop">
          <path d={loop} />
        </clipPath>
      </defs>
      <g clipPath="url(#memorial-left)">
        {Array.from({ length: 12 }, (_, i) => (
          <rect key={i} x="0" y={64 + i * 8} width="80" height="8" fill={i % 2 === 0 ? RED : "#fff"} />
        ))}
      </g>
      <g clipPath="url(#memorial-right)">
        {Array.from({ length: 12 }, (_, i) => (
          <rect key={i} x="70" y={64 + i * 8} width="80" height="8" fill={i % 2 === 0 ? "#fff" : RED} />
        ))}
      </g>
      <path d={loop} fill={NAVY} />
      <g clipPath="url(#memorial-loop)">
        {[
          [58, 30],
          [75, 24],
          [92, 30],
          [66, 42],
          [84, 42],
          [75, 52],
        ].map(([x, y]) => (
          <Star key={`${x}-${y}`} x={x!} y={y!} r={3.1} fill="#fff" />
        ))}
      </g>
      <path d={tailL} fill="none" stroke="#fff" strokeWidth="1.6" strokeLinejoin="round" />
      <path d={tailR} fill="none" stroke="#fff" strokeWidth="1.6" strokeLinejoin="round" />
      <path d={loop} fill="none" stroke="#fff" strokeWidth="1.8" />
      <path d="M64 66h22l-4 10H68z" fill={NAVY} stroke="#fff" strokeWidth="1" />
    </svg>
  );
}

function TieMark() {
  const blade = "M30 40h30l10 22L45 124 20 62 30 40Z";
  return (
    <svg className="emblem emblem-tie" viewBox="0 0 90 132" aria-hidden="true">
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
    </svg>
  );
}

function PumpkinMark() {
  return (
    <svg className="emblem emblem-pumpkin" viewBox="0 0 120 104" aria-hidden="true">
      <ellipse cx="60" cy="96" rx="26" ry="4" fill="rgba(20,12,8,0.22)" />
      <ellipse cx="32" cy="60" rx="20" ry="30" fill="#C45A16" />
      <ellipse cx="88" cy="60" rx="20" ry="30" fill="#C45A16" />
      <ellipse cx="46" cy="58" rx="22" ry="34" fill="#E07A28" />
      <ellipse cx="74" cy="58" rx="22" ry="34" fill="#D86A20" />
      <ellipse cx="60" cy="56" rx="20" ry="36" fill="#F0943A" />
      <path d="M46 30c1 18 1 36 0 52M74 30c-1 18-1 36 0 52" stroke="#9A4012" strokeWidth="1.6" fill="none" opacity="0.75" />
      <ellipse cx="50" cy="44" rx="7" ry="12" fill="#fff" opacity="0.2" />
      <path d="M60 30c2-14 12-18 18-12-8 0-14 6-15 14" fill="#5C3A16" />
      <path d="M62 28c2-8 8-12 12-9" stroke="#8A6230" strokeWidth="1.3" fill="none" strokeLinecap="round" />
      <path d="M40 50l12 9-12 8z" fill="#FFE7A0" />
      <path d="M80 50l-12 9 12 8z" fill="#FFE7A0" />
      <path d="M38 76c6 8 14 12 22 12s16-4 22-12c-6 5-14 8-22 8s-16-3-22-8z" fill="#FFE7A0" />
      <path d="M40 50l12 9-12 8zM80 50l-12 9 12 8z" fill="none" stroke="#9A4012" strokeWidth="1" />
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
    <svg className="emblem emblem-tree" viewBox="0 0 96 112" aria-hidden="true">
      <Star x={48} y={12} r={8} fill="#E8C872" />
      <path d="M48 20 66 42H30Z" fill="#1F6B45" />
      <path d="M48 34 72 62H24Z" fill="#18573A" />
      <path d="M48 50 80 86H16Z" fill="#14352A" />
      <path d="M48 22 58 40H48Z" fill="#2E8B57" opacity="0.85" />
      <rect x="42" y="86" width="12" height="12" rx="1.5" fill="#6B3A24" />
      <circle cx="40" cy="58" r="3.3" fill="#C8102E" />
      <circle cx="56" cy="70" r="3.3" fill="#E8C872" />
      <circle cx="36" cy="76" r="3.1" fill="#F4EFE4" />
      <circle cx="58" cy="50" r="2.8" fill="#C8102E" />
      <circle cx="41.1" cy="56.8" r="1" fill="#fff" opacity="0.7" />
      <circle cx="57.1" cy="68.8" r="1" fill="#fff" opacity="0.7" />
    </svg>
  );
}