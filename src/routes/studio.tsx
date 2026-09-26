import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { DogAvatar } from "@/components/dogs/dog-avatar";
import { EspressoBanner } from "@/components/layout/espresso-banner";
import { SiteFooter } from "@/components/layout/site-footer";
import { IntakeForm } from "@/components/intake/form";
import { PhaseMeter } from "@/components/progress/phase-meter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Field } from "@/components/ui/label";
import { WhenPicker } from "@/components/portal/when-picker";
import { Input, Textarea } from "@/components/ui/input";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { PHASES, SESSION_TYPES, SKILLS, TRICKS, checkinById, dollars, sessionTypeById } from "@/lib/catalog";
import { formatWhen, statusTone, checkinTone } from "@/lib/format";
import { formatUsPhone, phoneDigits } from "@/lib/phone";
import {
  saveTrainerNotes,
  setDogCredits,
  setDogStatus,
  trainerCreateClient,
} from "@/lib/server/dogs";
import { listInquiries } from "@/lib/server/inquiries";
import { becomeTrainer, releaseStudio, updateStudioBanner, updateStudioContact, updateTrainerPin } from "@/lib/server/me";
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
  studio: { email: string; phone: string; instagram: string; facebook: string; x_url: string; banner_text?: string };
  onRefresh: () => void;
}) {
  const [tab, setTab] = useState<"board" | "clients" | "calendar" | "inbox" | "settings">("board");
  const [selected, setSelected] = useState<number | null>(dogs[0]?.id ?? null);
  const pending = dogs.filter((d) => d.status === "pending");
  const active = dogs.filter((d) => d.status === "active");

  return (
    <div className="flex min-h-full flex-col">
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
          <div className="inline-flex min-w-full gap-1 rounded-full bg-ink p-1.5">
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
                tab === id ? "bg-white text-ink" : "text-bg/80 hover:text-bg",
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
      <SiteFooter />
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
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const byTime = (a: SessionRow, b: SessionRow) =>
    +new Date(a.scheduled_at) - +new Date(b.scheduled_at);
  const toConfirm = sessions.filter((s) => s.status === "requested").sort(byTime).slice(0, 6);
  const comingUp = sessions
    .filter((s) => s.status === "confirmed" && +new Date(s.scheduled_at) >= +startOfToday)
    .sort(byTime)
    .slice(0, 6);
  const pending = dogs.filter((d) => d.status === "pending");

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Pending Sessions</CardTitle>
        </CardHeader>
        <CardBody className="space-y-3">
          {toConfirm.length === 0 ? (
            <p className="text-sm text-muted">No pending sessions.</p>
          ) : (
            toConfirm.map((s) => <BoardSession key={s.id} session={s} onOpen={onOpen} />)
          )}
        </CardBody>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Pending Clients</CardTitle>
        </CardHeader>
        <CardBody className="space-y-3">
          {pending.length === 0 ? (
            <p className="text-sm text-muted">No pending clients.</p>
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
          <CardTitle>Coming up</CardTitle>
        </CardHeader>
        <CardBody className="space-y-3">
          {comingUp.length === 0 ? (
            <p className="text-sm text-muted">Nothing confirmed on the calendar yet.</p>
          ) : (
            comingUp.map((s) => <BoardSession key={s.id} session={s} onOpen={onOpen} />)
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

function BoardSession({ session, onOpen }: { session: SessionRow; onOpen: (id: number) => void }) {
  return (
    <button
      type="button"
      className="flex w-full items-start justify-between gap-3 border-b border-line pb-3 text-left last:border-0"
      onClick={() => onOpen(session.dog_id)}
    >
      <span>
        <span className="block font-medium">{session.dog_name}</span>
        <span className="text-xs text-muted">
          {sessionTypeById(session.session_type).name} · {formatWhen(session.scheduled_at)}
        </span>
      </span>
      <Badge tone={statusTone(session.status)}>{session.status}</Badge>
    </button>
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

function FileFact({ label, value, href }: { label: string; value: string; href?: string }) {
  const text = value.trim();
  return (
    <div>
      <dt className="text-sm font-bold text-[#1a0e0a]">{label}</dt>
      <dd className={cn("mt-0.5 text-sm leading-relaxed", text ? "text-ink" : "text-muted")}>
        {text && href ? (
          <a href={href} className="underline decoration-line underline-offset-4 hover:text-accent-deep">
            {text}
          </a>
        ) : (
          text || "N/A"
        )}
      </dd>
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
  const [status, setStatus] = useState(dog.status);

  useEffect(() => {
    setStatus(dog.status);
  }, [dog.id, dog.status]);

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
        <div className="flex flex-col items-center gap-1.5">
          <p id="client-status-label" className="text-center text-xs font-semibold uppercase tracking-wide text-faint">
            Client status
          </p>
          <div
            role="radiogroup"
            aria-labelledby="client-status-label"
            className="inline-flex flex-wrap gap-1 rounded-full bg-surface-2 p-1 shadow-[inset_0_0_0_1px_rgba(44,24,16,0.14)]"
          >
            {(
              [
                ["pending", "bg-[#e0a23b] text-ink hover:bg-[#d0922c]"],
                ["active", "bg-[#3d9460] text-bg hover:bg-[#348556]"],
                ["paused", "bg-[#7c6aab] text-bg hover:bg-[#6d5c99]"],
                ["archived", "bg-[#4a6670] text-bg hover:bg-[#3f5861]"],
              ] as const
            ).map(([st, on]) => (
              <button
                key={st}
                type="button"
                role="radio"
                aria-checked={status === st}
                className={cn(
                  "h-9 rounded-full px-3.5 text-xs font-medium capitalize transition-colors duration-150",
                  status === st ? on : "text-ink hover:bg-bg",
                )}
                onClick={() => {
                  if (status === st) return;
                  const previous = status;
                  setStatus(st);
                  void setDogStatus({ data: { dogId: dog.id, status: st } })
                    .then(() => {
                      toast.success(`Marked ${st}.`);
                      onRefresh();
                    })
                    .catch((err: unknown) => {
                      setStatus(previous);
                      toast.error(err instanceof Error ? err.message : "Could not update.");
                    });
                }}
              >
                {st}
              </button>
            ))}
          </div>
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
            <dl className="space-y-3 border-t border-line pt-4">
              <FileFact
                label="Phone"
                value={dog.owner_phone ? formatUsPhone(dog.owner_phone) : ""}
                href={dog.owner_phone ? `tel:${phoneDigits(dog.owner_phone)}` : undefined}
              />
              <FileFact label="Email" value={dog.owner_email} href={dog.owner_email ? `mailto:${dog.owner_email}` : undefined} />
              <FileFact label="Allergies" value={dog.allergies} />
              <FileFact label="Dislikes" value={dog.dislikes} />
              <FileFact label="Limits" value={dog.physical_limitations} />
            </dl>
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
        <CardBody>
          {shown.length === 0 ? (
            <p className="text-sm text-muted">Nothing in work yet — open the full catalog and score a first intro.</p>
          ) : (
            (["trick", "skill"] as const).map((kind) => {
              const items = shown.filter((item) => item.kind === kind);
              if (!items.length) return null;
              return (
                <section key={kind} className="mt-5 first:mt-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
                    {kind === "trick" ? "Tricks" : "Skills"}
                  </p>
                  <div className="mt-3 grid items-start gap-3 xl:grid-cols-2">
                    {items.map((item) => {
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
                  </div>
                </section>
              );
            })
          )}
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
      <div className="mt-3 grid grid-cols-8 gap-1">
        {[0, ...PHASES.map((p) => p.rating)].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setR(n)}
            className={cn(
              "mx-auto size-9 rounded-full text-xs tabular-nums",
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
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <select
        className="h-11 rounded-md border border-line bg-surface px-3 text-sm sm:w-52"
        value={sessionType}
        onChange={(e) => setSessionType(e.target.value as typeof sessionType)}
      >
        {SESSION_TYPES.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>
      <div className="min-w-0 flex-1">
        <WhenPicker value={when} onChange={setWhen} />
      </div>
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
  const [status, setStatus] = useState(session.status);
  useEffect(() => {
    setStatus(session.status);
  }, [session.id, session.status]);
  return (
    <li className="rounded-lg bg-bg p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-medium">{sessionTypeById(session.session_type).name}</p>
          <p className="text-xs text-muted">{formatWhen(session.scheduled_at)}</p>
        </div>
        <div className="flex flex-wrap gap-1">
          {(
            [
              ["requested", "is-requested"],
              ["confirmed", "is-confirmed"],
              ["completed", "is-completed"],
              ["cancelled", "is-cancelled"],
            ] as const
          ).map(([st, on]) => (
            <button
              key={st}
              type="button"
              className={cn("chip-3d rounded-full px-3 py-1.5 text-sm", status === st && on)}
              onClick={() => {
                if (status === st) return;
                const previous = status;
                setStatus(st);
                void setSessionStatus({ data: { sessionId: session.id, status: st } })
                  .then(onChange)
                  .catch((err: unknown) => {
                    setStatus(previous);
                    toast.error(err instanceof Error ? err.message : "Could not update.");
                  });
              }}
            >
              {st}
            </button>
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
  const [view, setView] = useState<"month" | "list">("month");
  const [status, setStatus] = useState<"all" | SessionRow["status"]>("all");
  const todayKey = chicagoTodayKey();
  const [cursor, setCursor] = useState(() => {
    const [year, month] = todayKey.split("-").map(Number);
    return { year: year!, month: month! };
  });
  const [selected, setSelected] = useState(todayKey);

  useEffect(() => {
    void listSessions({ data: {} }).then(setSessions).catch(() => setSessions([]));
  }, []);

  const filtered = useMemo(
    () =>
      sessions
        .filter((s) => status === "all" || s.status === status)
        .slice()
        .sort((a, b) => +new Date(a.scheduled_at) - +new Date(b.scheduled_at)),
    [sessions, status],
  );
  const byDay = useMemo(() => {
    const map = new Map<string, SessionRow[]>();
    for (const session of filtered) {
      const key = chicagoDayKey(session.scheduled_at);
      const list = map.get(key) ?? [];
      list.push(session);
      map.set(key, list);
    }
    return map;
  }, [filtered]);
  const cells = useMemo(
    () => monthCells(cursor.year, cursor.month),
    [cursor.year, cursor.month],
  );
  const selectedSessions = byDay.get(selected) ?? [];
  const monthLabel = new Date(cursor.year, cursor.month - 1, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  function shiftMonth(delta: number) {
    setCursor((c) => {
      const next = new Date(c.year, c.month - 1 + delta, 1);
      return { year: next.getFullYear(), month: next.getMonth() + 1 };
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {(
            [
              ["all", "All", "is-on"],
              ["requested", "Requested", "is-requested"],
              ["confirmed", "Confirmed", "is-confirmed"],
              ["completed", "Completed", "is-completed"],
              ["cancelled", "Cancelled", "is-cancelled"],
            ] as const
          ).map(([id, label, on]) => (
            <button
              key={id}
              type="button"
              onClick={() => setStatus(id)}
              className={cn("chip-3d rounded-full px-3 py-1.5 text-sm", status === id && on)}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="inline-flex rounded-full bg-ink p-1">
          {(
            [
              ["month", "Calendar"],
              ["list", "List"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setView(id)}
              className={cn(
                "h-9 rounded-full px-4 text-sm font-medium transition-colors duration-150",
                view === id ? "bg-white text-ink" : "text-bg/80 hover:text-bg",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {view === "list" ? (
        <div className="space-y-3">
          {filtered.length === 0 ? <p className="text-sm text-muted">No sessions in this view.</p> : null}
          {filtered.map((s) => (
            <SessionLine key={s.id} session={s} />
          ))}
        </div>
      ) : (
        <Card>
          <CardBody className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="font-display text-2xl tracking-tight">{monthLabel}</h3>
              <div className="flex items-center gap-2">
                <button type="button" className="chip-3d rounded-full px-3 py-1.5 text-sm" onClick={() => shiftMonth(-1)}>
                  Prev
                </button>
                <button
                  type="button"
                  className="chip-3d rounded-full px-3 py-1.5 text-sm"
                  onClick={() => {
                    const [year, month] = todayKey.split("-").map(Number);
                    setCursor({ year: year!, month: month! });
                    setSelected(todayKey);
                  }}
                >
                  Today
                </button>
                <button type="button" className="chip-3d rounded-full px-3 py-1.5 text-sm" onClick={() => shiftMonth(1)}>
                  Next
                </button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase tracking-wide text-muted">
              {WEEKDAYS.map((day) => (
                <div key={day} className="py-1">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {cells.map((cell, index) => {
                const items = byDay.get(cell.key) ?? [];
                const shown = items.slice(0, 2);
                return (
                  <button
                    key={cell.key}
                    type="button"
                    onClick={() => setSelected(cell.key)}
                    className={cn(
                      "relative flex min-h-16 flex-col gap-1 rounded-lg bg-pearl p-1.5 text-left hover:z-30 sm:min-h-24 sm:p-2",
                      !cell.inMonth && "opacity-40",
                      cell.key === todayKey && "ring-1 ring-accent",
                      cell.key === selected && "ring-2 ring-ink",
                    )}
                  >
                    <span className="text-xs font-semibold tabular-nums text-ink">{cell.day}</span>
                    {shown.map((session) => (
                      <ApptChip
                        key={session.id}
                        session={session}
                        align={index % 7 >= 5 ? "end" : "start"}
                      />
                    ))}
                    {items.length > shown.length ? (
                      <span className="text-[10px] text-muted">+{items.length - shown.length}</span>
                    ) : null}
                  </button>
                );
              })}
            </div>
            <div className="border-t border-line pt-4">
              <p className="text-sm font-semibold text-ink">{formatDayLabel(selected)}</p>
              {selectedSessions.length === 0 ? (
                <p className="mt-2 text-sm text-muted">Nothing scheduled.</p>
              ) : (
                <div className="mt-3 space-y-2">
                  {selectedSessions.map((s) => (
                    <SessionLine key={s.id} session={s} />
                  ))}
                </div>
              )}
            </div>
          </CardBody>
        </Card>
      )}
      {dogs.length === 0 ? null : (
        <p className="text-xs text-faint">Times are Houston. Open a client to book or complete a session.</p>
      )}
    </div>
  );
}

function ApptChip({ session, align }: { session: SessionRow; align: "start" | "end" }) {
  const place = session.location?.trim();
  return (
    <span className="group/appt relative block min-w-0">
      <span
        className={cn(
          "block truncate rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-tight text-ink sm:text-[11px]",
          sessionTint(session.status),
        )}
      >
        {chicagoTime(session.scheduled_at)} {session.dog_name}
      </span>
      <span
        role="tooltip"
        className={cn(
          "pointer-events-none invisible absolute top-[calc(100%+4px)] z-40 w-64 rounded-lg bg-ink px-3.5 py-2.5 text-left shadow-[0_10px_24px_-14px_rgba(44,24,16,0.7)] group-hover/appt:visible",
          align === "end" ? "right-0" : "left-0",
        )}
      >
        <span className="block truncate text-sm font-semibold text-bg">{session.dog_name}</span>
        <span className="mt-1 block text-sm font-medium text-accent-soft">
          {chicagoTime(session.scheduled_at)} · {sessionTypeById(session.session_type).name}
        </span>
        <span className="mt-1.5 block text-sm leading-snug text-bg/85">
          {place || "No address on file"}
        </span>
      </span>
    </span>
  );
}

function SessionLine({ session }: { session: SessionRow }) {
  const place = session.location?.trim();
  return (
    <Card>
      <CardBody className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium">
            {session.dog_name} · {sessionTypeById(session.session_type).name}
          </p>
          <p className="text-sm text-muted">
            {session.owner_name} · {formatWhen(session.scheduled_at)}
          </p>
          {place ? <p className="mt-1 text-sm text-ink">{place}</p> : null}
        </div>
        <Badge tone={statusTone(session.status)}>{session.status}</Badge>
      </CardBody>
    </Card>
  );
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function chicagoTodayKey() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Chicago" }).format(new Date());
}

function chicagoDayKey(iso: string) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Chicago" }).format(new Date(iso));
}

function chicagoTime(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

function formatDayLabel(key: string) {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year!, month! - 1, day).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function sessionTint(status: string) {
  if (status === "confirmed") return "bg-[#3d9460]/40";
  if (status === "completed") return "bg-[#4a6670]/35";
  if (status === "cancelled") return "bg-[#9b3a2f]/40";
  return "bg-[#43C5B9]";
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

function weekdayOf(year: number, month: number, day: number) {
  const key = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const name = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    weekday: "short",
  }).format(new Date(`${key}T18:00:00Z`));
  const index = WEEKDAYS.indexOf(name);
  return index < 0 ? 0 : index;
}

function monthCells(year: number, month: number) {
  const firstDow = weekdayOf(year, month, 1);
  const count = daysInMonth(year, month);
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  const prevCount = daysInMonth(prevYear, prevMonth);
  const cells: { key: string; day: number; inMonth: boolean }[] = [];
  for (let i = firstDow - 1; i >= 0; i -= 1) {
    const day = prevCount - i;
    cells.push({
      key: `${prevYear}-${String(prevMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
      day,
      inMonth: false,
    });
  }
  for (let day = 1; day <= count; day += 1) {
    cells.push({
      key: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
      day,
      inMonth: true,
    });
  }
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  let day = 1;
  while (cells.length % 7 !== 0) {
    cells.push({
      key: `${nextYear}-${String(nextMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
      day,
      inMonth: false,
    });
    day += 1;
  }
  return cells;
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
  studio: { email: string; phone: string; instagram: string; facebook: string; x_url: string; banner_text?: string };
  onRefresh: () => void;
}) {
  const [email, setEmail] = useState(studio.email);
  const [phone, setPhone] = useState(() => formatUsPhone(studio.phone));
  const [instagram, setInstagram] = useState(studio.instagram);
  const [facebook, setFacebook] = useState(studio.facebook);
  const [x_url, setX] = useState(studio.x_url);
  const [banner, setBanner] = useState(studio.banner_text ?? "");
  const [bannerBusy, setBannerBusy] = useState(false);

  function saveBanner(next: string) {
    setBannerBusy(true);
    void updateStudioBanner({ data: { banner_text: next } })
      .then((res) => {
        setBanner(res.banner_text);
        toast.success(res.banner_text ? "Banner is on the home page." : "Banner removed.");
        onRefresh();
      })
      .catch((err: unknown) =>
        toast.error(err instanceof Error ? err.message : "Could not save."),
      )
      .finally(() => setBannerBusy(false));
  }

  return (
    <div className="space-y-6">
    <Card>
      <CardHeader>
        <CardTitle>Home page banner</CardTitle>
      </CardHeader>
      <CardBody className="space-y-3">
        <p className="text-sm text-muted">
          A short note at the top of the home page. Use it for a promotion or a
          schedule change, then remove it when it’s over.
        </p>
        <Field label="Message">
          <Textarea
            value={banner}
            maxLength={240}
            onChange={(e) => setBanner(e.target.value)}
            placeholder="September consults are $20 off this week."
          />
        </Field>
        <p className="text-xs text-faint">{banner.trim().length}/240</p>
        <div className="flex flex-wrap gap-3">
          <Button disabled={bannerBusy || !banner.trim()} onClick={() => saveBanner(banner)}>
            {bannerBusy ? "Saving…" : "Post banner"}
          </Button>
          <button
            type="button"
            className="text-sm text-muted underline underline-offset-4 hover:text-ink disabled:opacity-40"
            disabled={bannerBusy || !(studio.banner_text ?? "").trim()}
            onClick={() => saveBanner("")}
          >
            Remove banner
          </button>
        </div>
      </CardBody>
    </Card>
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
          <Input
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={phone}
            onChange={(e) => setPhone(formatUsPhone(e.target.value))}
            placeholder="713-555-0148"
          />
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
