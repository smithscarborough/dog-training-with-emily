import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { DogAvatar } from "@/components/dogs/dog-avatar";
import { EspressoBanner } from "@/components/layout/espresso-banner";
import { SiteFooter } from "@/components/layout/site-footer";
import { Overview } from "@/components/studio/overview";
import { PrivateNoteEditor } from "@/components/studio/private-note";
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
import { PHASES, SESSION_TYPES, SKILLS, TRICKS, GOALS, checkinById, dollars, sessionTypeById, fullCatalogGoalLabels, parseVisibleSkillKeys } from "@/lib/catalog";
import { formatWhen, statusTone, checkinTone } from "@/lib/format";
import { formatUsPhone, phoneDigits } from "@/lib/phone";
import {
  saveTrainerNotes,
  setDogCredits,
  setDogStatus,
  setDogBirthday,
  setVisibleSkills,
  trainerCreateClient,
} from "@/lib/server/dogs";
import { listInquiries } from "@/lib/server/inquiries";
import { becomeTrainer, releaseStudio, updateStudioBanner, updateStudioContact, updateStudioHours, updateTrainerPin } from "@/lib/server/me";
import { getProgress, updateSkillProgress } from "@/lib/server/progress";
import {
  listSessions,
  requestSession,
  setSessionStatus,
  writeSessionRecap,
} from "@/lib/server/sessions";
import { listCheckins } from "@/lib/server/checkins";
import { listMessages, listPendingNotes } from "@/lib/server/messages";
import { NoteThread, TrainerReply } from "@/components/portal/note-thread";
import type { CheckinRow, DogRow, InquiryRow, MessageRow, ProgressRow, SessionRow } from "@/lib/types";
import { useMe } from "@/lib/use-me";
import { cn } from "@/lib/utils";
import {
  DAY_NAMES,
  DAY_SHORT,
  HOURS_ORDER,
  clockOptions,
  formatClock,
  hoursSummary,
  normalizeHours,
  parseHours,
  serializeHours,
  type HoursDay,
} from "@/lib/hours";

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
  studio: { email: string; phone: string; instagram: string; facebook: string; x_url: string; banner_text?: string; hours_json?: string };
  onRefresh: () => void;
}) {
  const [tab, setTab] = useState<"overview" | "board" | "clients" | "calendar" | "inbox" | "settings">("board");
  const [selected, setSelected] = useState<number | null>(dogs[0]?.id ?? null);
  const [waiting, setWaiting] = useState<MessageRow[]>([]);
  const [noteFocus, setNoteFocus] = useState<number | null>(null);
  const pending = dogs.filter((d) => d.status === "pending");
  const active = dogs.filter((d) => d.status === "active");

  function refreshWaiting() {
    void listPendingNotes()
      .then(setWaiting)
      .catch(() => setWaiting([]));
  }

  useEffect(() => {
    refreshWaiting();
  }, []);

  return (
    <div className="flex min-h-full flex-col">
      <EspressoBanner kicker="Studio">
        Clients, progress, sessions, and inbox — owners never see this side.
      </EspressoBanner>
      <main className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-6 xl:max-w-[84rem]">
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

        <div className="mt-6">
          <div className="flex w-full max-w-full gap-0.5 rounded-full bg-ink p-1 sm:inline-flex sm:w-auto sm:gap-1 sm:p-1.5">
          {(
            [
              ["overview", "Overview"],
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
                "h-10 min-w-0 flex-1 rounded-full px-1 text-[11px] font-medium whitespace-nowrap transition-colors duration-150 sm:flex-none sm:shrink-0 sm:px-5 sm:text-sm",
                tab === id ? "bg-white text-ink" : "text-bg/80 hover:text-bg",
              )}
            >
              {label}
              {id === "inbox" && waiting.length > 0 ? (
                <span className="ml-1 inline-flex min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-[10px] font-bold text-ink">
                  {waiting.length}
                </span>
              ) : null}
            </button>
          ))}
          </div>
        </div>

        <div className="mt-8">
          {tab === "overview" ? <Overview dogs={dogs} /> : null}
          {tab === "board" ? (
            <Board
              dogs={dogs}
              waiting={waiting}
              onOpen={(id) => {
                setSelected(id);
                setTab("clients");
              }}
              onReply={(id) => {
                setSelected(id);
                setNoteFocus(id);
                setTab("clients");
              }}
            />
          ) : null}
          {tab === "clients" ? (
            <Clients
              dogs={dogs}
              selected={selected}
              setSelected={setSelected}
              onRefresh={onRefresh}
              onNotes={refreshWaiting}
              focusNotes={noteFocus != null && noteFocus === selected}
              onNotesOpened={() => setNoteFocus(null)}
            />
          ) : null}
          {tab === "calendar" ? (
            <Calendar dogs={dogs} hoursJson={studio.hours_json ?? ""} onRefresh={onRefresh} />
          ) : null}
          {tab === "inbox" ? (
            <Inbox
              waiting={waiting}
              onReplied={refreshWaiting}
              onOpen={(id) => {
                setSelected(id);
                setNoteFocus(id);
                setTab("clients");
              }}
            />
          ) : null}
          {tab === "settings" ? <Settings studio={studio} onRefresh={onRefresh} /> : null}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function pendingSnapshot(dog: DogRow) {
  let ids: string[] = [];
  try {
    const parsed = JSON.parse(dog.goals_json || "[]");
    if (Array.isArray(parsed)) {
      ids = parsed.filter((id): id is string => typeof id === "string" && id.trim().length > 0);
    }
  } catch {
    ids = [];
  }
  const labels = ids.map((id) => {
    const known = GOALS.find((goal) => goal.id === id);
    if (known) return known.label;
    return id
      .replace(/-/g, " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  });
  const facts = [dog.breed, dog.sex, dog.spayed_neutered, dog.age_text, dog.weight_text]
    .map((value) => value.trim())
    .filter(Boolean);
  return {
    facts,
    primary: labels[0] ?? "",
    rest: labels.slice(1),
    note: dog.goals_other.trim(),
  };
}

function localToday() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function birthdayOn(year: number, month: number, day: number) {
  const date = new Date(year, month - 1, day);
  if (date.getMonth() !== month - 1) return new Date(year, month - 1, day - 1);
  return date;
}

function upcomingBirthdays(dogs: DogRow[]) {
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const rows: { dog: DogRow; days: number; turning: number; label: string }[] = [];
  for (const dog of dogs) {
    if (dog.status === "archived") continue;
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec((dog.birthday || "").trim());
    if (!match) continue;
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    let when = birthdayOn(start.getFullYear(), month, day);
    if (when < start) when = birthdayOn(start.getFullYear() + 1, month, day);
    const days = Math.round((when.getTime() - start.getTime()) / 86400000);
    rows.push({
      dog,
      days,
      turning: when.getFullYear() - year,
      label: when.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
    });
  }
  rows.sort((a, b) => a.days - b.days || a.dog.name.localeCompare(b.dog.name));
  return rows;
}

function Board({
  dogs,
  waiting,
  onOpen,
  onReply,
}: {
  dogs: DogRow[];
  waiting: MessageRow[];
  onOpen: (id: number) => void;
  onReply: (id: number) => void;
}) {
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
  const recentCancelCutoff = Date.now() - 14 * 24 * 60 * 60 * 1000;
  const justCancelled = sessions
    .filter((s) => s.status === "cancelled" && +new Date(s.updated_at) >= recentCancelCutoff)
    .sort((a, b) => +new Date(b.updated_at) - +new Date(a.updated_at))
    .slice(0, 6);
  const pending = dogs.filter((d) => d.status === "pending");
  const birthdays = upcomingBirthdays(dogs);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {waiting.length > 0 ? (
        <Card className="order-4">
          <CardHeader>
            <CardTitle>Needs a reply</CardTitle>
          </CardHeader>
          <CardBody className="space-y-3">
            {waiting.map((note) => (
              <button
                key={note.id}
                type="button"
                className="flex w-full items-start justify-between gap-3 rounded-lg px-3 py-3 text-left hairline transition-colors hover:bg-bg"
                onClick={() => onReply(note.dog_id)}
              >
                <span className="min-w-0">
                  <span className="block font-semibold text-ink">{note.dog_name}</span>
                  <span className="mt-0.5 block text-xs text-muted">
                    {note.owner_name} · {formatWhen(note.created_at)}
                  </span>
                  <span className="mt-1.5 block text-sm leading-relaxed text-ink">{note.body}</span>
                </span>
                <span className="shrink-0 rounded-full bg-accent px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-ink">
                  New
                </span>
              </button>
            ))}
          </CardBody>
        </Card>
      ) : null}
      {justCancelled.length > 0 ? (
        <Card className="order-7 lg:col-span-2">
          <CardHeader>
            <CardTitle>Cancelled</CardTitle>
          </CardHeader>
          <CardBody className="space-y-3">
            {justCancelled.map((s) => (
              <BoardSession key={s.id} session={s} onOpen={onOpen} />
            ))}
          </CardBody>
        </Card>
      ) : null}
      <Card className="order-1">
        <CardHeader>
          <CardTitle>Pending Sessions</CardTitle>
        </CardHeader>
        <CardBody className="space-y-3">
          {toConfirm.length === 0 ? (
            <p className="text-sm text-muted">No pending sessions.</p>
          ) : (
            toConfirm.map((s) => <BoardSession key={s.id} session={s} onOpen={onOpen} showClient />)
          )}
        </CardBody>
      </Card>
      <Card className="order-2">
        <CardHeader>
          <CardTitle>Pending Clients</CardTitle>
        </CardHeader>
        <CardBody className="space-y-3">
          {pending.length === 0 ? (
            <p className="text-sm text-muted">No pending clients.</p>
          ) : (
            pending.map((d) => {
              const snap = pendingSnapshot(d);
              return (
              <button
                key={d.id}
                type="button"
                className="flex w-full items-start gap-3 rounded-lg px-3 py-3 text-left hairline transition-colors hover:bg-bg"
                onClick={() => onOpen(d.id)}
              >
                <DogAvatar dog={d} size="sm" />
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold text-ink">{d.name}</span>
                  <span className="block text-xs text-muted">{d.owner_name}</span>
                  {d.preferred_at ? (
                    <span className="mt-1 block text-sm font-medium text-ink">
                      Asked for {formatWhen(d.preferred_at)}
                    </span>
                  ) : null}
                  {snap.facts.length ? (
                    <span className="mt-1.5 block text-sm leading-relaxed text-ink">
                      {snap.facts.map((fact, index) => (
                        <span key={`${fact}-${index}`}>
                          {index > 0 ? <span className="text-faint"> · </span> : null}
                          <span className="font-medium">{fact}</span>
                        </span>
                      ))}
                    </span>
                  ) : null}
                  <span className="mt-3 block border-t border-line pt-2.5">
                    <span className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
                      Main goal
                    </span>
                    <span className={cn("mt-1 block text-base", snap.primary ? "font-semibold text-ink" : "text-sm text-muted")}>
                      {snap.primary || "No goal on file"}
                    </span>
                    {snap.rest.length ? (
                      <span className="mt-1 block text-sm text-muted">
                        Also{" "}
                        <span className="font-medium text-ink">{snap.rest.join(", ")}</span>
                      </span>
                    ) : null}
                    {snap.note ? (
                      <span className="mt-1.5 block text-sm leading-relaxed text-ink">{snap.note}</span>
                    ) : null}
                  </span>
                </span>
              </button>
              );
            })
          )}
        </CardBody>
      </Card>
      <Card className="order-3">
        <CardHeader>
          <CardTitle>Upcoming Sessions</CardTitle>
        </CardHeader>
        <CardBody className="space-y-3">
          {comingUp.length === 0 ? (
            <p className="text-sm text-muted">Nothing confirmed on the calendar yet.</p>
          ) : (
            comingUp.map((s) => <BoardSession key={s.id} session={s} onOpen={onOpen} />)
          )}
        </CardBody>
      </Card>
      <Card className="order-5">
        <CardHeader>
          <CardTitle>Birthdays</CardTitle>
        </CardHeader>
        <CardBody className="space-y-3">
          {birthdays.length === 0 ? (
            <p className="text-sm text-muted">No birthdays on file yet.</p>
          ) : (
            <>
              {birthdays.slice(0, 8).map(({ dog, days, turning, label }) => (
              <button
                key={dog.id}
                type="button"
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left hairline transition-colors hover:bg-bg",
                  days === 0 && "bg-[#eef8f2]",
                )}
                onClick={() => onOpen(dog.id)}
              >
                <DogAvatar dog={dog} size="sm" />
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-3">
                    <span className="truncate font-medium text-ink">{dog.name}</span>
                    <span
                      className={cn(
                        "shrink-0 text-xs",
                        days === 0 ? "font-semibold text-[#1f7a45]" : "text-muted",
                      )}
                    >
                      {days === 0 ? "Today" : days === 1 ? "Tomorrow" : `In ${days} days`}
                    </span>
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-muted">
                    {dog.owner_name}
                    {turning > 0 ? ` · Turns ${turning}` : ""}
                    {" · "}
                    {label}
                  </span>
                </span>
              </button>
              ))}
              {birthdays.length > 8 ? (
                <p className="text-xs text-muted">And {birthdays.length - 8} more on file.</p>
              ) : null}
            </>
          )}
        </CardBody>
      </Card>
      <Card className="order-6">
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
                className="flex w-full items-start justify-between gap-3 rounded-lg px-3 py-3 text-left hairline transition-colors hover:bg-bg"
                onClick={() => onOpen(c.dog_id)}
              >
                <span className="min-w-0">
                  <span className="block font-medium">{c.dog_name}</span>
                  <span className="mt-0.5 block text-xs text-muted">
                    {c.owner_name} · {formatWhen(c.updated_at || c.created_at)}
                  </span>
                  {c.note ? (
                    <span className="mt-1 block text-sm leading-relaxed">{c.note}</span>
                  ) : null}
                </span>
                <Badge tone={checkinTone(c.status)} className="shrink-0">{checkinById(c.status).label}</Badge>
              </button>
            ))
          )}
        </CardBody>
      </Card>
    </div>
  );
}

function BoardSession({
  session,
  onOpen,
  showClient = false,
}: {
  session: SessionRow;
  onOpen: (id: number) => void;
  showClient?: boolean;
}) {
  return (
    <button
      type="button"
      className="flex w-full items-start justify-between gap-3 rounded-lg px-3 py-3 text-left hairline transition-colors hover:bg-bg"
      onClick={() => onOpen(session.dog_id)}
    >
      <span className="min-w-0">
        <span className="block font-medium">{session.dog_name}</span>
        {showClient && session.owner_name ? (
          <span className="mt-0.5 block text-xs text-muted">{session.owner_name}</span>
        ) : null}
        <span className="text-xs text-muted">
          {sessionTypeById(session.session_type).name} · {formatWhen(session.scheduled_at)}
        </span>
        {session.owner_notes?.includes("Asked for a new time.") ? (
          <span className="mt-1 block text-xs font-medium text-accent-deep">New time requested</span>
        ) : null}
      </span>
      <Badge tone={statusTone(session.status)} className="shrink-0">{session.status}</Badge>
    </button>
  );
}

const RECENT_CLIENTS_KEY = "dtwe-recent-clients";

function readRecentClientIds(): number[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(RECENT_CLIENTS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is number => typeof id === "number");
  } catch {
    return [];
  }
}

function rememberClient(id: number) {
  const next = [id, ...readRecentClientIds().filter((n) => n !== id)].slice(0, 8);
  window.localStorage.setItem(RECENT_CLIENTS_KEY, JSON.stringify(next));
  return next;
}

function ClientPick({
  dog,
  selected,
  onSelect,
}: {
  dog: DogRow;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left",
        selected ? "bg-bg hairline" : "hover:bg-bg/70",
      )}
    >
      <DogAvatar dog={dog} size="sm" />
      <span className="min-w-0">
        <span className="block truncate font-medium">{dog.name}</span>
        <span className="block truncate text-xs text-muted">{dog.owner_name}</span>
      </span>
    </button>
  );
}

function Clients({
  dogs,
  selected,
  setSelected,
  onRefresh,
  onNotes,
  focusNotes = false,
  onNotesOpened,
}: {
  dogs: DogRow[];
  selected: number | null;
  setSelected: (id: number) => void;
  onRefresh: () => void;
  onNotes: () => void;
  focusNotes?: boolean;
  onNotesOpened?: () => void;
}) {
  const [q, setQ] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [recentIds, setRecentIds] = useState<number[]>([]);
  const query = q.trim().toLowerCase();
  const filtered = dogs.filter((d) => {
    if (!query) return true;
    const hay = `${d.name} ${d.owner_name} ${d.breed} ${d.owner_email}`.toLowerCase();
    return hay.includes(query);
  });
  const recent = recentIds
    .map((id) => dogs.find((d) => d.id === id))
    .filter((d): d is DogRow => Boolean(d))
    .slice(0, 5);
  const dog = dogs.find((d) => d.id === selected) ?? null;

  useEffect(() => {
    setRecentIds(readRecentClientIds());
  }, []);

  useEffect(() => {
    if (selected == null) return;
    setRecentIds(rememberClient(selected));
  }, [selected]);
  const onboardForm = showNew ? (
    <Card>
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
  ) : null;

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
      <Card className="p-3">
        <Input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search dogs or owners"
          autoComplete="off"
          enterKeyHint="search"
        />
        <Button variant="outline" className="mt-3 w-full" onClick={() => setShowNew((v) => !v)}>
          {showNew ? "Close form" : "Onboard a client"}
        </Button>
        {dogs.length === 0 ? (
          <p className="mt-3 text-sm text-muted">No clients yet.</p>
        ) : !query ? (
          recent.length > 0 ? (
            <div className="mt-3 lg:hidden">
              <p className="px-2 text-[11px] font-medium uppercase tracking-[0.14em] text-faint">Recent</p>
              <ul className="mt-1 space-y-1">
                {recent.map((d) => (
                  <li key={d.id}>
                    <ClientPick dog={d} selected={selected === d.id} onSelect={() => setSelected(d.id)} />
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="mt-3 text-xs leading-relaxed text-muted lg:hidden">
              Search by dog or owner. Matches show as you type.
            </p>
          )
        ) : filtered.length === 0 ? (
          <p className="mt-3 text-sm text-muted">No clients match that.</p>
        ) : (
          <p className="mt-3 text-[11px] font-medium uppercase tracking-[0.14em] text-faint lg:hidden">
            {filtered.length} {filtered.length === 1 ? "match" : "matches"}
          </p>
        )}
        <ul
          className={cn(
            "space-y-1",
            query && filtered.length > 0 ? "mt-2 border-t border-line pt-2 lg:mt-3 lg:border-0 lg:pt-0" : "mt-3",
            !query && "hidden lg:block",
          )}
        >
          {filtered.map((d) => (
            <li key={d.id}>
              <ClientPick dog={d} selected={selected === d.id} onSelect={() => setSelected(d.id)} />
            </li>
          ))}
        </ul>
      </Card>
      {dog ? (
        <ClientDetail
          dog={dog}
          onRefresh={onRefresh}
          onNotes={onNotes}
          leading={onboardForm}
          focusNotes={focusNotes}
          onNotesOpened={onNotesOpened}
        />
      ) : (
        <div className="space-y-6">
          {onboardForm}
          <p className="text-sm text-muted">Select a client.</p>
        </div>
      )}
    </div>
  );
}

const CLIENT_STATUSES = [
  { id: "pending", label: "Pending", hint: "On file, not training yet.", on: "bg-[#e0a23b] text-ink" },
  { id: "active", label: "Active", hint: "Training now, and counted on the board.", on: "bg-[#2f8f58] text-white" },
  { id: "paused", label: "Paused", hint: "On a break, but still on file.", on: "bg-[#6d5c4a] text-white" },
  { id: "archived", label: "Archived", hint: "No longer a client. The record stays.", on: "bg-[#3d3835] text-white" },
] as const;

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

const CLIENT_SECTIONS = [
  ["client-visits", "Visits"],
  ["client-private", "Private notes"],
  ["client-file", "Credits & file"],
  ["client-notes", "Notes"],
  ["client-checkins", "Between sessions"],
  ["client-plan", "What they see"],
  ["client-progress", "Progress"],
] as const;

function scrollClientSection(id: string) {
  const scroller = document.getElementById("app-scroll");
  const target = document.getElementById(id);
  if (!scroller || !target) return;
  const headerH = document.querySelector("header")?.getBoundingClientRect().height ?? 0;
  const top =
    target.getBoundingClientRect().top -
    scroller.getBoundingClientRect().top +
    scroller.scrollTop -
    headerH -
    16;
  scroller.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
}

function ClientSectionNav() {
  const [current, setCurrent] = useState<string>(CLIENT_SECTIONS[0][0]);

  useEffect(() => {
    const scroller = document.getElementById("app-scroll");
    if (!scroller) return;
    const nodes = CLIENT_SECTIONS.map(([id]) => document.getElementById(id)).filter(
      (node): node is HTMLElement => Boolean(node),
    );
    if (!nodes.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const hit = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (hit?.target.id) setCurrent(hit.target.id);
      },
      { root: scroller, rootMargin: "-12% 0px -75% 0px", threshold: 0 },
    );
    for (const node of nodes) observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <nav aria-label="On this client" className="order-first lg:sticky lg:top-48 lg:order-none lg:self-start">
      <p className="mb-2 hidden text-[11px] font-semibold uppercase tracking-[0.14em] text-faint lg:block">
        On this page
      </p>
      <div className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1 lg:mx-0 lg:flex-col lg:gap-0.5 lg:overflow-visible lg:rounded-2xl lg:border lg:border-line lg:bg-surface lg:p-2">
        {CLIENT_SECTIONS.map(([id, label]) => (
          <button
            key={id}
            type="button"
            aria-current={current === id ? "true" : undefined}
            className={cn(
              "shrink-0 rounded-full px-3 py-1.5 text-left text-sm transition-colors duration-150 lg:w-full lg:rounded-lg lg:px-2.5",
              current === id ? "bg-white font-semibold text-ink shadow-[0_0_0_1px_rgba(44,24,16,0.1)]" : "text-muted hover:bg-white/70 hover:text-ink",
            )}
            onClick={() => {
              setCurrent(id);
              scrollClientSection(id);
            }}
          >
            {label}
          </button>
        ))}
      </div>
    </nav>
  );
}

function ClientDetail({
  dog,
  onRefresh,
  onNotes,
  leading,
  focusNotes = false,
  onNotesOpened,
}: {
  dog: DogRow;
  onRefresh: () => void;
  onNotes: () => void;
  leading?: ReactNode;
  focusNotes?: boolean;
  onNotesOpened?: () => void;
}) {
  const [notes, setNotes] = useState(dog.trainer_private_notes);
  const [savedNote, setSavedNote] = useState(dog.trainer_private_notes);
  const [credits, setCredits] = useState(String(dog.credits));
  const [birthday, setBirthday] = useState(dog.birthday || "");
  const [current, setCurrent] = useState<ProgressRow[]>([]);
  const [filter, setFilter] = useState<"working" | "all">("working");
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [checkins, setCheckins] = useState<CheckinRow[]>([]);
  const [thread, setThread] = useState<MessageRow[]>([]);
  const [status, setStatus] = useState(dog.status);
  const [statusBusy, setStatusBusy] = useState(false);

  useEffect(() => {
    setStatus(dog.status);
    setStatusBusy(false);
  }, [dog.id, dog.status]);

  useEffect(() => {
    setNotes(dog.trainer_private_notes);
    setSavedNote(dog.trainer_private_notes);
    setCredits(String(dog.credits));
    setBirthday(dog.birthday || "");
    void getProgress({ data: { dogId: dog.id } })
      .then((r) => setCurrent(r.current))
      .catch(() => setCurrent([]));
    void listSessions({ data: { dogId: dog.id } })
      .then(setSessions)
      .catch(() => setSessions([]));
    void listCheckins({ data: { dogId: dog.id, limit: 8 } })
      .then(setCheckins)
      .catch(() => setCheckins([]));
    void listMessages({ data: { dogId: dog.id } })
      .then(setThread)
      .catch(() => setThread([]));
  }, [dog]);

  const notesOpened = useRef(onNotesOpened);
  notesOpened.current = onNotesOpened;

  useLayoutEffect(() => {
    if (!focusNotes) return;
    const scroller = document.getElementById("app-scroll");
    const notes = document.getElementById("client-notes");
    if (!scroller || !notes) return;
    const headerH = document.querySelector("header")?.getBoundingClientRect().height ?? 0;
    const top =
      notes.getBoundingClientRect().top -
      scroller.getBoundingClientRect().top +
      scroller.scrollTop -
      headerH -
      16;
    scroller.scrollTo({ top: Math.max(0, top) });
    notes.querySelector("textarea")?.focus({ preventScroll: true });
    notesOpened.current?.();
  }, [focusNotes, dog.id]);

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
    <div className="min-w-0 space-y-6">
      {leading}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <DogAvatar dog={dog} size="lg" />
          <div className="min-w-0">
            <h2 className="font-display text-3xl">{dog.name}</h2>
            <p className="text-sm text-muted">
              {dog.owner_name} · {dog.breed || "mixed"} · {dog.age_text || "age n/a"}
            </p>
            <p className="text-xs text-faint">{dog.address}</p>
          </div>
        </div>
        <div className="w-full shrink-0 rounded-2xl bg-pearl px-3.5 py-3 hairline sm:w-[24rem]">
          <p id="client-status-label" className="text-sm font-bold text-[#1a0e0a]">
            Client status
          </p>
          <div
            role="radiogroup"
            aria-labelledby="client-status-label"
            className="mt-2 grid grid-cols-2 gap-1 rounded-xl bg-bg p-1 shadow-[inset_0_0_0_1px_rgba(44,24,16,0.1)] sm:grid-cols-4"
          >
            {CLIENT_STATUSES.map((item, index) => {
              const selected = status === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  disabled={statusBusy}
                  className={cn(
                    "status-choice relative h-9 rounded-lg px-2 text-xs font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40",
                    selected ? item.on : "text-ink/80 hover:bg-white",
                    statusBusy && "opacity-70",
                  )}
                  onClick={() => {
                    if (selected || statusBusy) return;
                    const previous = status;
                    setStatus(item.id);
                    setStatusBusy(true);
                    void setDogStatus({ data: { dogId: dog.id, status: item.id } })
                      .then(() => {
                        toast.success(`${dog.name} is now ${item.label.toLowerCase()}.`);
                        onRefresh();
                      })
                      .catch((err: unknown) => {
                        setStatus(previous);
                        toast.error(err instanceof Error ? err.message : "Could not update.");
                      })
                      .finally(() => setStatusBusy(false));
                  }}
                >
                  {item.label}
                  {selected ? null : (
                    <span
                      role="tooltip"
                      className={cn(
                        "status-tip pointer-events-none absolute bottom-[calc(100%+8px)] z-30 w-max max-w-[12.5rem] rounded-lg bg-ink px-2.5 py-1.5 text-left text-[11px] font-normal normal-case leading-snug tracking-normal text-bg shadow-[0_10px_24px_-14px_rgba(44,24,16,0.75)]",
                        index % 2 === 0 ? "left-0" : "right-0",
                        index === 0 && "sm:left-0 sm:right-auto",
                        index > 0 && index < CLIENT_STATUSES.length - 1 && "sm:left-1/2 sm:right-auto sm:-translate-x-1/2",
                        index === CLIENT_STATUSES.length - 1 && "sm:right-0 sm:left-auto",
                      )}
                    >
                      {item.hint}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <p className="mt-2.5 min-h-8 text-xs leading-relaxed text-muted">
            {CLIENT_STATUSES.find((item) => item.id === status)?.hint}
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_10.5rem] lg:items-start lg:gap-8">
        <div className="min-w-0 space-y-6 lg:order-first">
      <Card id="client-visits">
        <CardHeader>
          <CardTitle>Visits</CardTitle>
          <p className="text-sm text-muted">
            Confirm a request here. When the visit is over, mark it completed and leave the recap. That takes one credit off.
          </p>
        </CardHeader>
        <CardBody>
          <ul className="space-y-3">
            {sessions.length === 0 ? (
              <li className="text-sm text-muted">Nothing booked yet.</li>
            ) : null}
            {sessions
              .slice()
              .sort((a, b) => {
                const rank = (row: SessionRow) =>
                  row.status === "confirmed" || row.status === "requested" ? 0 : row.status === "completed" ? 1 : 2;
                const byRank = rank(a) - rank(b);
                if (byRank) return byRank;
                const at = +new Date(a.scheduled_at) - +new Date(b.scheduled_at);
                return a.status === "completed" || a.status === "cancelled" ? -at : at;
              })
              .map((s) => (
              <SessionEditor key={s.id} session={s} onChange={() => {
                void listSessions({ data: { dogId: dog.id } }).then(setSessions);
              }} />
            ))}
          </ul>
          <div className="mt-6 border-t border-line pt-5">
            <h3 className="font-display text-lg font-semibold tracking-tight">Book on their behalf</h3>
          </div>
          <div className="mt-4">
            <TrainerBook dog={dog} onBooked={() => {
              void listSessions({ data: { dogId: dog.id } }).then(setSessions);
            }} />
          </div>
        </CardBody>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card id="client-private">
          <CardHeader>
            <CardTitle>Private notes</CardTitle>
          </CardHeader>
          <CardBody className="space-y-3">
            <p className="text-xs text-muted">
              {notes === savedNote ? "Clients never see this." : "Unsaved changes. Clients never see this."}
            </p>
            <PrivateNoteEditor key={dog.id} value={notes} onChange={setNotes} />
            <Button
              size="sm"
              disabled={notes === savedNote}
              onClick={() => {
                const next = notes;
                void saveTrainerNotes({ data: { dogId: dog.id, notes: next } })
                  .then(() => {
                    setSavedNote(next);
                    toast.success("Note saved.");
                    onRefresh();
                  })
                  .catch((err: unknown) =>
                    toast.error(err instanceof Error ? err.message : "Could not save."),
                  );
              }}
            >
              Save note
            </Button>
          </CardBody>
        </Card>
        <Card id="client-file">
          <CardHeader>
            <CardTitle>Credits & file</CardTitle>
          </CardHeader>
          <CardBody className="space-y-3">
            <Field label="Session credits on account">
              <Input value={credits} onChange={(e) => setCredits(e.target.value)} />
            </Field>
            <p className="text-xs leading-relaxed text-muted">
              Set this when a series is purchased. One credit comes off when you mark a session completed. The client can see the count, but cannot change it.
            </p>
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
            <Field label="Birthday">
              <Input
                type="date"
                value={birthday}
                max={localToday()}
                onChange={(e) => setBirthday(e.target.value)}
              />
            </Field>
            <p className="text-xs leading-relaxed text-muted">
              Optional. Coming-up days show on the board.
            </p>
            <Button
              size="sm"
              disabled={birthday === (dog.birthday || "")}
              onClick={() => {
                void setDogBirthday({ data: { dogId: dog.id, birthday } })
                  .then(() => {
                    toast.success(birthday ? "Birthday saved." : "Birthday cleared.");
                    onRefresh();
                  })
                  .catch((err: unknown) =>
                    toast.error(err instanceof Error ? err.message : "Could not save."),
                  );
              }}
            >
              Save birthday
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

      <Card id="client-notes" className="max-w-2xl">
        <CardHeader>
          <CardTitle>Notes</CardTitle>
          <p className="text-sm text-muted">
            Messages this client sent from their portal, and your replies.
          </p>
        </CardHeader>
        <CardBody className="space-y-4">
          <NoteThread messages={thread} viewer="trainer" clientName={dog.owner_name} />
          <TrainerReply
            dogId={dog.id}
            onSent={() => {
              void listMessages({ data: { dogId: dog.id } }).then(setThread).catch(() => setThread([]));
              onNotes();
            }}
          />
        </CardBody>
      </Card>

      <Card id="client-checkins" className="max-w-2xl">
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
                className="flex items-start justify-between gap-3 rounded-lg px-3 py-3 hairline"
              >
                <div className="min-w-0">
                  <p className="text-xs text-muted">{formatWhen(c.updated_at || c.created_at)}</p>
                  {c.note ? (
                    <p className="mt-1 text-sm leading-relaxed">{c.note}</p>
                  ) : (
                    <p className="mt-1 text-sm text-muted">No note.</p>
                  )}
                </div>
                <Badge tone={checkinTone(c.status)} className="shrink-0">{checkinById(c.status).label}</Badge>
              </div>
            ))
          )}
        </CardBody>
      </Card>

      <PortalPlan key={dog.id} dog={dog} />

      <Card id="client-progress">
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
                  <div className="mt-3 grid items-start gap-4 lg:grid-cols-2">
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
        </div>
        <ClientSectionNav />
      </div>
    </div>
  );
}

function PortalPlan({ dog }: { dog: DogRow }) {
  const unlocked = fullCatalogGoalLabels(dog.goals_json);
  const [keys, setKeys] = useState<string[]>(() => parseVisibleSkillKeys(dog.visible_skills_json));
  const [busy, setBusy] = useState(false);
  const keysRef = useRef(keys);
  const request = useRef(0);
  keysRef.current = keys;

  useEffect(() => {
    const next = parseVisibleSkillKeys(dog.visible_skills_json);
    keysRef.current = next;
    setKeys(next);
  }, [dog.id, dog.visible_skills_json]);

  function save(next: string[]) {
    const id = ++request.current;
    const previous = keysRef.current;
    keysRef.current = next;
    setKeys(next);
    setBusy(true);
    void setVisibleSkills({ data: { dogId: dog.id, keys: next } })
      .catch((err: unknown) => {
        if (request.current !== id) return;
        keysRef.current = previous;
        setKeys(previous);
        toast.error(err instanceof Error ? err.message : "Could not update.");
      })
      .finally(() => {
        if (request.current === id) setBusy(false);
      });
  }

  function toggle(key: string) {
    const current = keysRef.current;
    save(current.includes(key) ? current.filter((id) => id !== key) : [...current, key]);
  }

  return (
    <Card id="client-plan">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle>What they see</CardTitle>
          {unlocked.length === 0 ? (
            <span className="text-sm tabular-nums text-muted">{keys.length} on</span>
          ) : null}
        </div>
      </CardHeader>
      <CardBody className="space-y-5">
        {unlocked.length > 0 ? (
          <p className="text-sm leading-relaxed text-muted">
            {dog.name} chose {unlocked.join(" and ")} on intake, so the portal shows every trick and skill.
          </p>
        ) : (
          <>
            <p className="text-sm leading-relaxed text-muted">
              {dog.name} did not choose Obedience or Puppy basics, so the portal only shows what you turn on.
            </p>
            <div className="flex gap-4 text-sm">
              <button
                type="button"
                disabled={busy}
                onClick={() => save([...TRICKS, ...SKILLS].map((item) => item.key))}
                className="font-semibold text-accent-deep underline-offset-4 hover:underline disabled:opacity-40"
              >
                Turn all on
              </button>
              <button
                type="button"
                disabled={busy || keys.length === 0}
                onClick={() => save([])}
                className="font-semibold text-muted underline-offset-4 hover:text-ink hover:underline disabled:opacity-40"
              >
                Turn all off
              </button>
            </div>
            {(["trick", "skill"] as const).map((kind) => {
              const items = (kind === "trick" ? TRICKS : SKILLS);
              return (
                <div key={kind}>
                  <p className="text-xs font-bold uppercase tracking-wide text-accent-deep">
                    {kind === "trick" ? "Tricks" : "Skills"}
                  </p>
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    {items.map((item) => {
                      const on = keys.includes(item.key);
                      return (
                        <button
                          key={item.key}
                          type="button"
                          aria-pressed={on}
                          disabled={busy}
                          onClick={() => toggle(item.key)}
                          className={cn("chip-3d rounded-full px-3 py-2 text-sm disabled:opacity-60", on && "is-on")}
                        >
                          {item.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </>
        )}
      </CardBody>
    </Card>
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
        <PhaseMeter rating={r} compact stable className="w-56 shrink-0" />
      </div>
      <div className="mt-3 grid grid-cols-8 gap-1">
        {[0, ...PHASES.map((p) => p.rating)].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setR(n)}
            className={cn(
              "mx-auto inline-flex size-9 shrink-0 items-center justify-center rounded-full border text-xs font-semibold tabular-nums leading-none outline-none focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ink",
              r === n ? "border-transparent bg-accent text-accent-fg" : "border-line bg-surface text-ink",
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
  const [closing, setClosing] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    setStatus(session.status);
    setRecap(session.recap);
    setHomework(session.homework);
    setPriv(session.trainer_private_notes);
    setClosing(false);
  }, [session.id, session.status, session.recap, session.homework, session.trainer_private_notes]);

  function changeStatus(next: SessionRow["status"], done: string) {
    if (busy || status === next) return;
    const previous = status;
    setBusy(true);
    setStatus(next);
    void setSessionStatus({ data: { sessionId: session.id, status: next } })
      .then(() => {
        toast.success(done);
        onChange();
      })
      .catch((err: unknown) => {
        setStatus(previous);
        toast.error(err instanceof Error ? err.message : "Could not update.");
      })
      .finally(() => setBusy(false));
  }

  function completeVisit() {
    if (busy) return;
    setBusy(true);
    void writeSessionRecap({
      data: {
        sessionId: session.id,
        recap,
        homework,
        trainer_private_notes: priv,
      },
    })
      .then(() => setSessionStatus({ data: { sessionId: session.id, status: "completed" } }))
      .then(() => {
        setStatus("completed");
        setClosing(false);
        toast.success("Visit completed. One credit came off.");
        onChange();
      })
      .catch((err: unknown) => {
        toast.error(err instanceof Error ? err.message : "Could not complete the visit.");
      })
      .finally(() => setBusy(false));
  }

  const showCloseout = status === "completed" || closing;

  return (
    <li className="rounded-lg bg-bg p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium">{sessionTypeById(session.session_type).name}</p>
          <p className="text-xs text-muted">{formatWhen(session.scheduled_at)}</p>
          {session.owner_notes?.includes("Asked for a new time.") ? (
            <p className="mt-1 text-xs font-medium text-accent-deep">They asked for a new time.</p>
          ) : null}
        </div>
        <Badge
          tone={status === "completed" ? "ok" : statusTone(status)}
          className={cn("shrink-0 capitalize", status === "completed" && "bg-[#2f8f58] px-3 py-1 font-bold text-white")}
        >
          {status}
        </Badge>
      </div>

      {status === "requested" ? (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button size="sm" disabled={busy} onClick={() => changeStatus("confirmed", "Session confirmed.")}>
            Confirm session
          </Button>
          <Button size="sm" variant="ghost" disabled={busy} onClick={() => changeStatus("cancelled", "Session cancelled.")}>
            Cancel
          </Button>
        </div>
      ) : null}

      {status === "confirmed" && !closing ? (
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
          <Button size="sm" disabled={busy} onClick={() => setClosing(true)}>
            Mark completed
          </Button>
          <Button size="sm" variant="ghost" disabled={busy} onClick={() => changeStatus("cancelled", "Session cancelled.")}>
            Cancel
          </Button>
          <p className="text-xs text-muted">Finishing the visit takes one credit off.</p>
        </div>
      ) : null}

      {status === "cancelled" ? (
        <div className="mt-3">
          <Button size="sm" variant="outline" disabled={busy} onClick={() => changeStatus("confirmed", "Back on the calendar.")}>
            Put back on the calendar
          </Button>
        </div>
      ) : null}

      {showCloseout ? (
        <div className="mt-3 border-t border-line pt-3">
          {status === "completed" ? (
            <p className="mb-3 text-xs text-muted">The client can see the recap and homework. Private notes stay here.</p>
          ) : (
            <p className="mb-3 text-xs text-muted">Write what they should see, then complete the visit. One credit comes off.</p>
          )}
          <div className="grid gap-2 sm:grid-cols-2">
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
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {status === "completed" ? (
              <>
                <Button
                  size="sm"
                  disabled={busy}
                  onClick={() => {
                    setBusy(true);
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
                      )
                      .finally(() => setBusy(false));
                  }}
                >
                  Save recap
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={busy}
                  onClick={() => changeStatus("confirmed", "Back to confirmed. The credit was put back.")}
                >
                  Not done yet
                </Button>
              </>
            ) : (
              <>
                <Button size="sm" disabled={busy} onClick={completeVisit}>
                  {busy ? "Completing…" : "Complete visit"}
                </Button>
                <Button size="sm" variant="ghost" disabled={busy} onClick={() => setClosing(false)}>
                  Not yet
                </Button>
              </>
            )}
          </div>
        </div>
      ) : null}
    </li>
  );
}

function HoursCard({ hoursJson, onRefresh }: { hoursJson: string; onRefresh: () => void }) {
  const saved = parseHours(hoursJson);
  const [hours, setHours] = useState<HoursDay[]>(saved);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const options = clockOptions();

  useEffect(() => {
    setHours(parseHours(hoursJson));
  }, [hoursJson]);

  function patch(day: number, next: Partial<HoursDay>) {
    setHours((rows) => rows.map((row) => (row.day === day ? { ...row, ...next } : row)));
  }

  const dirty = (() => {
    try {
      return serializeHours(hours) !== serializeHours(parseHours(hoursJson));
    } catch {
      return true;
    }
  })();

  return (
    <Card className="w-full max-w-xl">
      <CardBody className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-display text-2xl tracking-tight">Available hours</h3>
            <p className="mt-1 text-sm text-muted">{hoursSummary(hours)}</p>
          </div>
          <button
            type="button"
            className="chip-3d rounded-full px-3 py-1.5 text-sm"
            onClick={() => {
              if (editing && dirty) setHours(parseHours(hoursJson));
              setEditing((open) => !open);
            }}
          >
            {editing ? "Close" : "Edit"}
          </button>
        </div>
        {editing ? (
          <>
            <p className="text-sm leading-relaxed text-muted">
              Clients and new consults can only request a time inside these windows. Houston time. You can still book any time from a client’s file.
            </p>
            <div className="space-y-2">
              {HOURS_ORDER.map((day) => {
                const row = hours.find((item) => item.day === day) ?? saved[day]!;
                return (
                  <div key={day} className="flex flex-wrap items-center gap-3 rounded-lg px-2 py-1.5">
                    <span className="w-16 text-sm font-medium text-ink">{DAY_SHORT[day]}</span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={row.open}
                      aria-label={`${DAY_NAMES[day]} ${row.open ? "open" : "closed"}`}
                      className={cn(
                        "relative inline-flex h-[26px] w-[46px] shrink-0 items-center rounded-full p-0.5 transition-colors duration-200",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2",
                        row.open
                          ? "bg-ink"
                          : "bg-[#ddd6cb] shadow-[inset_0_0_0_1px_rgba(44,24,16,0.14)]",
                      )}
                      onClick={() => patch(day, { open: !row.open })}
                    >
                      <span
                        className={cn(
                          "pointer-events-none block size-5 rounded-full bg-white shadow-[0_1px_2px_rgba(44,24,16,0.28)] transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]",
                          row.open ? "translate-x-[22px]" : "translate-x-0",
                        )}
                      />
                    </button>
                    {row.open ? (
                      <span className="flex items-center gap-2">
                        <select
                          className="h-10 w-[7.5rem] rounded-full border border-line bg-bg px-3 text-sm"
                          value={row.start}
                          onChange={(e) => patch(day, { start: e.target.value })}
                        >
                          {options.map((time) => (
                            <option key={time} value={time}>
                              {formatClock(time)}
                            </option>
                          ))}
                        </select>
                        <span className="text-xs text-muted">to</span>
                        <select
                          className="h-10 w-[7.5rem] rounded-full border border-line bg-bg px-3 text-sm"
                          value={row.end}
                          onChange={(e) => patch(day, { end: e.target.value })}
                        >
                          {options.map((time) => (
                            <option key={time} value={time} disabled={time <= row.start}>
                              {formatClock(time)}
                            </option>
                          ))}
                        </select>
                      </span>
                    ) : (
                      <span className="text-sm text-muted">Closed</span>
                    )}
                  </div>
                );
              })}
            </div>
            <Button
              size="sm"
              disabled={busy || !dirty}
              onClick={() => {
                let next: HoursDay[];
                try {
                  next = normalizeHours(hours);
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : "Check the hours.");
                  return;
                }
                setBusy(true);
                void updateStudioHours({ data: { hours: next } })
                  .then(() => {
                    toast.success("Hours saved.");
                    setEditing(false);
                    onRefresh();
                  })
                  .catch((err: unknown) =>
                    toast.error(err instanceof Error ? err.message : "Could not save."),
                  )
                  .finally(() => setBusy(false));
              }}
            >
              {busy ? "Saving…" : "Save hours"}
            </Button>
          </>
        ) : (
          <p className="text-xs leading-relaxed text-muted">
            These are the times a client or a new consult can choose.
          </p>
        )}
      </CardBody>
    </Card>
  );
}

function Calendar({
  dogs,
  hoursJson,
  onRefresh,
}: {
  dogs: DogRow[];
  hoursJson: string;
  onRefresh: () => void;
}) {
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
      <HoursCard hoursJson={hoursJson} onRefresh={onRefresh} />
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
                <button type="button" className="chip-3d cursor-pointer rounded-full px-3 py-1.5 text-sm" onClick={() => shiftMonth(-1)}>
                  Prev
                </button>
                <button
                  type="button"
                  className="chip-3d cursor-pointer rounded-full px-3 py-1.5 text-sm"
                  onClick={() => {
                    const [year, month] = todayKey.split("-").map(Number);
                    setCursor({ year: year!, month: month! });
                    setSelected(todayKey);
                  }}
                >
                  Today
                </button>
                <button type="button" className="chip-3d cursor-pointer rounded-full px-3 py-1.5 text-sm" onClick={() => shiftMonth(1)}>
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
                      "relative flex min-h-16 cursor-pointer flex-col gap-1 rounded-lg bg-pearl p-1.5 text-left hover:z-30 sm:min-h-24 sm:p-2",
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
        <span className="block truncate text-sm font-semibold text-bg">
          {session.dog_name}{" "}
          <span className="font-medium capitalize text-bg/80">({session.status})</span>
        </span>
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
      <CardBody className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium">
            {session.dog_name} · {sessionTypeById(session.session_type).name}
          </p>
          <p className="text-sm text-muted">
            {session.owner_name} · {formatWhen(session.scheduled_at)}
          </p>
          {place ? <p className="mt-1 text-sm text-ink">{place}</p> : null}
        </div>
        <Badge tone={statusTone(session.status)} className="shrink-0">{session.status}</Badge>
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
  if (status === "confirmed") return "bg-[#2E6F9E]/35";
  if (status === "completed") return "bg-[#45403C]/30";
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

function Inbox({
  waiting,
  onReplied,
  onOpen,
}: {
  waiting: MessageRow[];
  onReplied: () => void;
  onOpen: (id: number) => void;
}) {
  const [rows, setRows] = useState<InquiryRow[]>([]);
  const [q, setQ] = useState("");
  useEffect(() => {
    void listInquiries()
      .then(setRows)
      .catch(() => setRows([]));
  }, []);
  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    const digits = phoneDigits(q);
    if (!query) return rows;
    return rows.filter((row) => {
      const text = [row.name, row.dog_name, row.email, row.message].join(" ").toLowerCase();
      if (text.includes(query)) return true;
      return digits.length >= 3 && phoneDigits(row.phone).includes(digits);
    });
  }, [rows, q]);
  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h2 className="font-display text-2xl tracking-tight">From clients</h2>
        {waiting.length === 0 ? (
          <p className="text-sm text-muted">No notes waiting on a reply.</p>
        ) : (
          waiting.map((note) => (
            <Card key={note.id}>
              <CardBody className="space-y-4">
                <button type="button" className="flex w-full items-start justify-between gap-3 text-left" onClick={() => onOpen(note.dog_id)}>
                  <span className="min-w-0">
                    <span className="font-semibold text-ink">{note.dog_name}</span>
                    <span className="text-faint"> · </span>
                    <span className="font-medium text-ink">{note.owner_name}</span>
                    <span className="mt-0.5 block text-xs text-muted">{formatWhen(note.created_at)}</span>
                    <span className="mt-2.5 block whitespace-pre-wrap text-sm leading-relaxed text-ink">{note.body}</span>
                  </span>
                  <span className="shrink-0 rounded-full bg-accent px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-ink">
                    New
                  </span>
                </button>
                <TrainerReply dogId={note.dog_id} onSent={onReplied} />
              </CardBody>
            </Card>
          ))
        )}
      </section>
      <section className="space-y-3">
      <h2 className="font-display text-2xl tracking-tight">Website inquiries</h2>
      <Input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search name, dog, phone, or email"
        className="max-w-md"
      />
      {!rows.length ? (
        <p className="text-sm text-muted">No inquiries yet.</p>
      ) : !filtered.length ? (
        <p className="text-sm text-muted">Nothing matches that search.</p>
      ) : (
        filtered.map((r) => (
        <Card key={r.id}>
          <CardBody>
            <p>
              <span className="font-semibold text-ink">{r.name}</span>
              {r.dog_name ? (
                <>
                  <span className="text-faint"> · </span>
                  <span className="font-medium text-ink">{r.dog_name}</span>
                </>
              ) : null}
            </p>
            <p className="mt-0.5 text-xs text-muted">
              {r.email ? <span className="font-medium text-ink">{r.email}</span> : null}
              {r.email && r.phone ? <span className="text-faint"> · </span> : null}
              {r.phone ? <span>{r.phone}</span> : null}
              {(r.email || r.phone) ? <span className="text-faint"> · </span> : null}
              {formatWhen(r.created_at)}
            </p>
            {r.message ? (
              <p className="mt-2.5 whitespace-pre-wrap border-t border-line pt-2.5 text-sm leading-relaxed text-ink">
                {r.message}
              </p>
            ) : null}
          </CardBody>
        </Card>
        ))
      )}
      </section>
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
