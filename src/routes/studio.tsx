import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { DogAvatar } from "@/components/dogs/dog-avatar";
import { EspressoBanner } from "@/components/layout/espresso-banner";
import { IntakeForm } from "@/components/intake/form";
import { PhaseMeter } from "@/components/progress/phase-meter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Field } from "@/components/ui/label";
import { Input, Textarea } from "@/components/ui/input";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { PHASES, SESSION_TYPES, SKILLS, TRICKS, checkinById, dollars, sessionTypeById } from "@/lib/catalog";
import { formatWhen, statusTone, checkinTone } from "@/lib/format";
import {
  saveTrainerNotes,
  setDogCredits,
  setDogStatus,
  trainerCreateClient,
} from "@/lib/server/dogs";
import { listInquiries } from "@/lib/server/inquiries";
import { becomeTrainer, releaseStudio, updateStudioContact, updateTrainerPin } from "@/lib/server/me";
import { getProgress, updateSkillProgress } from "@/lib/server/progress";
import {
  listSessions,
  requestSession,
  setSessionStatus,
  writeSessionRecap,
} from "@/lib/server/sessions";
import { listCheckins } from "@/lib/server/checkins";
import type { CheckinRow, DogRow, InquiryRow, ProgressRow, SessionRow } from "@/lib/types";
import { useMe } from "@/lib/use-me";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/studio")({ component: StudioPage });

function StudioPage() {
  const { user, isPending } = useCurrentUserState();
  const { me, loading, refresh } = useMe();

  if (loading || (isPending && !me)) {
    return (
      <div className="min-h-dvh">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <div className="h-10 w-56 animate-pulse rounded bg-surface-2" />
        </div>
      </div>
    );
  }
  if (!user && !isPending) return <RedirectToSignIn />;

  if (!me?.isTrainer) {
    return <TrainerUnlock onUnlock={() => void refresh()} />;
  }

  return <StudioApp dogs={me.dogs} studio={me.studio} onRefresh={() => void refresh()} />;
}

function TrainerUnlock({ onUnlock }: { onUnlock: () => void }) {
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <div className="min-h-dvh">
      <EspressoBanner kicker="Studio">
        Enter the trainer code to open Emily’s chair. Code TEDDY works until you
        change it in settings.
      </EspressoBanner>
      <main className="mx-auto max-w-md px-4 py-16 sm:px-6">
        <p className="text-sm text-muted">Trainer studio</p>
        <h1 className="mt-2 font-display text-4xl tracking-tight">Emily’s chair.</h1>
        <p className="mt-4 text-muted leading-relaxed">
          This account isn’t the trainer yet. Enter the studio code to open it.
          If someone else signed in first, this still works — the code moves
          the studio to you.
        </p>
        <form
          className="mt-8 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            setBusy(true);
            void becomeTrainer({ data: { pin } })
              .then(() => {
                toast.success("Studio is yours.");
                onUnlock();
              })
              .catch((err: unknown) =>
                toast.error(err instanceof Error ? err.message : "Could not open studio."),
              )
              .finally(() => setBusy(false));
          }}
        >
          <Field label="Trainer code">
            <Input
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              autoComplete="off"
              required
            />
          </Field>
          <Button type="submit" disabled={busy || pin.trim().length < 4}>
            {busy ? "Opening…" : "Open studio"}
          </Button>
        </form>
        <p className="mt-6 text-sm text-muted">
          Looking for a dog’s progress?{" "}
          <Link to="/portal" className="text-ink underline underline-offset-4">
            Client portal
          </Link>
        </p>
      </main>
    </div>
  );
}

function StudioApp({
  dogs,
  studio,
  onRefresh,
}: {
  dogs: DogRow[];
  studio: { email: string; phone: string; instagram: string; facebook: string; x_url: string };
  onRefresh: () => void;
}) {
  const [tab, setTab] = useState<"board" | "clients" | "calendar" | "inbox" | "settings">("board");
  const [selected, setSelected] = useState<number | null>(dogs[0]?.id ?? null);
  const pending = dogs.filter((d) => d.status === "pending");
  const active = dogs.filter((d) => d.status === "active");

  return (
    <div className="min-h-dvh pb-16">
      <EspressoBanner kicker="Studio">
        Clients, progress, sessions, and inbox — owners never see this side.
      </EspressoBanner>
      <main className="mx-auto max-w-6xl px-5 py-8 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm text-muted">Trainer studio</p>
            <h1 className="mt-1 font-display text-4xl tracking-tight">Studio</h1>
          </div>
          <div className="flex gap-2 text-sm text-muted">
            <span className="tabular-nums">{pending.length} pending</span>
            <span>·</span>
            <span className="tabular-nums">{active.length} active</span>
          </div>
        </div>

        <div className="mt-6 overflow-x-auto">
          <div className="inline-flex min-w-full gap-1 rounded-full bg-surface p-1.5 hairline">
          {(
            [
              ["board", "Board"],
              ["clients", "Clients"],
              ["calendar", "Calendar"],
              ["inbox", "Inbox"],
              ["settings", "Settings"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={cn(
                "h-10 shrink-0 rounded-full px-5 text-sm font-medium transition-colors duration-150",
                tab === id ? "bg-ink text-bg" : "text-muted hover:text-ink",
              )}
            >
              {label}
            </button>
          ))}
          </div>
        </div>

        <div className="mt-8">
          {tab === "board" ? (
            <Board dogs={dogs} onOpen={(id) => { setSelected(id); setTab("clients"); }} />
          ) : null}
          {tab === "clients" ? (
            <Clients
              dogs={dogs}
              selected={selected}
              setSelected={setSelected}
              onRefresh={onRefresh}
            />
          ) : null}
          {tab === "calendar" ? <Calendar dogs={dogs} /> : null}
          {tab === "inbox" ? <Inbox /> : null}
          {tab === "settings" ? <Settings studio={studio} onRefresh={onRefresh} /> : null}
        </div>
      </main>
    </div>
  );
}

function Board({ dogs, onOpen }: { dogs: DogRow[]; onOpen: (id: number) => void }) {
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [checkins, setCheckins] = useState<CheckinRow[]>([]);
  useEffect(() => {
    void listSessions({ data: {} }).then(setSessions).catch(() => setSessions([]));
    void listCheckins({ data: { limit: 8 } }).then(setCheckins).catch(() => setCheckins([]));
  }, []);
  const upcoming = sessions.filter((s) => s.status === "requested" || s.status === "confirmed").slice(0, 6);
  const pending = dogs.filter((d) => d.status === "pending");

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Needs a confirm</CardTitle>
        </CardHeader>
        <CardBody className="space-y-3">
          {upcoming.length === 0 ? (
            <p className="text-sm text-muted">No open sessions.</p>
          ) : (
            upcoming.map((s) => (
              <div key={s.id} className="flex items-start justify-between gap-3 border-b border-line pb-3 last:border-0">
                <div>
                  <p className="font-medium">{s.dog_name}</p>
                  <p className="text-xs text-muted">
                    {sessionTypeById(s.session_type).name} · {formatWhen(s.scheduled_at)}
                  </p>
                </div>
                <Badge tone={statusTone(s.status)}>{s.status}</Badge>
              </div>
            ))
          )}
        </CardBody>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>New intakes</CardTitle>
        </CardHeader>
        <CardBody className="space-y-3">
          {pending.length === 0 ? (
            <p className="text-sm text-muted">No pending households.</p>
          ) : (
            pending.map((d) => (
              <button
                key={d.id}
                type="button"
                className="flex w-full items-center gap-3 text-left"
                onClick={() => onOpen(d.id)}
              >
                <DogAvatar dog={d} size="sm" />
                <span>
                  <span className="block font-medium">{d.name}</span>
                  <span className="text-xs text-muted">{d.owner_name}</span>
                </span>
              </button>
            ))
          )}
        </CardBody>
      </Card>
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Between sessions</CardTitle>
        </CardHeader>
        <CardBody className="space-y-3">
          {checkins.length === 0 ? (
            <p className="text-sm text-muted">
              Households log a quick practiced / skipped / stuck note here. Nothing yet.
            </p>
          ) : (
            checkins.map((c) => (
              <button
                key={c.id}
                type="button"
                className="flex w-full items-start justify-between gap-3 border-b border-line pb-3 text-left last:border-0"
                onClick={() => onOpen(c.dog_id)}
              >
                <span>
                  <span className="block font-medium">{c.dog_name}</span>
                  <span className="mt-0.5 block text-xs text-muted">
                    {c.owner_name} · {formatWhen(c.updated_at || c.created_at)}
                  </span>
                  {c.note ? (
                    <span className="mt-1 block text-sm leading-relaxed">{c.note}</span>
                  ) : null}
                </span>
                <Badge tone={checkinTone(c.status)}>{checkinById(c.status).label}</Badge>
              </button>
            ))
          )}
        </CardBody>
      </Card>
    </div>
  );
}

function Clients({
  dogs,
  selected,
  setSelected,
  onRefresh,
}: {
  dogs: DogRow[];
  selected: number | null;
  setSelected: (id: number) => void;
  onRefresh: () => void;
}) {
  const [q, setQ] = useState("");
  const [showNew, setShowNew] = useState(false);
  const filtered = dogs.filter((d) => {
    const hay = `${d.name} ${d.owner_name} ${d.breed} ${d.owner_email}`.toLowerCase();
    return hay.includes(q.toLowerCase());
  });
  const dog = dogs.find((d) => d.id === selected) ?? null;

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      <div>
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search dogs or owners" />
        <Button variant="outline" className="mt-3 w-full" onClick={() => setShowNew((v) => !v)}>
          {showNew ? "Close form" : "Onboard a client"}
        </Button>
        <ul className="mt-3 space-y-1">
          {filtered.map((d) => (
            <li key={d.id}>
              <button
                type="button"
                onClick={() => setSelected(d.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left",
                  selected === d.id ? "bg-surface hairline" : "hover:bg-surface-2",
                )}
              >
                <DogAvatar dog={d} size="sm" />
                <span className="min-w-0">
                  <span className="block truncate font-medium">{d.name}</span>
                  <span className="block truncate text-xs text-muted">{d.owner_name}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
      <div>
        {showNew ? (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Onboard</CardTitle>
            </CardHeader>
            <CardBody>
              <IntakeForm
                submitLabel="Create client"
                onSubmit={async (data) => {
                  try {
                    const res = await trainerCreateClient({ data });
                    toast.success("Client on file.");
                    setShowNew(false);
                    onRefresh();
                    setSelected(res.id);
                  } catch (err) {
                    toast.error(err instanceof Error ? err.message : "Could not create.");
                    throw err;
                  }
                }}
              />
            </CardBody>
          </Card>
        ) : null}
        {dog ? <ClientDetail dog={dog} onRefresh={onRefresh} /> : <p className="text-sm text-muted">Select a client.</p>}
      </div>
    </div>
  );
}

function ClientDetail({ dog, onRefresh }: { dog: DogRow; onRefresh: () => void }) {
  const [notes, setNotes] = useState(dog.trainer_private_notes);
  const [credits, setCredits] = useState(String(dog.credits));
  const [current, setCurrent] = useState<ProgressRow[]>([]);
  const [filter, setFilter] = useState<"working" | "all">("working");
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [checkins, setCheckins] = useState<CheckinRow[]>([]);

  useEffect(() => {
    setNotes(dog.trainer_private_notes);
    setCredits(String(dog.credits));
    void getProgress({ data: { dogId: dog.id } })
      .then((r) => setCurrent(r.current))
      .catch(() => setCurrent([]));
    void listSessions({ data: { dogId: dog.id } })
      .then(setSessions)
      .catch(() => setSessions([]));
    void listCheckins({ data: { dogId: dog.id, limit: 8 } })
      .then(setCheckins)
      .catch(() => setCheckins([]));
  }, [dog]);

  const byKey = useMemo(
    () => Object.fromEntries(current.map((p) => [p.skill_key, p])),
    [current],
  );
  const catalog = [...TRICKS, ...SKILLS];
  const shown = catalog.filter((item) => {
    if (filter === "all") return true;
    return (byKey[item.key]?.rating ?? 0) > 0;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <DogAvatar dog={dog} size="lg" />
          <div>
            <h2 className="font-display text-3xl">{dog.name}</h2>
            <p className="text-sm text-muted">
              {dog.owner_name} · {dog.breed || "mixed"} · {dog.age_text || "age n/a"}
            </p>
            <p className="text-xs text-faint">{dog.address}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {(["pending", "active", "paused", "archived"] as const).map((st) => (
            <Button
              key={st}
              size="sm"
              variant={dog.status === st ? "default" : "outline"}
              onClick={() => {
                void setDogStatus({ data: { dogId: dog.id, status: st } })
                  .then(() => {
                    toast.success(`Marked ${st}.`);
                    onRefresh();
                  })
                  .catch((err: unknown) =>
                    toast.error(err instanceof Error ? err.message : "Could not update."),
                  );
              }}
            >
              {st}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Private notes</CardTitle>
          </CardHeader>
          <CardBody className="space-y-3">
            <p className="text-xs text-muted">Clients never see this field.</p>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
            <Button
              size="sm"
              onClick={() => {
                void saveTrainerNotes({ data: { dogId: dog.id, notes } })
                  .then(() => toast.success("Notes saved."))
                  .catch((err: unknown) =>
                    toast.error(err instanceof Error ? err.message : "Could not save."),
                  );
              }}
            >
              Save notes
            </Button>
          </CardBody>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Credits & file</CardTitle>
          </CardHeader>
          <CardBody className="space-y-3">
            <Field label="Session credits on account">
              <Input value={credits} onChange={(e) => setCredits(e.target.value)} />
            </Field>
            <Button
              size="sm"
              onClick={() => {
                void setDogCredits({ data: { dogId: dog.id, credits: Number(credits) || 0 } })
                  .then(() => {
                    toast.success("Credits updated.");
                    onRefresh();
                  })
                  .catch((err: unknown) =>
                    toast.error(err instanceof Error ? err.message : "Could not save."),
                  );
              }}
            >
              Update credits
            </Button>
            <div className="space-y-1 border-t border-line pt-3 text-sm">
              <p><span className="text-muted">Phone </span>{dog.owner_phone}</p>
              <p><span className="text-muted">Email </span>{dog.owner_email}</p>
              <p><span className="text-muted">Allergies </span>{dog.allergies || "none listed"}</p>
              <p><span className="text-muted">Dislikes </span>{dog.dislikes || "—"}</p>
              <p><span className="text-muted">Limits </span>{dog.physical_limitations || "—"}</p>
            </div>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Between sessions</CardTitle>
        </CardHeader>
        <CardBody className="space-y-3">
          {checkins.length === 0 ? (
            <p className="text-sm text-muted">No check-ins from this household yet.</p>
          ) : (
            checkins.map((c) => (
              <div
                key={c.id}
                className="flex items-start justify-between gap-3 border-b border-line pb-3 last:border-0"
              >
                <div>
                  <p className="text-xs text-muted">{formatWhen(c.updated_at || c.created_at)}</p>
                  {c.note ? (
                    <p className="mt-1 text-sm leading-relaxed">{c.note}</p>
                  ) : (
                    <p className="mt-1 text-sm text-muted">No note.</p>
                  )}
                </div>
                <Badge tone={checkinTone(c.status)}>{checkinById(c.status).label}</Badge>
              </div>
            ))
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle>Progress ledger</CardTitle>
            <div className="flex gap-1 rounded-full bg-bg p-1">
              <button
                type="button"
                className={cn("h-8 rounded-full px-3 text-xs", filter === "working" && "bg-surface hairline")}
                onClick={() => setFilter("working")}
              >
                In work
              </button>
              <button
                type="button"
                className={cn("h-8 rounded-full px-3 text-xs", filter === "all" && "bg-surface hairline")}
                onClick={() => setFilter("all")}
              >
                Full catalog
              </button>
            </div>
          </div>
        </CardHeader>
        <CardBody className="space-y-4">
          {shown.length === 0 ? (
            <p className="text-sm text-muted">Nothing in work yet — open the full catalog and score a first intro.</p>
          ) : null}
          {shown.map((item) => {
            const row = byKey[item.key];
            return (
              <SkillEditor
                key={item.key}
                dogId={dog.id}
                skillKey={item.key}
                name={item.name}
                kind={item.kind}
                rating={row?.rating ?? 0}
                comment={row?.comment ?? ""}
                onSaved={(next) => {
                  setCurrent((cur) => {
                    const rest = cur.filter((p) => p.skill_key !== item.key);
                    return [...rest, next];
                  });
                }}
              />
            );
          })}
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Book on their behalf</CardTitle>
        </CardHeader>
        <CardBody>
          <TrainerBook dog={dog} onBooked={() => {
            void listSessions({ data: { dogId: dog.id } }).then(setSessions);
          }} />
          <ul className="mt-4 space-y-3">
            {sessions.map((s) => (
              <SessionEditor key={s.id} session={s} onChange={() => {
                void listSessions({ data: { dogId: dog.id } }).then(setSessions);
              }} />
            ))}
          </ul>
        </CardBody>
      </Card>
    </div>
  );
}

function SkillEditor({
  dogId,
  skillKey,
  name,
  kind,
  rating,
  comment,
  onSaved,
}: {
  dogId: number;
  skillKey: string;
  name: string;
  kind: string;
  rating: number;
  comment: string;
  onSaved: (row: ProgressRow) => void;
}) {
  const [r, setR] = useState(rating);
  const [c, setC] = useState(comment);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setR(rating);
    setC(comment);
  }, [rating, comment]);

  return (
    <div className="rounded-lg bg-bg p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-medium">{name}</p>
          <p className="text-[11px] uppercase tracking-[0.14em] text-faint">{kind}</p>
        </div>
        <PhaseMeter rating={r} compact />
      </div>
      <div className="mt-3 flex flex-wrap gap-1">
        {[0, ...PHASES.map((p) => p.rating)].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setR(n)}
            className={cn(
              "size-9 rounded-full text-xs tabular-nums",
              r === n ? "bg-accent text-accent-fg" : "bg-surface text-muted hairline",
            )}
            title={n === 0 ? "Not started" : PHASES[n - 1]?.label}
          >
            {n}
          </button>
        ))}
      </div>
      <Textarea
        className="mt-3 min-h-16"
        placeholder="Note from this session"
        value={c}
        onChange={(e) => setC(e.target.value)}
      />
      <Button
        size="sm"
        className="mt-2"
        disabled={busy}
        onClick={() => {
          setBusy(true);
          void updateSkillProgress({
            data: { dogId, skillKey, rating: r, comment: c },
          })
            .then(() => {
              toast.success(`${name} updated.`);
              onSaved({
                id: 0,
                dog_id: dogId,
                skill_key: skillKey,
                rating: r,
                comment: c,
                updated_by: null,
                updated_at: new Date().toISOString(),
              });
            })
            .catch((err: unknown) =>
              toast.error(err instanceof Error ? err.message : "Could not save."),
            )
            .finally(() => setBusy(false));
        }}
      >
        Save phase
      </Button>
    </div>
  );
}

function TrainerBook({ dog, onBooked }: { dog: DogRow; onBooked: () => void }) {
  const [sessionType, setSessionType] = useState(SESSION_TYPES[0]!.id);
  const [when, setWhen] = useState("");
  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <select
        className="h-11 rounded-md border border-line bg-surface px-3 text-sm"
        value={sessionType}
        onChange={(e) => setSessionType(e.target.value as typeof sessionType)}
      >
        {SESSION_TYPES.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>
      <Input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} />
      <Button
        disabled={!when}
        onClick={() => {
          void requestSession({
            data: {
              dogId: dog.id,
              sessionType,
              scheduledAt: new Date(when).toISOString(),
              ownerNotes: "Booked by trainer",
            },
          })
            .then(() => {
              toast.success("Session booked.");
              setWhen("");
              onBooked();
            })
            .catch((err: unknown) =>
              toast.error(err instanceof Error ? err.message : "Could not book."),
            );
        }}
      >
        Book
      </Button>
    </div>
  );
}

function SessionEditor({ session, onChange }: { session: SessionRow; onChange: () => void }) {
  const [recap, setRecap] = useState(session.recap);
  const [homework, setHomework] = useState(session.homework);
  const [priv, setPriv] = useState(session.trainer_private_notes);
  return (
    <li className="rounded-lg bg-bg p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-medium">{sessionTypeById(session.session_type).name}</p>
          <p className="text-xs text-muted">{formatWhen(session.scheduled_at)}</p>
        </div>
        <div className="flex flex-wrap gap-1">
          {(["requested", "confirmed", "completed", "cancelled"] as const).map((st) => (
            <Button
              key={st}
              size="sm"
              variant={session.status === st ? "default" : "ghost"}
              onClick={() => {
                void setSessionStatus({ data: { sessionId: session.id, status: st } })
                  .then(onChange)
                  .catch((err: unknown) =>
                    toast.error(err instanceof Error ? err.message : "Could not update."),
                  );
              }}
            >
              {st}
            </Button>
          ))}
        </div>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <Field label="Recap (client can see)">
          <Textarea value={recap} onChange={(e) => setRecap(e.target.value)} />
        </Field>
        <Field label="Homework (client can see)">
          <Textarea value={homework} onChange={(e) => setHomework(e.target.value)} />
        </Field>
        <Field label="Private session notes" className="sm:col-span-2">
          <Textarea value={priv} onChange={(e) => setPriv(e.target.value)} />
        </Field>
      </div>
      <Button
        size="sm"
        className="mt-2"
        onClick={() => {
          void writeSessionRecap({
            data: {
              sessionId: session.id,
              recap,
              homework,
              trainer_private_notes: priv,
            },
          })
            .then(() => toast.success("Recap saved."))
            .catch((err: unknown) =>
              toast.error(err instanceof Error ? err.message : "Could not save."),
            );
        }}
      >
        Save recap
      </Button>
    </li>
  );
}

function Calendar({ dogs }: { dogs: DogRow[] }) {
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  useEffect(() => {
    void listSessions({ data: {} }).then(setSessions).catch(() => setSessions([]));
  }, []);
  return (
    <div className="space-y-3">
      {sessions.length === 0 ? <p className="text-sm text-muted">No sessions scheduled.</p> : null}
      {sessions.map((s) => (
        <Card key={s.id}>
          <CardBody className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-medium">
                {s.dog_name} · {sessionTypeById(s.session_type).name}
              </p>
              <p className="text-sm text-muted">
                {s.owner_name} · {formatWhen(s.scheduled_at)}
              </p>
            </div>
            <Badge tone={statusTone(s.status)}>{s.status}</Badge>
          </CardBody>
        </Card>
      ))}
      {dogs.length === 0 ? null : (
        <p className="text-xs text-faint">Open a client to book or complete a session.</p>
      )}
    </div>
  );
}

function Inbox() {
  const [rows, setRows] = useState<InquiryRow[]>([]);
  useEffect(() => {
    void listInquiries()
      .then(setRows)
      .catch(() => setRows([]));
  }, []);
  if (!rows.length) return <p className="text-sm text-muted">No inquiries yet.</p>;
  return (
    <div className="space-y-3">
      {rows.map((r) => (
        <Card key={r.id}>
          <CardBody>
            <p className="font-medium">{r.name}{r.dog_name ? ` · ${r.dog_name}` : ""}</p>
            <p className="text-xs text-muted">
              {r.email} · {r.phone} · {formatWhen(r.created_at)}
            </p>
            <p className="mt-2 whitespace-pre-wrap text-sm">{r.message}</p>
          </CardBody>
        </Card>
      ))}
    </div>
  );
}

function Settings({
  studio,
  onRefresh,
}: {
  studio: { email: string; phone: string; instagram: string; facebook: string; x_url: string };
  onRefresh: () => void;
}) {
  const [email, setEmail] = useState(studio.email);
  const [phone, setPhone] = useState(studio.phone);
  const [instagram, setInstagram] = useState(studio.instagram);
  const [facebook, setFacebook] = useState(studio.facebook);
  const [x_url, setX] = useState(studio.x_url);
  return (
    <div className="grid gap-6 lg:grid-cols-2">
    <Card className="max-w-lg">
      <CardHeader>
        <CardTitle>Public contact</CardTitle>
      </CardHeader>
      <CardBody className="space-y-3">
        <Field label="Email">
          <Input value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="Phone">
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
        </Field>
        <Field label="Instagram URL">
          <Input value={instagram} onChange={(e) => setInstagram(e.target.value)} />
        </Field>
        <Field label="Facebook URL">
          <Input value={facebook} onChange={(e) => setFacebook(e.target.value)} />
        </Field>
        <Field label="X URL">
          <Input value={x_url} onChange={(e) => setX(e.target.value)} />
        </Field>
        <Button
          onClick={() => {
            void updateStudioContact({ data: { email, phone, instagram, facebook, x_url } })
              .then(() => {
                toast.success("Contact updated.");
                onRefresh();
              })
              .catch((err: unknown) =>
                toast.error(err instanceof Error ? err.message : "Could not save."),
              );
          }}
        >
          Save
        </Button>
        <p className="text-xs text-faint">
          Consult {dollars(40)} · Hour {dollars(70)} · Two hours {dollars(140)}
        </p>
      </CardBody>
    </Card>
    <AccessCard />
    </div>
  );
}

function AccessCard() {
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <Card className="max-w-lg">
      <CardHeader>
        <CardTitle>Trainer code</CardTitle>
      </CardHeader>
      <CardBody className="space-y-3">
        <p className="text-sm text-muted">
          This is how Emily opens the studio. Change it if someone else has
          already used the old one.
        </p>
        <Field label="New trainer code">
          <Input
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            autoComplete="off"
            placeholder="4–24 characters"
          />
        </Field>
        <Button
          disabled={busy || pin.trim().length < 4}
          onClick={() => {
            setBusy(true);
            void updateTrainerPin({ data: { pin } })
              .then(() => {
                toast.success("Trainer code updated.");
                setPin("");
              })
              .catch((err: unknown) =>
                toast.error(err instanceof Error ? err.message : "Could not save."),
              )
              .finally(() => setBusy(false));
          }}
        >
          Save code
        </Button>
        <button
          type="button"
          className="block text-sm text-muted underline underline-offset-4 hover:text-ink"
          onClick={() => {
            if (!confirm("Release the studio? You’ll need the trainer code to open it again.")) return;
            void releaseStudio()
              .then(() => {
                toast.success("Studio released.");
                window.location.assign("/studio");
              })
              .catch((err: unknown) =>
                toast.error(err instanceof Error ? err.message : "Could not release."),
              );
          }}
        >
          Release studio
        </button>
      </CardBody>
    </Card>
  );
}
