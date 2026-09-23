import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { DogAvatar } from "@/components/dogs/dog-avatar";
import { SiteFooter } from "@/components/layout/site-footer";
import { EspressoBanner } from "@/components/layout/espresso-banner";
import { PhaseLegend, PhaseMeter } from "@/components/progress/phase-meter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Field } from "@/components/ui/label";
import { Textarea } from "@/components/ui/input";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { SESSION_TYPES, SKILLS, TRICKS, CHECKINS, checkinById, dollars, sessionTypeById, phaseFor } from "@/lib/catalog";
import { formatWhen, statusTone, checkinTone } from "@/lib/format";
import { cancelOwnSession, listSessions, requestSession } from "@/lib/server/sessions";
import { getProgress } from "@/lib/server/progress";
import { updateDogPhoto } from "@/lib/server/dogs";
import { listCheckins, submitCheckin } from "@/lib/server/checkins";
import type { CheckinRow, DogRow, ProgressLogRow, ProgressRow, SessionRow } from "@/lib/types";
import { WhenPicker } from "@/components/portal/when-picker";
import { useMe } from "@/lib/use-me";
import { cn } from "@/lib/utils";

function PortalPending() {
  return (
    <div className="flex min-h-full flex-col">
      <div className="mx-auto max-w-5xl px-4 py-16">
        <div className="h-10 w-56 animate-pulse rounded bg-surface-2" />
      </div>
    </div>
  );
}

export const Route = createFileRoute("/portal")({
  pendingMs: 0,
  pendingMinMs: 0,
  pendingComponent: PortalPending,
  component: PortalPage,
});

function PortalPage() {
  const { user, isPending } = useCurrentUserState();
  const { me, loading, refresh } = useMe();

  if (loading || (isPending && !me)) {
    return (
      <div className="flex min-h-full flex-col">
        <div className="mx-auto max-w-5xl px-4 py-16">
          <div className="h-10 w-56 animate-pulse rounded bg-surface-2" />
        </div>
      </div>
    );
  }
  if (!user && !isPending) return <RedirectToSignIn />;

  if (me?.isTrainer) {
    return (
      <div className="flex min-h-full flex-col">
        <main className="mx-auto max-w-lg px-4 py-16 text-center">
          <h1 className="font-display text-4xl">This is the client portal.</h1>
          <p className="mt-3 text-muted">You run the studio — progress lives over there.</p>
          <Button className="mt-6" asChild>
            <Link to="/studio">Open studio</Link>
          </Button>
        </main>
        <SiteFooter />
      </div>
    );
  }

  if (!me?.dogs.length) {
    return (
      <div className="flex min-h-full flex-col">
        <main className="mx-auto max-w-lg px-4 py-16">
          <h1 className="font-display text-4xl">No dog on file yet.</h1>
          <p className="mt-3 text-muted leading-relaxed">
            Start with intake so we know the household, the history, and what
            "better" looks like.
          </p>
          <Button className="mt-6" asChild>
            <Link to="/intake">Begin intake</Link>
          </Button>
        </main>
        <SiteFooter />
      </div>
    );
  }

  return <PortalApp dogs={me.dogs} onRefresh={() => void refresh()} />;
}

function PortalApp({ dogs, onRefresh }: { dogs: DogRow[]; onRefresh: () => void }) {
  const [dogId, setDogId] = useState(dogs[0]!.id);
  const dog = dogs.find((d) => d.id === dogId) ?? dogs[0]!;
  const [tab, setTab] = useState<"home" | "progress" | "sessions" | "profile">("home");
  const tabs = [
    { id: "home" as const, label: "Home" },
    { id: "progress" as const, label: "Progress" },
    { id: "sessions" as const, label: "Sessions" },
    { id: "profile" as const, label: "Profile" },
  ];

  return (
    <div className="flex min-h-full flex-col">
      <EspressoBanner kicker="Portal">
        Homework, a between-session check-in, and the 1–7 progress for your dog.
      </EspressoBanner>
      <main className="portal-type mx-auto max-w-5xl px-5 py-8 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <DogAvatar dog={dog} />
            <div>
              <h1 className="font-display text-4xl tracking-tight">{dog.name}</h1>
              <p className="text-base text-muted">
                {dog.breed || "Mixed"} · {dog.status}
              </p>
            </div>
          </div>
          {dogs.length > 1 ? (
            <select
              className="h-11 rounded-full border border-line bg-surface px-4 text-sm"
              value={dog.id}
              onChange={(e) => setDogId(Number(e.target.value))}
            >
              {dogs.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          ) : null}
        </div>

        <div className="mt-6 overflow-x-auto">
          <div className="portal-tabs inline-flex min-w-full gap-1 rounded-full bg-ink p-1.5">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                "h-11 flex-1 shrink-0 rounded-full px-5 text-base font-medium transition-colors duration-150",
                tab === t.id ? "bg-white text-ink" : "text-bg/80 hover:text-bg",
              )}
            >
              {t.label}
            </button>
          ))}
          </div>
        </div>

        <div className="mt-8">
          <div className={tab === "home" ? "" : "hidden"} hidden={tab !== "home"}>
            <HomeTab dog={dog} />
          </div>
          <div className={tab === "progress" ? "" : "hidden"} hidden={tab !== "progress"}>
            <ProgressTab dog={dog} />
          </div>
          <div className={tab === "sessions" ? "" : "hidden"} hidden={tab !== "sessions"}>
            <SessionsTab dog={dog} active={tab === "sessions"} />
          </div>
          <div className={tab === "profile" ? "" : "hidden"} hidden={tab !== "profile"}>
            <ProfileTab dog={dog} onRefresh={onRefresh} />
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function HomeTab({ dog }: { dog: DogRow }) {
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  useEffect(() => {
    void listSessions({ data: { dogId: dog.id } }).then(setSessions).catch(() => setSessions([]));
  }, [dog.id]);
  const upcoming = sessions.find((s) => s.status === "confirmed" || s.status === "requested");
  const lastDone = sessions.find((s) => s.status === "completed");
  const goals = (() => {
    try {
      return JSON.parse(dog.goals_json) as string[];
    } catch {
      return [];
    }
  })();

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <CheckinCard dog={dog} />
      <Card>
        <CardHeader>
          <CardTitle>Next on the calendar</CardTitle>
        </CardHeader>
        <CardBody>
          {upcoming ? (
            <div>
              <p className="font-display text-2xl">{sessionTypeById(upcoming.session_type).name}</p>
              <p className="mt-1 text-sm text-muted">{formatWhen(upcoming.scheduled_at)}</p>
              <Badge className="mt-3" tone={statusTone(upcoming.status)}>
                {upcoming.status}
              </Badge>
            </div>
          ) : (
            <p className="text-sm text-muted">No session on the books. Request one from the Sessions tab.</p>
          )}
        </CardBody>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Session credits</CardTitle>
        </CardHeader>
        <CardBody>
          <p className="font-display text-4xl tabular-nums">{dog.credits}</p>
          <p className="mt-2 text-sm text-muted">
            Held on your account after a series is purchased. One credit comes off when a session is completed.
          </p>
        </CardBody>
      </Card>
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Latest homework</CardTitle>
        </CardHeader>
        <CardBody>
          {lastDone?.homework ? (
            <div className="space-y-2">
              <p className="text-xs text-muted">{formatWhen(lastDone.scheduled_at)}</p>
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{lastDone.homework}</p>
              {lastDone.recap ? (
                <p className="whitespace-pre-wrap border-t border-line pt-3 text-sm text-muted">{lastDone.recap}</p>
              ) : null}
            </div>
          ) : (
            <p className="text-sm text-muted">Homework appears here after a session is wrapped.</p>
          )}
        </CardBody>
      </Card>
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Goals on file</CardTitle>
        </CardHeader>
        <CardBody>
          <div className="flex flex-wrap gap-2">
            {goals.length ? goals.map((g) => <Badge key={g}>{g.replace(/-/g, " ")}</Badge>) : <span className="text-sm text-muted">None listed yet.</span>}
          </div>
          {dog.goals_other ? <p className="mt-3 text-sm text-muted">{dog.goals_other}</p> : null}
        </CardBody>
      </Card>
    </div>
  );
}

function CheckinCard({ dog }: { dog: DogRow }) {
  const [status, setStatus] = useState<(typeof CHECKINS)[number]["id"] | "">("");
  const [note, setNote] = useState("");
  const [latest, setLatest] = useState<CheckinRow | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void listCheckins({ data: { dogId: dog.id, limit: 1 } })
      .then((rows) => {
        const row = rows[0] ?? null;
        setLatest(row);
        if (row && Date.now() - new Date(row.created_at).getTime() < 18 * 60 * 60 * 1000) {
          setStatus(row.status);
          setNote(row.note);
        } else {
          setStatus("");
          setNote("");
        }
      })
      .catch(() => setLatest(null));
  }, [dog.id]);

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle>How did homework go?</CardTitle>
      </CardHeader>
      <CardBody className="space-y-4">
        <p className="text-sm leading-relaxed text-muted">
          Use this after you work with your dog at home. Choose how practice
          went, add a note if you want, and send it. Emily will read this
          before the next session so she can pick up where you left off.
        </p>
        <p className="text-sm font-bold text-ink">Choose one</p>
        <div className="flex flex-wrap gap-2">
          {CHECKINS.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setStatus(c.id)}
              className={cn("chip-3d rounded-full px-3 py-2 text-sm", status === c.id && "is-on")}
            >
              {c.label}
            </button>
          ))}
        </div>
        {status ? (
          <p className="text-sm text-muted">{checkinById(status).hint}</p>
        ) : null}
        <Field label="Note for Emily (optional)">
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="What you tried, what went well, or where it fell apart…"
          />
        </Field>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            disabled={!status || busy}
            onClick={() => {
              if (!status) return;
              setBusy(true);
              void submitCheckin({ data: { dogId: dog.id, status, note } })
                .then((row) => {
                  setLatest(row);
                  toast.success("Sent. Emily will see this before the next session.");
                })
                .catch((err: unknown) =>
                  toast.error(err instanceof Error ? err.message : "Could not send."),
                )
                .finally(() => setBusy(false));
            }}
          >
            {busy ? "Sending…" : latest && Date.now() - new Date(latest.created_at).getTime() < 18 * 60 * 60 * 1000 ? "Update check-in" : "Send to Emily"}
          </Button>
          {latest ? (
            <span className="text-sm text-muted">
              Last:{" "}
              <Badge tone={checkinTone(latest.status)}>{checkinById(latest.status).label}</Badge>
              <span className="ml-2">{formatWhen(latest.updated_at || latest.created_at)}</span>
            </span>
          ) : null}
        </div>
      </CardBody>
    </Card>
  );
}

function ProgressTab({ dog }: { dog: DogRow }) {
  const [current, setCurrent] = useState<ProgressRow[]>([]);
  const [log, setLog] = useState<ProgressLogRow[]>([]);
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    void getProgress({ data: { dogId: dog.id } })
      .then((r) => {
        setCurrent(r.current);
        setLog(r.log);
      })
      .catch(() => {
        setCurrent([]);
        setLog([]);
      });
  }, [dog.id]);

  const byKey = useMemo(
    () => Object.fromEntries(current.map((p) => [p.skill_key, p])),
    [current],
  );
  const [filter, setFilter] = useState<"all" | "active" | "idle">("all");

  function filtered<T extends { key: string }>(items: T[]) {
    if (filter === "active") return items.filter((i) => (byKey[i.key]?.rating ?? 0) > 0);
    if (filter === "idle") return items.filter((i) => !(byKey[i.key]?.rating));
    return items;
  }

  const activeCount =
    TRICKS.concat(SKILLS).filter((i) => (byKey[i.key]?.rating ?? 0) > 0).length;

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>How we score</CardTitle>
        </CardHeader>
        <CardBody>
          <p className="max-w-2xl text-sm text-muted">
            Every trick and skill sits on a seven-phase ladder. Open one to see
            where {dog.name} is, and the last note from a session.
          </p>
          <div className="mt-5">
            <PhaseLegend />
          </div>
        </CardBody>
      </Card>
      <div className="flex flex-wrap gap-2">
        {(
          [
            ["all", "All"],
            ["active", `In progress (${activeCount})`],
            ["idle", "Not started"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setFilter(id)}
            className={cn("chip-3d rounded-full px-3 py-2 text-sm", filter === id && "is-on")}
          >
            {label}
          </button>
        ))}
      </div>
      <SkillGrid title="Tricks" items={filtered(TRICKS)} byKey={byKey} log={log} open={open} setOpen={setOpen} quietIdle={filter === "all"} />
      <SkillGrid title="Skills" items={filtered(SKILLS)} byKey={byKey} log={log} open={open} setOpen={setOpen} quietIdle={filter === "all"} />
    </div>
  );
}

function useMasonryCols() {
  const [cols, setCols] = useState(1);
  useEffect(() => {
    const sm = window.matchMedia("(min-width: 640px)");
    const lg = window.matchMedia("(min-width: 1024px)");
    const apply = () => setCols(lg.matches ? 3 : sm.matches ? 2 : 1);
    apply();
    sm.addEventListener("change", apply);
    lg.addEventListener("change", apply);
    return () => {
      sm.removeEventListener("change", apply);
      lg.removeEventListener("change", apply);
    };
  }, []);
  return cols;
}

function useIsMobileList() {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const apply = () => setMobile(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);
  return mobile;
}

function SkillGrid({
  title,
  items,
  byKey,
  log,
  open,
  setOpen,
  quietIdle = false,
}: {
  title: string;
  items: { key: string; name: string; summary: string }[];
  byKey: Record<string, ProgressRow>;
  log: ProgressLogRow[];
  open: string | null;
  setOpen: (k: string | null) => void;
  quietIdle?: boolean;
}) {
  const mobile = useIsMobileList();
  const cols = useMasonryCols();
  const columns = Array.from({ length: cols }, (_, col) =>
    items.filter((_, i) => i % cols === col),
  );

  function details(item: { key: string; summary: string }, showSummary = false) {
    const row = byKey[item.key];
    const history = log.filter((l) => l.skill_key === item.key).slice(0, 3);
    return (
      <div className="mt-3 border-t border-line pt-3">
        {showSummary ? <p className="text-sm text-muted">{item.summary}</p> : null}
        {row?.comment ? (
          <p className={cn("text-sm leading-relaxed", showSummary && "mt-2")}>{row.comment}</p>
        ) : (
          <p className={cn("text-sm text-muted", showSummary && "mt-2")}>No session note yet.</p>
        )}
        {history.length ? (
          <ul className="mt-3 space-y-1 text-xs text-muted">
            {history.map((h) => (
              <li key={h.id}>
                Phase {h.rating} · {formatWhen(h.created_at)}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    );
  }

  function card(item: { key: string; name: string; summary: string }) {
    const row = byKey[item.key];
    const rating = row?.rating ?? 0;
    const isOpen = open === item.key;
    const quiet = quietIdle && rating === 0 && !isOpen;
    return (
      <button
        key={item.key}
        type="button"
        onClick={() => setOpen(isOpen ? null : item.key)}
        className={cn(
          "w-full rounded-xl bg-pearl p-4 text-left transition-[transform,box-shadow,opacity,filter] duration-150 hairline",
          quiet && "skill-card-idle",
          isOpen && "ring-2 ring-accent/40",
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <p className="font-display text-lg font-semibold tracking-tight text-ink">{item.name}</p>
          <span className="tabular-nums text-xs text-muted">{rating || "—"}</span>
        </div>
        <p className="mt-1 text-xs text-muted">{item.summary}</p>
        <div className="mt-3">
          <PhaseMeter rating={rating} compact />
        </div>
        {isOpen ? details(item) : null}
      </button>
    );
  }

  return (
    <section>
      <h3 className="font-display text-2xl">{title}</h3>
      {items.length === 0 ? (
        <p className="mt-3 text-sm text-muted">Nothing in this view.</p>
      ) : mobile ? (
        <ul className="mt-4 divide-y divide-line overflow-hidden rounded-xl bg-pearl hairline">
          {items.map((item) => {
            const row = byKey[item.key];
            const rating = row?.rating ?? 0;
            const isOpen = open === item.key;
            const quiet = quietIdle && rating === 0 && !isOpen;
            return (
              <li key={item.key} className={cn(quiet && "skill-card-idle")}>
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : item.key)}
                  className="w-full px-4 py-3 text-left"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-display text-base font-semibold text-ink">{item.name}</span>
                    <span className="shrink-0 text-xs tabular-nums text-muted">
                      {rating > 0 ? `${rating}/7` : "—"}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted">{phaseFor(rating).label}</p>
                  {isOpen ? details(item, true) : null}
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="mt-4 flex gap-3">
          {columns.map((col, i) => (
            <div key={i} className="flex min-w-0 flex-1 flex-col gap-3">
              {col.map((item) => card(item))}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function SessionsTab({ dog, active }: { dog: DogRow; active: boolean }) {
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [sessionType, setSessionType] = useState(SESSION_TYPES[0]!.id);
  const [when, setWhen] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    const rows = await listSessions({ data: { dogId: dog.id } });
    setSessions(rows);
  }

  useEffect(() => {
    void load().catch(() => setSessions([]));
  }, [dog.id]);

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <Card>
        <CardHeader>
          <CardTitle>Request a session</CardTitle>
        </CardHeader>
        <CardBody className="space-y-3">
          <Field label="Type">
            <select
              className="h-11 w-full rounded-md border border-line bg-surface px-3 text-sm"
              value={sessionType}
              onChange={(e) => setSessionType(e.target.value as typeof sessionType)}
            >
              {SESSION_TYPES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} · {dollars(s.price)}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Preferred date & time (Houston)">
            <WhenPicker value={when} onChange={setWhen} enabled={active} />
          </Field>
          <Field label="What should we work on?">
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Recall in the yard, loose leash on the block…"
            />
          </Field>
          <Button
            disabled={busy || !when}
            onClick={() => {
              setBusy(true);
              void requestSession({
                data: {
                  dogId: dog.id,
                  sessionType,
                  scheduledAt: new Date(when).toISOString(),
                  ownerNotes: notes,
                },
              })
                .then(() => {
                  toast.success("Request sent. I'll confirm the window.");
                  setNotes("");
                  return load();
                })
                .catch((err: unknown) =>
                  toast.error(err instanceof Error ? err.message : "Could not request."),
                )
                .finally(() => setBusy(false));
            }}
          >
            {busy ? "Sending…" : "Request session"}
          </Button>
          <p className="text-xs text-faint">Cancel at least 24 hours ahead from this list.</p>
        </CardBody>
      </Card>
      <div className="space-y-3">
        {sessions.length === 0 ? (
          <p className="text-sm text-muted">No sessions yet.</p>
        ) : (
          sessions.map((s) => (
            <Card
              key={s.id}
              className={cn(
                s.status === "confirmed" && "border-l-[3px] border-l-accent",
                s.status === "requested" && "border-l-[3px] border-l-ink/40",
              )}
            >
              <CardBody className="space-y-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-display text-xl font-semibold tracking-tight text-ink">
                      {sessionTypeById(s.session_type).name}
                    </p>
                    <p className="mt-1 text-sm text-faint">{formatWhen(s.scheduled_at)}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Badge tone={statusTone(s.status)}>{s.status}</Badge>
                    {s.status === "requested" || s.status === "confirmed" ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          void cancelOwnSession({ data: { sessionId: s.id } })
                            .then(() => load())
                            .catch((err: unknown) =>
                              toast.error(err instanceof Error ? err.message : "Could not cancel."),
                            );
                        }}
                      >
                        Cancel
                      </Button>
                    ) : null}
                  </div>
                </div>
                {s.homework ? (
                  <div className="rounded-lg bg-pearl px-3.5 py-3">
                    <p className="text-xs font-bold uppercase tracking-wide text-accent-deep">Homework</p>
                    <p className="mt-1.5 whitespace-pre-wrap text-base leading-relaxed text-ink">
                      {s.homework}
                    </p>
                  </div>
                ) : null}
                {s.recap ? (
                  <div className="rounded-lg bg-pearl px-3.5 py-3">
                    <p className="text-xs font-bold uppercase tracking-wide text-accent-deep">From the session</p>
                    <p className="mt-1.5 whitespace-pre-wrap text-base leading-relaxed text-ink">
                      {s.recap}
                    </p>
                  </div>
                ) : null}
              </CardBody>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

function ProfileTab({ dog, onRefresh }: { dog: DogRow; onRefresh: () => void }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Household</CardTitle>
        </CardHeader>
        <CardBody className="space-y-4 text-sm">
          <Row k="Owner" v={dog.owner_name} />
          <Row k="Email" v={dog.owner_email} />
          <Row k="Phone" v={dog.owner_phone} />
          <Row k="Address" v={dog.address} />
          <Row k="Age" v={dog.age_text} />
          <Row k="Weight" v={dog.weight_text} />
          <Row k="Allergies" v={dog.allergies} />
        </CardBody>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>History we keep in mind</CardTitle>
        </CardHeader>
        <CardBody className="space-y-4 text-sm">
          <Row k="Dislikes" v={dog.dislikes} />
          <Row k="Past experiences" v={dog.past_experiences} />
          <Row k="Physical limits" v={dog.physical_limitations} />
          <Row k="Other pets" v={dog.other_pets} />
          <Row k="Kids" v={dog.kids_in_home} />
          <Row k="Vet" v={dog.vet_info} />
        </CardBody>
      </Card>
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>{dog.name}’s photo</CardTitle>
        </CardHeader>
        <CardBody className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <DogAvatar dog={dog} size="lg" />
          <div className="min-w-0">
            <p className="text-sm text-muted">Optional. A clear face shot works best.</p>
            <label className="mt-3 inline-flex cursor-pointer">
              <span className="book-cta inline-flex h-11 items-center justify-center rounded-md px-5 text-sm font-medium">
                {dog.photo_url ? "Replace photo" : "Upload a photo"}
              </span>
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  e.target.value = "";
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = () => {
                    const result = typeof reader.result === "string" ? reader.result : null;
                    void updateDogPhoto({ data: { dogId: dog.id, photo_url: result } })
                      .then(() => {
                        toast.success("Photo saved.");
                        onRefresh();
                      })
                      .catch((err: unknown) =>
                        toast.error(err instanceof Error ? err.message : "Could not save photo."),
                      );
                  };
                  reader.readAsDataURL(file);
                }}
              />
            </label>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="space-y-1">
      <p className="text-sm font-bold text-ink">{k}</p>
      <p className="text-base leading-relaxed text-muted">{v || "—"}</p>
    </div>
  );
}
