import type { Holiday, HolidayId } from "@/lib/holidays";

const INK = "#24140e";
const CREAM = "#f4efe4";

const THEME: Record<HolidayId, { bg: string; fg: string }> = {
  "new-year": { bg: "#24140e", fg: CREAM },
  valentine: { bg: "#7A3144", fg: CREAM },
  patrick: { bg: "#12382C", fg: "#F3F7F2" },
  easter: { bg: "#E5F0E6", fg: INK },
  mothers: { bg: "#F6EBE8", fg: INK },
  memorial: { bg: "#1E2A3A", fg: CREAM },
  fathers: { bg: "#3C3028", fg: CREAM },
  july4: { bg: "#1A2740", fg: CREAM },
  halloween: { bg: "#1C1410", fg: CREAM },
  thanksgiving: { bg: "#7A4A2A", fg: CREAM },
  christmas: { bg: "#14352A", fg: CREAM },
};

function star(cx: number, cy: number, r: number, fill: string, twinkle = false) {
  const points = Array.from({ length: 8 }, (_, i) => {
    const angle = (Math.PI / 4) * i - Math.PI / 2;
    const radius = i % 2 === 0 ? r : r * 0.38;
    return `${cx + Math.cos(angle) * radius},${cy + Math.sin(angle) * radius}`;
  }).join(" ");
  return <polygon key={`${cx}-${cy}`} points={points} fill={fill} className={twinkle ? "holiday-twinkle" : undefined} />;
}

function heart(cx: number, cy: number, s: number, fill: string) {
  return (
    <path
      key={`${cx}-${cy}-${s}`}
      fill={fill}
      transform={`translate(${cx} ${cy}) scale(${s})`}
      d="M0 8C0 8-16-2-16-14A9 9 0 0 1 0-10 9 9 0 0 1 16-14C16-2 0 8 0 8Z"
    />
  );
}

export function HolidayBanner({ holiday }: { holiday: Holiday }) {
  const theme = THEME[holiday.id];
  return (
    <aside className="holiday-banner" style={{ background: theme.bg, color: theme.fg }} aria-label={holiday.name}>
      <svg className="holiday-banner-svg" viewBox="0 0 1440 160" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <Scene id={holiday.id} />
      </svg>
      <p>{holiday.line}</p>
    </aside>
  );
}

function Scene({ id }: { id: HolidayId }) {
  if (id === "new-year") {
    const gold = "#D4B483";
    return (
      <>
        {star(70, 36, 16, gold, true)}
        {star(150, 110, 9, gold)}
        {star(230, 48, 6, gold)}
        {star(300, 120, 11, "#F4EFE4")}
        {star(40, 120, 5, gold)}
        {star(190, 78, 4, gold, true)}
        {star(1180, 40, 18, gold)}
        {star(1280, 112, 10, gold, true)}
        {star(1360, 50, 7, "#F4EFE4")}
        {star(1100, 118, 8, gold)}
        {star(1390, 120, 5, gold)}
        {star(1230, 70, 4, gold)}
        <circle cx="260" cy="90" r="2" fill={gold} />
        <circle cx="1120" cy="46" r="2" fill={gold} />
      </>
    );
  }
  if (id === "valentine") {
    return (
      <>
        {heart(80, 70, 1.7, "#F4EFE4")}
        {heart(190, 110, 1.1, "#C46B7C")}
        {heart(250, 46, 0.7, "#F4EFE4")}
        {heart(40, 130, 0.85, "#C46B7C")}
        {heart(1360, 64, 1.8, "#F4EFE4")}
        {heart(1240, 118, 1, "#C46B7C")}
        {heart(1160, 42, 0.75, "#F4EFE4")}
        {heart(1400, 130, 0.8, "#C46B7C")}
        <path d="M0 142c80-16 140-16 220 0s140 16 220 0" fill="none" stroke="#F4EFE4" strokeWidth="1.4" opacity="0.55" />
        <path d="M1000 142c80-16 140-16 220 0s140 16 220 0" fill="none" stroke="#F4EFE4" strokeWidth="1.4" opacity="0.55" />
      </>
    );
  }
  if (id === "patrick") {
    return (
      <>
        <Shamrock x={90} y={78} s={1.5} />
        <Shamrock x={230} y={118} s={0.85} />
        <Shamrock x={40} y={30} s={0.7} />
        <Shamrock x={1320} y={74} s={1.45} />
        <Shamrock x={1180} y={120} s={0.8} />
        <Shamrock x={1400} y={36} s={0.65} />
      </>
    );
  }
  if (id === "easter") {
    return (
      <>
        <Egg x={28} y={124} fill="#F7FBF6" band="#7FA184" />
        <Egg x={100} y={132} fill="#F3D6C8" band="#24140e" dots />
        <Egg x={172} y={120} fill="#F7FBF6" stripe="#7FA184" />
        <Egg x={244} y={136} fill="#C9DDCC" band="#F7FBF6" />
        <Egg x={1196} y={126} fill="#F3D6C8" stripe="#7A3144" />
        <Egg x={1268} y={134} fill="#F7FBF6" band="#7FA184" dots />
        <Egg x={1340} y={120} fill="#C9DDCC" band="#24140e" />
        <Egg x={1408} y={132} fill="#F7FBF6" stripe="#7FA184" />
        <Blossom x={70} y={28} />
        <Blossom x={210} y={22} />
        <Blossom x={1340} y={26} />
        <Blossom x={1200} y={34} />
      </>
    );
  }
  if (id === "mothers") {
    return (
      <>
        <Spray flip={false} />
        <Spray flip />
      </>
    );
  }
  if (id === "memorial") {
    return (
      <>
        {star(92, 80, 22, "#E7E2D4")}
        <rect x="0" y="152" width="1440" height="3" fill="#8C3E3A" />
      </>
    );
  }
  if (id === "fathers") {
    return (
      <>
        {Array.from({ length: 18 }, (_, i) => (
          <line key={i} x1={i * 16} y1="0" x2={i * 16 + 40} y2="160" stroke="#F4EFE4" strokeWidth="1" opacity="0.16" />
        ))}
        {Array.from({ length: 18 }, (_, i) => (
          <line key={`r${i}`} x1={1160 + i * 16} y1="0" x2={1120 + i * 16} y2="160" stroke="#F4EFE4" strokeWidth="1" opacity="0.16" />
        ))}
        <path fill="#F4EFE4" d="M78 8h36l6 18H72L78 8Zm-6 18h48l-8 22-16 92-16-92-8-22Z" />
        <path d="M90 52h24" stroke="#3C3028" strokeWidth="2" />
      </>
    );
  }
  if (id === "july4") {
    const flags = [28, 64, 100, 136, 172, 208, 244, 1188, 1224, 1260, 1296, 1332, 1368, 1404];
    return (
      <>
        {flags.map((x, i) => (
          <path key={x} d={`M${x} 0l14 22H${x - 14}Z`} fill={i % 2 === 0 ? "#8C3E3A" : "#F4EFE4"} />
        ))}
        {star(80, 108, 8, "#F4EFE4")}
        {star(160, 92, 5, "#F4EFE4")}
        {star(230, 120, 6, "#F4EFE4")}
        {star(1280, 108, 8, "#F4EFE4")}
        {star(1360, 90, 5, "#F4EFE4")}
        {star(1200, 122, 6, "#F4EFE4")}
      </>
    );
  }
  if (id === "halloween") {
    return (
      <>
        <circle cx="1288" cy="18" r="74" fill="#E4C27A" />
        <circle cx="1320" cy="8" r="62" fill="#1C1410" />
        <Pumpkin x={70} />
        <Pumpkin x={210} small />
        <Bat x={40} y={36} s={1} />
        <g className="holiday-drift">
          <Bat x={180} y={24} s={0.62} />
        </g>
        <Bat x={1180} y={108} s={0.7} />
        <Bat x={1380} y={90} s={0.45} />
      </>
    );
  }
  if (id === "thanksgiving") {
    return (
      <>
        <Wheat x={40} />
        <Wheat x={110} />
        <Wheat x={180} />
        <Wheat x={1240} />
        <Wheat x={1310} />
        <Wheat x={1380} />
        <Leaf x={260} y={36} />
        <Leaf x={1140} y={48} />
      </>
    );
  }
  return (
    <>
      <Holly />
      <g transform="translate(1440 0) scale(-1 1)">
        <Holly />
      </g>
      {star(250, 36, 5, "#F4EFE4", true)}
      {star(1180, 32, 5, "#F4EFE4")}
      {star(80, 28, 3, "#F4EFE4")}
    </>
  );
}

function Shamrock({ x, y, s }: { x: number; y: number; s: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <circle cx="0" cy="-16" r="14" fill="#2F8A62" />
      <circle cx="-16" cy="2" r="14" fill="#1F6B45" />
      <circle cx="16" cy="2" r="14" fill="#1F6B45" />
      <path d="M0 0v28" stroke="#0C241C" strokeWidth="3" strokeLinecap="round" />
    </g>
  );
}

function Egg({
  x,
  y,
  fill,
  band,
  stripe,
  dots,
}: {
  x: number;
  y: number;
  fill: string;
  band?: string;
  stripe?: string;
  dots?: boolean;
}) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <defs>
        <clipPath id={`egg-${x}-${y}`}>
          <ellipse cx="0" cy="0" rx="27" ry="35" />
        </clipPath>
      </defs>
      <ellipse cx="0" cy="0" rx="28" ry="36" fill={fill} stroke={INK} strokeWidth="1.6" />
      <g clipPath={`url(#egg-${x}-${y})`}>
        {band ? <path d="M-26 2h52c-1 8-6 14-12 18H-14C-20 16-25 10-26 2Z" fill={band} /> : null}
        {stripe ? (
          <>
            <path d="M-10 -40v80" stroke={stripe} strokeWidth="3" />
            <path d="M4 -40v80" stroke={stripe} strokeWidth="3" />
          </>
        ) : null}
        {dots ? (
          <>
            <circle cx="-8" cy="-12" r="2.2" fill={INK} />
            <circle cx="6" cy="-6" r="2.2" fill={INK} />
            <circle cx="-2" cy="8" r="2.2" fill={INK} />
          </>
        ) : null}
      </g>
    </g>
  );
}

function Blossom({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`} fill="#E7B7AE">
      <circle cx="0" cy="-7" r="5" />
      <circle cx="7" cy="0" r="5" />
      <circle cx="0" cy="7" r="5" />
      <circle cx="-7" cy="0" r="5" />
      <circle cx="0" cy="0" r="3" fill="#24140e" />
    </g>
  );
}

function Spray({ flip }: { flip: boolean }) {
  const rose = "#8E5360";
  const leaf = "#6B5344";
  return (
    <g transform={flip ? "translate(1440 0) scale(-1 1)" : undefined}>
      <path d="M20 150C80 120 90 80 70 40" fill="none" stroke={leaf} strokeWidth="2" />
      <ellipse cx="58" cy="78" rx="16" ry="7" fill={leaf} transform="rotate(-30 58 78)" />
      <ellipse cx="86" cy="96" rx="14" ry="6" fill={leaf} transform="rotate(24 86 96)" />
      <circle cx="78" cy="46" r="10" fill={rose} />
      <circle cx="92" cy="58" r="9" fill="#A86B76" />
      <circle cx="66" cy="60" r="8" fill={rose} />
      <circle cx="80" cy="68" r="7" fill="#C48B96" />
      <circle cx="150" cy="34" r="8" fill={rose} />
      <circle cx="162" cy="46" r="7" fill="#A86B76" />
      <circle cx="140" cy="48" r="6" fill="#C48B96" />
      <path d="M120 150c20-30 28-50 24-78" fill="none" stroke={leaf} strokeWidth="1.6" />
    </g>
  );
}

function Bat({ x, y, s }: { x: number; y: number; s: number }) {
  return (
    <path
      fill="#F4EFE4"
      transform={`translate(${x} ${y}) scale(${s})`}
      d="M0 8C8 2 14 6 20 4c2 8 8 10 14 8-4 2-6 8-4 12-6-4-10-4-16-1-6-3-10-3-16 1 2-4 0-10-4-12 6 2 12 0 14-8C-6 6-8 2 0 8Z"
    />
  );
}

function Pumpkin({ x, small }: { x: number; small?: boolean }) {
  const s = small ? 0.72 : 1;
  return (
    <g transform={`translate(${x} 118) scale(${s})`}>
      <ellipse cx="0" cy="0" rx="34" ry="26" fill="#E08A3C" />
      <ellipse cx="-16" cy="2" rx="16" ry="24" fill="#C56E28" />
      <ellipse cx="16" cy="2" rx="16" ry="24" fill="#C56E28" />
      <path d="M-2 -24c6-10 14-12 16-8-6 2-10 8-10 14" fill="#5C3A16" />
    </g>
  );
}

function Wheat({ x }: { x: number }) {
  return (
    <g transform={`translate(${x} 20)`}>
      <path d="M18 140C18 90 8 60 18 10" fill="none" stroke="#F4EFE4" strokeWidth="1.6" />
      {Array.from({ length: 7 }, (_, i) => (
        <ellipse key={i} cx={i % 2 === 0 ? 10 : 26} cy={28 + i * 12} rx="7" ry="4" fill="#F4EFE4" transform={`rotate(${i % 2 === 0 ? -28 : 28} ${i % 2 === 0 ? 10 : 26} ${28 + i * 12})`} />
      ))}
    </g>
  );
}

function Leaf({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d="M0 28C18 20 28 8 30 0 18 6 6 16 0 28Z" fill="#E7C27A" />
      <path d="M4 24C14 16 22 8 26 2" stroke="#7A4A2A" strokeWidth="1" fill="none" />
    </g>
  );
}

function Holly() {
  return (
    <g>
      <path d="M40 130c40-10 70-36 80-70" fill="none" stroke="#1F6B4A" strokeWidth="3" />
      <path fill="#1F6B4A" d="M70 118c18-8 22-24 10-30-14 2-24 14-24 28 4 2 10 2 14 2Z" />
      <path fill="#176246" d="M108 96c16-12 16-28 2-32-12 6-18 20-12 32 4 2 8 1 10 0Z" />
      <path fill="#1F6B4A" d="M126 70c14-16 8-32-6-34-8 10-8 24 0 36 2 0 4 0 6-2Z" />
      <circle cx="86" cy="96" r="5" fill="#C45C5C" className="holiday-twinkle" />
      <circle cx="112" cy="78" r="4.5" fill="#C45C5C" />
      <circle cx="132" cy="58" r="4" fill="#C45C5C" />
    </g>
  );
}
