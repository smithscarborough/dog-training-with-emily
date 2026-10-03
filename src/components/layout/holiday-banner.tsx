import type { Holiday, HolidayId } from "@/lib/holidays";

const CREAM = "#f4efe4";
const INK = "#24140e";

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

export function HolidayBanner({ holiday }: { holiday: Holiday }) {
  const theme = THEME[holiday.id];
  return (
    <aside
      className={`holiday-banner is-${holiday.id}`}
      style={{ background: theme.bg, color: theme.fg, ["--holiday-bg" as string]: theme.bg }}
      aria-label={holiday.name}
    >
      <svg className="holiday-banner-svg" viewBox="0 0 1440 48" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <defs>
          <pattern id={`hol-${holiday.id}`} width={tileWidth(holiday.id)} height="48" patternUnits="userSpaceOnUse">
            <Tile id={holiday.id} />
          </pattern>
        </defs>
        <rect width="1440" height="48" fill={`url(#hol-${holiday.id})`} />
      </svg>
      <p className="relative z-[1] mx-auto max-w-3xl px-6 py-3 text-center text-sm leading-relaxed sm:text-base">{holiday.line}</p>
    </aside>
  );
}

function tileWidth(id: HolidayId) {
  if (id === "fathers") return 28;
  if (id === "christmas") return 36;
  if (id === "easter") return 132;
  if (id === "memorial") return 180;
  if (id === "july4") return 64;
  return 96;
}

function star(cx: number, cy: number, r: number, fill: string) {
  const points = Array.from({ length: 8 }, (_, i) => {
    const angle = (Math.PI / 4) * i - Math.PI / 2;
    const radius = i % 2 === 0 ? r : r * 0.4;
    return `${cx + Math.cos(angle) * radius},${cy + Math.sin(angle) * radius}`;
  }).join(" ");
  return <polygon points={points} fill={fill} />;
}

function Tile({ id }: { id: HolidayId }) {
  if (id === "new-year") {
    return (
      <>
        {star(18, 16, 5, "#D4B483")}
        {star(62, 34, 3.2, "#F4EFE4")}
        <circle cx="78" cy="14" r="1.3" fill="#D4B483" />
      </>
    );
  }
  if (id === "valentine") {
    return (
      <>
        <Heart x={22} y={24} s={0.55} fill="#F4EFE4" />
        <Heart x={70} y={24} s={0.38} fill="#C46B7C" />
      </>
    );
  }
  if (id === "patrick") {
    return (
      <>
        <Clover x={24} y={24} />
        <Clover x={72} y={24} small />
      </>
    );
  }
  if (id === "easter") {
    return (
      <>
        <Egg x={22} fill="#F7FBF6" mark="#7FA184" />
        <Egg x={66} fill="#F3D6C8" mark="#7A3144" />
        <Egg x={110} fill="#F7FBF6" mark="#24140e" />
      </>
    );
  }
  if (id === "mothers") {
    return (
      <>
        <Blossom x={24} y={24} />
        <Blossom x={72} y={24} small />
      </>
    );
  }
  if (id === "memorial") {
    return star(24, 24, 6, "#E7E2D4");
  }
  if (id === "fathers") {
    return (
      <>
        <line x1="6" y1="0" x2="6" y2="48" stroke="#F4EFE4" strokeWidth="1" opacity="0.28" />
        <line x1="16" y1="0" x2="16" y2="48" stroke="#F4EFE4" strokeWidth="2.4" opacity="0.16" />
      </>
    );
  }
  if (id === "july4") {
    return (
      <>
        <path d="M18 0l8 12H10Z" fill="#F4EFE4" />
        <path d="M46 0l8 12H38Z" fill="#8C3E3A" />
        {star(32, 32, 4.5, "#F4EFE4")}
      </>
    );
  }
  if (id === "halloween") {
    return (
      <>
        <path fill="#E4C27A" d="M22 14a10 10 0 1 0 0 20 7.5 7.5 0 1 1 0-20Z" />
        <Bat x={68} y={24} />
      </>
    );
  }
  if (id === "thanksgiving") {
    return (
      <>
        <Leaf x={20} y={24} />
        <Leaf x={68} y={24} />
      </>
    );
  }
  return (
    <>
      <path d="M18 24l6-10 6 10-6 10Z" fill="#F4EFE4" opacity="0.9" />
      <circle cx="8" cy="24" r="2.2" fill="#C45C5C" />
      <circle cx="34" cy="12" r="1.6" fill="#C45C5C" />
      <circle cx="34" cy="36" r="1.6" fill="#F4EFE4" />
    </>
  );
}

function Heart({ x, y, s, fill }: { x: number; y: number; s: number; fill: string }) {
  return <path fill={fill} transform={`translate(${x} ${y}) scale(${s})`} d="M0 6C0 6-12-1-12-10a7 7 0 0 1 12 2 7 7 0 0 1 12-2C12-1 0 6 0 6Z" />;
}

function Clover({ x, y, small }: { x: number; y: number; small?: boolean }) {
  const r = small ? 4 : 5.5;
  return (
    <g transform={`translate(${x} ${y})`} fill="#3D9A6E">
      <circle cx="0" cy={-r} r={r} />
      <circle cx={-r} cy={r * 0.35} r={r} />
      <circle cx={r} cy={r * 0.35} r={r} />
    </g>
  );
}

function Egg({ x, fill, mark }: { x: number; fill: string; mark: string }) {
  return (
    <g transform={`translate(${x} 24)`}>
      <ellipse cx="0" cy="0" rx="10" ry="14" fill={fill} />
      <path d="M-9 1h18v4H-9Z" fill={mark} />
    </g>
  );
}

function Blossom({ x, y, small }: { x: number; y: number; small?: boolean }) {
  const r = small ? 3.2 : 4.4;
  return (
    <g transform={`translate(${x} ${y})`} fill="#C48B96">
      <circle cx="0" cy={-r} r={r} />
      <circle cx={r} cy="0" r={r} />
      <circle cx="0" cy={r} r={r} />
      <circle cx={-r} cy="0" r={r} />
      <circle cx="0" cy="0" r={small ? 1.6 : 2} fill="#8E5360" />
    </g>
  );
}

function Bat({ x, y }: { x: number; y: number }) {
  return (
    <path
      fill="#F4EFE4"
      transform={`translate(${x} ${y}) scale(0.7)`}
      d="M0 2C4-1 7 1 10 0c1 4 4 5 7 4-2 1-3 4-2 6-3-2-5-2-8 0-3-2-5-2-8 0 1-2 0-5-2-6 3 1 6 0 7-4C-3 1-4-1 0 2Z"
    />
  );
}

function Leaf({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d="M0 14C12 8 16-2 14-12 6-4 2 6 0 14Z" fill="#F4EFE4" />
      <path d="M2 10C8 4 12-2 12-8" stroke="#7A4A2A" strokeWidth="0.8" fill="none" />
    </g>
  );
}
