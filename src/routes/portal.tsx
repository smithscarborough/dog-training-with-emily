import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { DogAvatar } from "@/components/dogs/dog-avatar";
import { SiteFooter } from "@/components/layout/site-footer";
import { EspressoBanner } from "@/components/layout/espresso-banner";
import { PhaseLegend, PhaseMeter } from "@/components/progress/phase-meter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Field } from "@/components/ui/label";
import { Input, Textarea } from "@/components/ui/input";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { SESSION_TYPES, CHECKINS, checkinById, dollars, sessionTypeById, phaseFor, portalCatalog } from "@/lib/catalog";
import { formatWhen, statusTone, checkinTone } from "@/lib/format";
import { cancelOwnSession, listSessions, requestSession } from "@/lib/server/sessions";
import { getProgress } from "@/lib/server/progress";
import { updateDogPhoto, updateOwnProfile } from "@/lib/server/dogs";
import { fileToJpegDataUrl } from "@/lib/photo";
import { listCheckins, submitCheckin, clearCheckin } from "@/lib/server/checkins";
import type { CheckinRow, DogRow, ProgressLogRow, ProgressRow, SessionRow } from "@/lib/types";
import { WhenPicker, DateField } from "@/components/portal/when-picker";
import { formatUsPhone } from "@/lib/phone";
import { formatUsAddress } from "@/lib/address";
import { formatEmail, formatProperName, formatSentenceStart } from "@/lib/text";
import { parseHours, isWithinHours, type HoursDay } from "@/lib/hours";
import { useMe } from "@/lib/use-me";
import { cn } from "@/lib/utils";

function PawPrint() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <ellipse cx="6.2" cy="8.2" rx="2.1" ry="2.6" />
      <ellipse cx="12" cy="5.4" rx="2.15" ry="2.7" />
      <ellipse cx="17.8" cy="8.2" rx="2.1" ry="2.6" />
      <ellipse cx="8.6" cy="10" rx="1.7" ry="2.1" />
      <path d="M7.2 14.2c.2-2.2 2.4-3.4 4.8-3.4s4.6 1.2 4.8 3.4c.2 2.4-2 4.8-4.8 4.8s-5-2.4-4.8-4.8z" />
    </svg>
  );
}

function EmptyPortal() {
  const navigate = useNavigate();
  const [paws, setPaws] = useState(0);
  const [leaving, setLeaving] = useState(false);

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center px-4 py-16 text-center">
        <h1 className="font-display text-4xl">Looks like we don't have a dog on file for you yet.</h1>
        <p className="mt-3 text-muted leading-relaxed">
          Tell me about your dog and needs via the form below, and I will promptly follow up as needed.
        </p>
        <p className="mt-3 text-muted leading-relaxed">Thank you!</p>
        <div className="relative mt-6">
          <Button
            type="button"
            onClick={() => {
              if (leaving) return;
              setLeaving(true);
              setPaws((n) => n + 1);
              window.setTimeout(() => {
                void navigate({ to: "/intake" });
              }, 420);
            }}
          >
            Begin intake
          </Button>
          {paws > 0 ? (
            <span key={paws} className="paw-burst" aria-hidden="true">
              <PawPrint />
              <PawPrint />
              <PawPrint />
            </span>
          ) : null}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

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

  if (!me?.dogs.length) return <EmptyPortal />;

  return <PortalApp dogs={me.dogs} hours={parseHours(me.studio.hours_json)} onRefresh={() => void refresh()} />;
}

function PortalApp({
  dogs,
  hours,
  onRefresh,
}: {
  dogs: DogRow[];
  hours: HoursDay[];
  onRefresh: () => void;
}) {
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
      <main className="portal-type mx-auto w-full max-w-5xl px-5 py-8 sm:px-6">
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

        <div className="mt-6 w-full">
          <div className="portal-tabs flex w-full gap-1 rounded-full bg-ink p-1.5">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                "h-11 min-w-0 flex-1 rounded-full px-5 text-base font-medium transition-colors duration-150",
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
            <SessionsTab dog={dog} hours={hours} active={tab === "sessions"} />
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

const GOAL_COLOR: Record<string, string> = {
  obedience: "bg-[#C4B0E4]",
  "puppy-basics": "bg-[#E7A8C0]",
  "breed-fulfillment": "bg-[#C4A26A]",
  proofing: "bg-[#D9899A]",
  leash: "bg-[#E4B15A]",
  reactivity: "bg-[#A9B8E4]",
  "house-manners": "bg-[#E39A86]",
  "doorway-manners": "bg-[#D4A5D8]",
  enrichment: "bg-[#E6C9A8]",
  other: "bg-[#D7B8C4]",
};

function goalPill(id: string) {
  return GOAL_COLOR[id] ?? "bg-[#D7B8C4]";
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
    <div className="grid w-full gap-4 lg:grid-cols-2">
      <CheckinCard dog={dog} lastDone={lastDone ?? null} />
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
          <CardTitle>Goals on file</CardTitle>
        </CardHeader>
        <CardBody>
          <div className="flex flex-wrap gap-2">
            {goals.length ? goals.map((g) => (
              <Badge key={g} className={cn("px-3 py-1 font-bold text-ink", goalPill(g))}>
                {g.replace(/-/g, " ")}
              </Badge>
            )) : <span className="text-sm text-muted">None listed yet.</span>}
          </div>
          {dog.goals_other ? <p className="mt-3 text-sm text-muted">{dog.goals_other}</p> : null}
        </CardBody>
      </Card>
    </div>
  );
}

function CheckinCard({ dog, lastDone }: { dog: DogRow; lastDone: SessionRow | null }) {
  const [status, setStatus] = useState<(typeof CHECKINS)[number]["id"] | "">("");
  const [note, setNote] = useState("");
  const [latest, setLatest] = useState<CheckinRow | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

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

  const canEdit = !!latest && Date.now() - new Date(latest.created_at).getTime() < 18 * 60 * 60 * 1000;

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle>Homework</CardTitle>
      </CardHeader>
      <CardBody className="space-y-5">
        <div className="rounded-lg bg-pearl px-3.5 py-3.5">
          {lastDone?.homework ? (
            <>
              <p className="text-xs font-bold uppercase tracking-wide text-accent-deep">Latest homework</p>
              <p className="mt-1 text-xs text-muted">{formatWhen(lastDone.scheduled_at)}</p>
              <p className="mt-2 whitespace-pre-wrap text-base leading-relaxed text-ink">{lastDone.homework}</p>
              {lastDone.recap ? (
                <div className="mt-3 border-t border-line pt-3">
                  <p className="text-xs font-bold uppercase tracking-wide text-accent-deep">From the session</p>
                  <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-muted">{lastDone.recap}</p>
                </div>
              ) : null}
            </>
          ) : (
            <p className="text-sm leading-relaxed text-muted">Homework appears here after a session is wrapped.</p>
          )}
        </div>
        <div className="space-y-4 border-t border-line pt-5">
        <p className="font-display text-xl font-bold tracking-tight text-ink">How did homework go?</p>
        <p className="text-sm leading-relaxed text-muted">
          Complete this section after you and {dog.name} have completed the recommended homework.
        </p>
        <p className="text-sm leading-relaxed text-muted">
          Emily will review prior to the next session and adapt training as needed.
        </p>
        <p className="text-sm font-bold text-ink">Choose one</p>
        <div className="flex flex-wrap gap-2">
          {CHECKINS.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                setStatus(c.id);
                setConfirmClear(false);
              }}
              className={cn("chip-3d rounded-full px-3 py-2 text-sm", status === c.id && "is-on")}
            >
              {c.label}
            </button>
          ))}
        </div>
        {status && checkinById(status).hint ? (
          <p className="text-sm text-muted">{checkinById(status).hint}</p>
        ) : null}
        <Field label="Note for Emily (optional)">
          <Textarea
            value={note}
            onChange={(e) => {
              setNote(e.target.value);
              setConfirmClear(false);
            }}
            placeholder="What you tried, what went well, or where it fell apart…"
          />
        </Field>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            disabled={(!status && !note.trim()) || busy}
            onClick={() => {
              if (!status) return;
              setBusy(true);
              void submitCheckin({ data: { dogId: dog.id, status, note } })
                .then((row) => {
                  setLatest(row);
                  setConfirmClear(false);
                  toast.success("Sent. Emily will see this before the next session.");
                })
                .catch((err: unknown) =>
                  toast.error(err instanceof Error ? err.message : "Could not send."),
                )
                .finally(() => setBusy(false));
            }}
          >
            {busy ? "Sending…" : canEdit ? "Update check-in" : "Send to Emily"}
          </Button>
          {latest ? (
            <span className="text-sm text-muted">
              Last:{" "}
              <Badge tone={checkinTone(latest.status)}>{checkinById(latest.status).label}</Badge>
              <span className="ml-2">{formatWhen(latest.updated_at || latest.created_at)}</span>
            </span>
          ) : null}
        </div>
        {canEdit ? (
          confirmClear ? (
            <p className="text-xs text-muted">
              Clear this update?{" "}
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  setBusy(true);
                  void clearCheckin({ data: { dogId: dog.id } })
                    .then((row) => {
                      setLatest(row);
                      setStatus("");
                      setNote("");
                      setConfirmClear(false);
                      toast.success("Cleared. Emily will not see that update.");
                    })
                    .catch((err: unknown) =>
                      toast.error(err instanceof Error ? err.message : "Could not clear."),
                    )
                    .finally(() => setBusy(false));
                }}
                className="font-semibold text-ink underline decoration-ink/40 underline-offset-2 hover:decoration-ink disabled:opacity-40"
              >
                Yes, clear it
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => setConfirmClear(false)}
                className="ml-3 text-faint hover:text-ink disabled:opacity-40"
              >
                Keep it
              </button>
            </p>
          ) : (
            <button
              type="button"
              disabled={busy}
              onClick={() => setConfirmClear(true)}
              className="text-xs font-medium text-faint underline-offset-4 hover:text-muted hover:underline disabled:opacity-40"
            >
              Clear update
            </button>
          )
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
  const [filter, setFilter] = useState<"all" | "active" | "idle">("active");

  const plan = portalCatalog(dog);
  const tricks = plan.items.filter((item) => item.kind === "trick");
  const skills = plan.items.filter((item) => item.kind === "skill");

  function filtered<T extends { key: string }>(items: T[]) {
    if (filter === "active") return items.filter((i) => (byKey[i.key]?.rating ?? 0) > 0);
    if (filter === "idle") return items.filter((i) => !(byKey[i.key]?.rating));
    return items;
  }

  const activeCount = plan.items.filter((i) => (byKey[i.key]?.rating ?? 0) > 0).length;

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>How we score</CardTitle>
        </CardHeader>
        <CardBody>
          <p className="max-w-2xl text-sm text-muted">
            Each trick and skill sits on a seven-phase ladder. Open one to see
            where {dog.name} is, and the last note from a session.
          </p>
          <div className="mt-5">
            <PhaseLegend />
          </div>
        </CardBody>
      </Card>
      {plan.items.length === 0 ? (
        <p className="text-sm leading-relaxed text-muted">
          Emily adds tricks and skills here as {dog.name}'s plan takes shape.
        </p>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["active", `In progress (${activeCount})`],
                ["all", "All"],
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
          <SkillGrid title="Tricks" items={filtered(tricks)} byKey={byKey} log={log} open={open} setOpen={setOpen} quietIdle={filter === "all"} />
          <SkillGrid title="Skills" items={filtered(skills)} byKey={byKey} log={log} open={open} setOpen={setOpen} quietIdle={filter === "all"} />
        </>
      )}
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
      <div className="mt-4 space-y-4 border-t border-line pt-4">
        {showSummary ? (
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-accent-deep">About this</p>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">{item.summary}</p>
          </div>
        ) : null}
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-accent-deep">Emily's note</p>
          {row?.comment?.trim() ? (
            <p className="mt-1.5 whitespace-pre-wrap text-base leading-relaxed text-ink">{row.comment}</p>
          ) : (
            <p className="mt-1.5 text-sm leading-relaxed text-muted">No note from Emily yet.</p>
          )}
        </div>
        {history.length ? (
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-accent-deep">When Emily scored this</p>
            <ul className="mt-1.5 space-y-1.5">
              {history.map((h) => (
                <li key={h.id} className="text-sm leading-relaxed text-muted">
                  <span className="font-semibold text-ink">{phaseFor(h.rating).label}</span>
                  {" · "}
                  {formatWhen(h.created_at)}
                </li>
              ))}
            </ul>
          </div>
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
        <p className="font-display text-lg font-semibold tracking-tight text-ink">{item.name}</p>
        <p className="mt-1.5 text-sm leading-relaxed text-muted">{item.summary}</p>
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
        <ul className="mt-4 flex flex-col gap-2.5">
          {items.map((item) => {
            const row = byKey[item.key];
            const rating = row?.rating ?? 0;
            const isOpen = open === item.key;
            const quiet = quietIdle && rating === 0 && !isOpen;
            return (
              <li key={item.key}>
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : item.key)}
                  className={cn(
                    "w-full rounded-xl bg-pearl px-4 py-3.5 text-left hairline transition-[box-shadow,opacity,transform] duration-150",
                    quiet && "skill-card-idle",
                    isOpen
                      ? "ring-2 ring-accent shadow-[0_12px_28px_-16px_rgba(44,24,16,0.5)]"
                      : open
                        ? "opacity-55"
                        : null,
                  )}
                >
                  <p className="font-display text-lg font-semibold tracking-tight text-ink">{item.name}</p>
                  <div className="mt-2.5">
                    <PhaseMeter rating={rating} compact />
                  </div>
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

function SessionsTab({ dog, hours, active }: { dog: DogRow; hours: HoursDay[]; active: boolean }) {
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [sessionType, setSessionType] = useState(SESSION_TYPES[0]!.id);
  const [when, setWhen] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [paws, setPaws] = useState(0);

  async function load() {
    const rows = await listSessions({ data: { dogId: dog.id } });
    setSessions(rows);
  }

  useEffect(() => {
    void load().catch(() => setSessions([]));
  }, [dog.id]);

  useEffect(() => {
    if (!when) return;
    const picked = new Date(when);
    if (!isWithinHours(picked, hours, sessionTypeById(sessionType).minutes)) setWhen("");
  }, [sessionType, hours, when]);

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
          <Field label="Preferred date & time (Houston)" hint="Only open hours are listed.">
            <WhenPicker
              value={when}
              onChange={setWhen}
              enabled={active}
              hours={hours}
              durationMin={sessionTypeById(sessionType).minutes}
            />
          </Field>
          <Field label="What should we work on?">
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Recall in the yard, loose leash on the block…"
            />
          </Field>
          <div className="relative w-fit">
            <Button
              disabled={busy || !when}
              onClick={() => {
                if (busy || !when) return;
                setPaws((n) => n + 1);
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
            {paws > 0 ? (
              <span key={paws} className="paw-burst" aria-hidden="true">
                <PawPrint />
                <PawPrint />
                <PawPrint />
              </span>
            ) : null}
          </div>
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

function profileDraft(dog: DogRow) {
  return {
    owner_name: dog.owner_name,
    owner_email: dog.owner_email,
    owner_phone: dog.owner_phone,
    address: dog.address,
    name: dog.name,
    breed: dog.breed,
    age_text: dog.age_text,
    birthday: dog.birthday,
    weight_text: dog.weight_text,
    allergies: dog.allergies,
    sex: dog.sex,
    spayed_neutered: dog.spayed_neutered,
    dislikes: dog.dislikes,
    past_experiences: dog.past_experiences,
    physical_limitations: dog.physical_limitations,
    household: dog.household,
    other_pets: dog.other_pets,
    kids_in_home: dog.kids_in_home,
    vet_info: dog.vet_info,
    preferred_days: dog.preferred_days,
  };
}

type ProfileDraft = ReturnType<typeof profileDraft>;

function todayKey() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function birthdayLabel(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year!, month! - 1, day).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function sexLabel(dog: Pick<DogRow, "sex" | "spayed_neutered">) {
  const altered =
    dog.spayed_neutered === "Yes"
      ? dog.sex === "Male"
        ? "Neutered"
        : dog.sex === "Female"
          ? "Spayed"
          : "Spayed or neutered"
      : dog.spayed_neutered;
  return [dog.sex, altered].filter(Boolean).join(" · ");
}

function Chips({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (next: string) => void;
}) {
  return (
    <fieldset>
      <legend className="text-sm font-bold text-[#1a0e0a]">{label}</legend>
      <div role="radiogroup" aria-label={label} className="mt-2 flex flex-wrap gap-2">
        {options.map((option) => {
          const on = value === option;
          return (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => onChange(on ? "" : option)}
              className={cn("chip-3d rounded-full px-3 py-2 text-sm", on && "is-on")}
            >
              {option}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

function ProfileTab({ dog, onRefresh }: { dog: DogRow; onRefresh: () => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<ProfileDraft>(() => profileDraft(dog));
  const [busy, setBusy] = useState(false);
  const [paws, setPaws] = useState(0);
  const [removing, setRemoving] = useState(false);
  const dirty = JSON.stringify(draft) !== JSON.stringify(profileDraft(dog));

  useEffect(() => {
    setEditing(false);
    setDraft(profileDraft(dog));
  }, [dog.id]);

  function patch<K extends keyof ProfileDraft>(key: K, value: ProfileDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function removePhoto() {
    if (removing) return;
    setRemoving(true);
    void updateDogPhoto({ data: { dogId: dog.id, photo_url: null } })
      .then(() => {
        toast.success("Photo removed.");
        onRefresh();
      })
      .catch((err: unknown) =>
        toast.error(err instanceof Error ? err.message : "Could not remove photo."),
      )
      .finally(() => setRemoving(false));
  }

  function save() {
    if (!dirty || busy) return;
    setPaws((n) => n + 1);
    setBusy(true);
    void updateOwnProfile({ data: { dogId: dog.id, ...draft } })
      .then(() => {
        toast.success("Saved. Emily will see this before the next visit.");
        setEditing(false);
        onRefresh();
      })
      .catch((err: unknown) => toast.error(err instanceof Error ? err.message : "Could not save."))
      .finally(() => setBusy(false));
  }

  return (
    <div className="grid w-full gap-4 lg:grid-cols-2">
      <div className="flex items-end justify-between gap-3 lg:col-span-2">
        <p className="text-sm leading-relaxed text-muted">Emily sees this before she comes over.</p>
        {editing ? null : (
          <button
            type="button"
            className="chip-3d shrink-0 rounded-full px-4 py-2 text-sm"
            onClick={() => {
              setDraft(profileDraft(dog));
              setEditing(true);
            }}
          >
            Edit details
          </button>
        )}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Household</CardTitle>
        </CardHeader>
        <CardBody className="space-y-4 text-sm">
          {editing ? (
            <>
              <Field label="Your name" required>
                <Input
                  value={draft.owner_name}
                  onChange={(e) => patch("owner_name", e.target.value)}
                  onBlur={(e) => patch("owner_name", formatProperName(e.target.value))}
                />
              </Field>
              <Field label="Phone" required>
                <Input
                  type="tel"
                  inputMode="tel"
                  value={draft.owner_phone}
                  onChange={(e) => patch("owner_phone", formatUsPhone(e.target.value))}
                  placeholder="713-555-0148"
                />
              </Field>
              <Field label="Email" required hint="How Emily reaches you. This does not change your login.">
                <Input
                  type="email"
                  value={draft.owner_email}
                  onChange={(e) => patch("owner_email", e.target.value)}
                  onBlur={(e) => patch("owner_email", formatEmail(e.target.value))}
                />
              </Field>
              <Field label="Home address" required>
                <Input
                  value={draft.address}
                  onChange={(e) => patch("address", e.target.value)}
                  onBlur={(e) => patch("address", formatUsAddress(e.target.value))}
                />
              </Field>
              <Field label="Who lives here">
                <Input
                  value={draft.household}
                  onChange={(e) => patch("household", e.target.value)}
                  onBlur={(e) => patch("household", formatSentenceStart(e.target.value))}
                  placeholder="Two adults"
                />
              </Field>
              <Field label="Other pets">
                <Input
                  value={draft.other_pets}
                  onChange={(e) => patch("other_pets", e.target.value)}
                  onBlur={(e) => patch("other_pets", formatSentenceStart(e.target.value))}
                  placeholder="One cat"
                />
              </Field>
              <Field label="Kids in the home">
                <Input
                  value={draft.kids_in_home}
                  onChange={(e) => patch("kids_in_home", e.target.value)}
                  onBlur={(e) => patch("kids_in_home", formatSentenceStart(e.target.value))}
                  placeholder="None, or ages 4 and 7"
                />
              </Field>
              <Field label="Days that usually work">
                <Input
                  value={draft.preferred_days}
                  onChange={(e) => patch("preferred_days", e.target.value)}
                  onBlur={(e) => patch("preferred_days", formatSentenceStart(e.target.value))}
                  placeholder="Tue / Thu after 4, weekend morning"
                />
              </Field>
            </>
          ) : (
            <>
              <Row k="Owner" v={dog.owner_name} />
              <Row k="Email" v={dog.owner_email} />
              <Row k="Phone" v={dog.owner_phone} />
              <Row k="Address" v={dog.address} />
              <Row k="Household" v={dog.household} />
              <Row k="Other pets" v={dog.other_pets} />
              <Row k="Kids" v={dog.kids_in_home} />
              <Row k="Days that work" v={dog.preferred_days} />
            </>
          )}
        </CardBody>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>{dog.name}</CardTitle>
        </CardHeader>
        <CardBody className="space-y-4 text-sm">
          {editing ? (
            <>
              <Field label="Dog’s name" required>
                <Input
                  value={draft.name}
                  onChange={(e) => patch("name", e.target.value)}
                  onBlur={(e) => patch("name", formatProperName(e.target.value))}
                />
              </Field>
              <Field label="Breed">
                <Input
                  value={draft.breed}
                  onChange={(e) => patch("breed", e.target.value)}
                  onBlur={(e) => patch("breed", formatProperName(e.target.value))}
                  placeholder="Lab mix"
                />
              </Field>
              <Chips
                label="Sex"
                value={draft.sex}
                options={["Female", "Male"]}
                onChange={(value) => patch("sex", value)}
              />
              <Chips
                label="Spayed or neutered"
                value={draft.spayed_neutered}
                options={["Yes", "No", "Not yet"]}
                onChange={(value) => patch("spayed_neutered", value)}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Age">
                  <Input
                    value={draft.age_text}
                    onChange={(e) => patch("age_text", e.target.value)}
                    onBlur={(e) => patch("age_text", formatSentenceStart(e.target.value))}
                    placeholder="3 years"
                  />
                </Field>
                <Field label="Weight">
                  <Input
                    value={draft.weight_text}
                    onChange={(e) => patch("weight_text", e.target.value)}
                    placeholder="42 lbs"
                  />
                </Field>
              </div>
              <Field label="Birthday" hint="Optional. I’ll reach out on the day.">
                <DateField value={draft.birthday} max={todayKey()} onChange={(value) => patch("birthday", value)} />
              </Field>
              <Field label="Allergies or dietary restrictions">
                <Input
                  value={draft.allergies}
                  onChange={(e) => patch("allergies", e.target.value)}
                  onBlur={(e) => patch("allergies", formatSentenceStart(e.target.value))}
                  placeholder="None, or chicken"
                />
              </Field>
              <Field label="Things this dog does not like">
                <Textarea
                  className="min-h-20"
                  value={draft.dislikes}
                  onChange={(e) => patch("dislikes", e.target.value)}
                  onBlur={(e) => patch("dislikes", formatSentenceStart(e.target.value))}
                />
              </Field>
              <Field label="Past bad experiences">
                <Textarea
                  className="min-h-20"
                  value={draft.past_experiences}
                  onChange={(e) => patch("past_experiences", e.target.value)}
                  onBlur={(e) => patch("past_experiences", formatSentenceStart(e.target.value))}
                />
              </Field>
              <Field label="Physical limitations">
                <Textarea
                  className="min-h-20"
                  value={draft.physical_limitations}
                  onChange={(e) => patch("physical_limitations", e.target.value)}
                  onBlur={(e) => patch("physical_limitations", formatSentenceStart(e.target.value))}
                />
              </Field>
              <Field label="Veterinarian">
                <Input
                  value={draft.vet_info}
                  onChange={(e) => patch("vet_info", e.target.value)}
                  onBlur={(e) => patch("vet_info", formatProperName(e.target.value))}
                  placeholder="Clinic name"
                />
              </Field>
            </>
          ) : (
            <>
              <Row k="Birthday" v={birthdayLabel(dog.birthday)} />
              <Row k="Sex" v={sexLabel(dog)} />
              <Row k="Age" v={dog.age_text} />
              <Row k="Weight" v={dog.weight_text} />
              <Row k="Allergies" v={dog.allergies} />
              <Row k="Dislikes" v={dog.dislikes} />
              <Row k="Past experiences" v={dog.past_experiences} />
              <Row k="Physical limits" v={dog.physical_limitations} />
              <Row k="Vet" v={dog.vet_info} />
            </>
          )}
        </CardBody>
      </Card>
      {editing ? (
        <div className="flex flex-wrap items-center gap-4 lg:col-span-2">
          <div className="relative w-fit">
            <Button type="button" disabled={!dirty || busy} onClick={save}>
              {busy ? "Saving…" : "Save changes"}
            </Button>
            {paws > 0 ? (
              <span key={paws} className="paw-burst" aria-hidden="true">
                <PawPrint />
                <PawPrint />
                <PawPrint />
              </span>
            ) : null}
          </div>
          <button
            type="button"
            className="text-sm text-muted underline underline-offset-4 disabled:opacity-40"
            disabled={busy}
            onClick={() => {
              setDraft(profileDraft(dog));
              setEditing(false);
            }}
          >
            Cancel
          </button>
        </div>
      ) : null}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>{dog.name}’s photo</CardTitle>
        </CardHeader>
        <CardBody className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative w-fit">
            <DogAvatar dog={dog} size="lg" />
            {dog.photo_url ? (
              <button
                type="button"
                aria-label={`Remove ${dog.name}’s photo`}
                disabled={removing}
                onClick={removePhoto}
                className="absolute -right-1 -top-1 grid size-7 place-items-center rounded-full bg-ink text-bg shadow-sm transition-opacity hover:opacity-80 disabled:opacity-50"
              >
                <span className="text-sm leading-none" aria-hidden>
                  ×
                </span>
              </button>
            ) : null}
          </div>
          <div className="min-w-0">
            <p className="text-sm text-muted">Optional. A clear face shot works best.</p>
            <label className="relative mt-3 inline-flex cursor-pointer overflow-hidden">
              <span className="book-cta inline-flex h-11 items-center justify-center rounded-md px-5 text-sm font-medium">
                {dog.photo_url ? "Replace photo" : "Upload a photo"}
              </span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif,.heic,.heif"
                className="absolute inset-0 size-full cursor-pointer opacity-0"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  e.target.value = "";
                  if (!file) return;
                  void fileToJpegDataUrl(file)
                    .then((photo_url) => updateDogPhoto({ data: { dogId: dog.id, photo_url } }))
                    .then(() => {
                      toast.success("Photo saved.");
                      onRefresh();
                    })
                    .catch((err: unknown) =>
                      toast.error(err instanceof Error ? err.message : "Could not save photo."),
                    );
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
