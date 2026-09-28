import { useEffect, useMemo, useState } from "react";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { GOALS, SESSION_TYPES, dollars, parseGoalIds, sessionTypeById } from "@/lib/catalog";
import { listCheckins } from "@/lib/server/checkins";
import { listInquiries } from "@/lib/server/inquiries";
import { listSessions } from "@/lib/server/sessions";
import type { CheckinRow, DogRow, InquiryRow, SessionRow } from "@/lib/types";

function chicagoMonth(iso: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(new Date(iso));
  const year = parts.find((part) => part.type === "year")?.value ?? "";
  const month = parts.find((part) => part.type === "month")?.value ?? "";
  return `${year}-${month}`;
}

function chicagoDay(iso: string) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Chicago" }).format(new Date(iso));
}

function monthName() {
  return new Intl.DateTimeFormat("en-US", { timeZone: "America/Chicago", month: "long" }).format(new Date());
}

function formatHours(minutes: number) {
  if (minutes <= 0) return "0";
  const hours = minutes / 60;
  if (hours < 10 && hours % 1 !== 0) return hours.toFixed(1);
  return String(Math.round(hours));
}

function Stat({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <Card>
      <CardBody className="space-y-2">
        <p className="text-sm font-bold text-[#1a0e0a]">{label}</p>
        <p className="font-display text-4xl tracking-tight tabular-nums text-ink">{value}</p>
        <p className="text-sm leading-relaxed text-muted">{note}</p>
      </CardBody>
    </Card>
  );
}

function Bars({
  title,
  hint,
  rows,
  empty,
}: {
  title: string;
  hint: string;
  rows: { label: string; count: number }[];
  empty: string;
}) {
  const max = Math.max(1, ...rows.map((row) => row.count));
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardBody>
        <p className="text-sm leading-relaxed text-muted">{hint}</p>
        {rows.length === 0 ? (
          <p className="mt-5 text-sm text-muted">{empty}</p>
        ) : (
          <ul className="mt-5 space-y-4">
            {rows.map((row) => (
              <li key={row.label}>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-sm font-medium text-ink">{row.label}</span>
                  <span className="text-sm tabular-nums text-muted">{row.count}</span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink/10">
                  <div
                    className="h-full rounded-full bg-ink"
                    style={{ width: `${Math.max(6, (row.count / max) * 100)}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}

export function Overview({ dogs }: { dogs: DogRow[] }) {
  const [sessions, setSessions] = useState<SessionRow[] | null>(null);
  const [inquiries, setInquiries] = useState<InquiryRow[] | null>(null);
  const [checkins, setCheckins] = useState<CheckinRow[] | null>(null);

  useEffect(() => {
    void listSessions({ data: {} }).then(setSessions).catch(() => setSessions([]));
    void listInquiries().then(setInquiries).catch(() => setInquiries([]));
    void listCheckins({ data: { limit: 40 } }).then(setCheckins).catch(() => setCheckins([]));
  }, []);

  const month = monthName();
  const thisMonth = chicagoMonth(new Date().toISOString());
  const today = chicagoDay(new Date().toISOString());

  const counts = useMemo(() => {
    const byStatus = { pending: 0, active: 0, paused: 0, archived: 0 };
    let credits = 0;
    let joined = 0;
    const goals = new Map<string, number>();
    const referrals = new Map<string, { label: string; count: number }>();
    for (const dog of dogs) {
      byStatus[dog.status] += 1;
      credits += dog.credits || 0;
      if (dog.created_at && chicagoMonth(dog.created_at) === thisMonth) joined += 1;
      for (const id of parseGoalIds(dog.goals_json)) {
        goals.set(id, (goals.get(id) ?? 0) + 1);
      }
      const source = dog.referral_source.trim();
      if (source) {
        const key = source.toLowerCase();
        const row = referrals.get(key) ?? { label: source, count: 0 };
        row.count += 1;
        referrals.set(key, row);
      }
    }
    return { byStatus, credits, joined, goals, referrals };
  }, [dogs, thisMonth]);

  const booked = (sessions ?? []).filter((session) => session.status !== "cancelled");
  const completed = (sessions ?? []).filter((session) => session.status === "completed");
  const completedMonth = completed.filter((session) => chicagoMonth(session.scheduled_at) === thisMonth);
  const upcoming = (sessions ?? []).filter(
    (session) => session.status === "confirmed" && chicagoDay(session.scheduled_at) >= today,
  );
  const requested = (sessions ?? []).filter((session) => session.status === "requested");
  const cancelled = (sessions ?? []).filter((session) => session.status === "cancelled").length;
  const listedMonth = completedMonth.reduce((sum, session) => sum + sessionTypeById(session.session_type).price, 0);
  const listedAhead = upcoming.reduce((sum, session) => sum + sessionTypeById(session.session_type).price, 0);
  const taught = completed.reduce((sum, session) => sum + (session.duration_min || 0), 0);
  const ready = sessions !== null;

  const typeRows = SESSION_TYPES.map((type) => ({
    label: type.name,
    count: booked.filter((session) => session.session_type === type.id).length,
  }))
    .filter((row) => row.count > 0)
    .sort((a, b) => b.count - a.count);

  const goalRows = [...counts.goals.entries()]
    .map(([id, count]) => ({
      label: GOALS.find((goal) => goal.id === id)?.label ?? id,
      count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  const referralRows = [...counts.referrals.values()].sort((a, b) => b.count - a.count).slice(0, 6);
  const stuck = (checkins ?? []).filter((row) => row.status === "stuck").length;
  const inactive = dogs.length - counts.byStatus.active;

  const ledger = [
    ["Pending", String(counts.byStatus.pending), "Not active yet"],
    ["Upcoming", ready ? String(upcoming.length) : "—", ready && listedAhead ? `${dollars(listedAhead)} listed` : "Confirmed, still ahead"],
    ["Requests", ready ? String(requested.length) : "—", "Waiting on a yes"],
    ["Hours taught", ready ? formatHours(taught) : "—", "Completed, all time"],
    ["New this month", String(counts.joined), month],
    ["Credits on file", String(counts.credits), "Still unused"],
    ["Inbox", inquiries ? String(inquiries.length) : "—", "Contact notes"],
    ["Cancelled", ready ? String(cancelled) : "—", "Sessions called off"],
  ];
  if (stuck > 0) ledger.push(["Stuck lately", String(stuck), "Latest check-ins"]);

  return (
    <div className="space-y-8">
      <div className="max-w-2xl">
        <h2 className="font-display text-3xl tracking-tight">Overview</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          A read of the practice. Dollar figures are menu rates for completed sessions, not money received.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Active clients" value={String(counts.byStatus.active)} note="Training right now" />
        <Stat
          label="All-time clients"
          value={String(dogs.length)}
          note={inactive === 0 ? "All of them are active." : `${inactive} not active right now.`}
        />
        <Stat
          label={`${month} sessions`}
          value={ready ? String(completedMonth.length) : "—"}
          note="Marked completed"
        />
        <Stat
          label={`${month}, listed`}
          value={ready ? dollars(listedMonth) : "—"}
          note="At menu rates, not payments"
        />
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-2">
        <Bars
          title="Most requested"
          hint="Session types people have asked for. Cancelled visits are left out."
          rows={ready ? typeRows : []}
          empty={ready ? "No sessions on the books yet." : "Loading sessions…"}
        />
        <Bars
          title="What they come in for"
          hint="Goals marked on a client file. One household can count toward more than one."
          rows={goalRows}
          empty="No goals on file yet."
        />
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-2">
        <Bars
          title="Where they heard of you"
          hint="Taken from the referral note on each file."
          rows={referralRows}
          empty="No referral notes yet."
        />
        <Card className="h-full">
          <CardHeader>
            <CardTitle>Right now</CardTitle>
          </CardHeader>
          <CardBody>
            <p className="text-sm leading-relaxed text-muted">The smaller numbers that still change how the week goes.</p>
            <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-5">
              {ledger.map(([label, value, note]) => (
                <div key={label}>
                  <dt className="text-sm font-bold text-[#1a0e0a]">{label}</dt>
                  <dd className="mt-1 font-display text-2xl tracking-tight tabular-nums text-ink">{value}</dd>
                  <p className="mt-1 text-xs leading-relaxed text-muted">{note}</p>
                </div>
              ))}
            </dl>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
