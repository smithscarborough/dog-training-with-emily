import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import { consultHasHappened, creditsForSession, sessionTypeById } from "@/lib/catalog";
import type { SessionRow } from "@/lib/types";
import { assertDogAccess, loadStudio, requireTrainer, stripPrivate } from "./helpers";
import { isWithinHours, parseHours } from "@/lib/hours";
import { grantReferralHour, revokeReferralHour } from "./referrals";

export const listSessions = createServerFn({ method: "GET" })
  .validator((data: { dogId?: number } | undefined) => data ?? {})
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const studio = await loadStudio();
    const isTrainer = studio.owner_user_id === context.userId;
    const sql = await getSql();
    let rows: SessionRow[];
    if (isTrainer) {
      rows = data.dogId
        ? await sql<SessionRow>`
            select s.*, d.name as dog_name, d.owner_name
            from sessions s join dogs d on d.id = s.dog_id
            where s.dog_id = ${data.dogId}
            order by s.scheduled_at desc
          `
        : await sql<SessionRow>`
            select s.*, d.name as dog_name, d.owner_name
            from sessions s join dogs d on d.id = s.dog_id
            order by s.scheduled_at desc
          `;
    } else {
      rows = data.dogId
        ? await sql<SessionRow>`
            select s.*, d.name as dog_name, d.owner_name
            from sessions s join dogs d on d.id = s.dog_id
            where s.dog_id = ${data.dogId} and d.owner_user_id = ${context.userId}
            order by s.scheduled_at desc
          `
        : await sql<SessionRow>`
            select s.*, d.name as dog_name, d.owner_name
            from sessions s join dogs d on d.id = s.dog_id
            where d.owner_user_id = ${context.userId}
            order by s.scheduled_at desc
          `;
    }
    return rows.map((r) => stripPrivate(r, isTrainer));
  });

export const requestSession = createServerFn({ method: "POST" })
  .validator((data: { dogId: number; sessionType: string; scheduledAt: string; ownerNotes: string }) => data)
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const dog = await assertDogAccess(context.userId, data.dogId);
    const type = sessionTypeById(data.sessionType);
    const when = new Date(data.scheduledAt);
    if (Number.isNaN(when.getTime())) throw new Error("Pick a valid date and time.");
    if (when.getTime() < Date.now() - 60_000) throw new Error("Pick a time that’s still ahead.");
    const sql = await getSql();
    const studio = await loadStudio();
    const isTrainer = studio.owner_user_id === context.userId;
    if (!isTrainer && !isWithinHours(when, parseHours(studio.hours_json), type.minutes)) {
      throw new Error("That time isn’t open. Pick another.");
    }
    if (!isTrainer && type.id === "consult") {
      const open = await sql<{ id: number }>`
        select id from sessions
        where dog_id = ${dog.id}
          and session_type = 'consult'
          and status in ('requested', 'confirmed')
        limit 1
      `;
      if (open.length) throw new Error("You already have a consult on the books.");
    }
    if (!isTrainer && type.id !== "consult") {
      const prior = await sql<{ session_type: string; status: string; scheduled_at: string }>`
        select session_type, status, scheduled_at from sessions where dog_id = ${dog.id}
      `;
      if (!consultHasHappened(prior)) throw new Error("The first visit is the consult.");
    }
    const status = isTrainer ? "confirmed" : "requested";
    const inserted = await sql<{ id: number }>`
      insert into sessions (
        dog_id, owner_user_id, session_type, scheduled_at, duration_min, status, location, owner_notes
      ) values (
        ${dog.id}, ${dog.owner_user_id}, ${type.id}, ${when.toISOString()}, ${type.minutes},
        ${status}, ${dog.address}, ${data.ownerNotes.trim()}
      ) returning id
    `;
    return { id: inserted[0]?.id, status };
  });

export const setSessionStatus = createServerFn({ method: "POST" })
  .validator((data: { sessionId: number; status: SessionRow["status"] }) => data)
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    await requireTrainer(context.userId);
    const sql = await getSql();
    const existing = await sql<SessionRow>`select * from sessions where id = ${data.sessionId}`;
    const session = existing[0];
    if (!session) throw new Error("Not found");
    const credited = await sql<{ credits_used: number }>`
      select credits_used from sessions where id = ${session.id}
    `;
    const used = Number(credited[0]?.credits_used ?? 0);
    const cost = creditsForSession(session.session_type);
    let thanked: string | null = null;
    if (data.status === "completed" && session.status !== "completed" && used === 0 && cost > 0) {
      await sql`update dogs set credits = greatest(credits - ${cost}, 0), updated_at = now() where id = ${session.dog_id}`;
      await sql`update sessions set credits_used = ${cost}, credit_applied = true where id = ${session.id}`;
    }
    if (data.status === "completed" && session.status !== "completed" && session.session_type === "consult") {
      thanked = await grantReferralHour(sql, session.dog_id);
    }
    if (session.status === "completed" && data.status !== "completed" && used > 0) {
      await sql`update dogs set credits = credits + ${used}, updated_at = now() where id = ${session.dog_id}`;
      await sql`update sessions set credits_used = 0, credit_applied = false where id = ${session.id}`;
    }
    if (session.status === "completed" && data.status !== "completed" && session.session_type === "consult") {
      await revokeReferralHour(sql, session.dog_id);
    }
    await sql`update sessions set status = ${data.status}, updated_at = now() where id = ${data.sessionId}`;
    return { ok: true, thanked };
  });

export const writeSessionRecap = createServerFn({ method: "POST" })
  .validator((data: { sessionId: number; recap: string; homework: string; trainer_private_notes: string }) => data)
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    await requireTrainer(context.userId);
    const sql = await getSql();
    await sql`
      update sessions set
        recap = ${data.recap},
        homework = ${data.homework},
        trainer_private_notes = ${data.trainer_private_notes},
        updated_at = now()
      where id = ${data.sessionId}
    `;
    return { ok: true };
  });

export const cancelOwnSession = createServerFn({ method: "POST" })
  .validator((data: { sessionId: number }) => data)
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const rows = await sql<SessionRow>`
      select s.*, d.name as dog_name, d.owner_name
      from sessions s
      join dogs d on d.id = s.dog_id
      where s.id = ${data.sessionId} and d.owner_user_id = ${context.userId}
    `;
    const session = rows[0];
    if (!session) throw new Error("Not found");
    if (session.status === "completed") throw new Error("Completed sessions cannot be cancelled.");
    if (session.status === "cancelled") throw new Error("This visit is already cancelled.");
    await sql`update sessions set status = 'cancelled', updated_at = now() where id = ${session.id}`;
    return {
      ok: true as const,
      dogName: session.dog_name ?? "Dog",
      ownerName: session.owner_name ?? "Client",
      sessionType: session.session_type,
      scheduledAt: session.scheduled_at,
    };
  });

export const restoreOwnSession = createServerFn({ method: "POST" })
  .validator((data: { sessionId: number; status: "requested" | "confirmed" }) => data)
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const rows = await sql<SessionRow>`
      select s.* from sessions s
      join dogs d on d.id = s.dog_id
      where s.id = ${data.sessionId} and d.owner_user_id = ${context.userId}
    `;
    const session = rows[0];
    if (!session) throw new Error("Not found");
    if (session.status !== "cancelled") throw new Error("This visit is no longer cancelled.");
    if (data.status !== "requested" && data.status !== "confirmed") {
      throw new Error("This visit can’t be restored.");
    }
    await sql`update sessions set status = ${data.status}, updated_at = now() where id = ${session.id}`;
    return { ok: true };
  });

export const rescheduleOwnSession = createServerFn({ method: "POST" })
  .validator((data: { sessionId: number; scheduledAt: string }) => data)
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const rows = await sql<SessionRow>`
      select s.* from sessions s
      join dogs d on d.id = s.dog_id
      where s.id = ${data.sessionId} and d.owner_user_id = ${context.userId}
    `;
    const session = rows[0];
    if (!session) throw new Error("Not found");
    if (session.status !== "requested" && session.status !== "confirmed") {
      throw new Error("This visit can’t be moved.");
    }
    const when = new Date(data.scheduledAt);
    if (Number.isNaN(when.getTime())) throw new Error("Pick a valid date and time.");
    if (when.getTime() < Date.now() - 60_000) throw new Error("Pick a time that’s still ahead.");
    const studio = await loadStudio();
    const minutes = session.duration_min || sessionTypeById(session.session_type).minutes;
    if (!isWithinHours(when, parseHours(studio.hours_json), minutes)) {
      throw new Error("That time isn’t open. Pick another.");
    }
    const stamp = "Asked for a new time.";
    const note = session.owner_notes.trim();
    const ownerNotes = note.includes(stamp) ? note : note ? `${note}\n${stamp}` : stamp;
    await sql`
      update sessions set
        scheduled_at = ${when.toISOString()},
        status = 'requested',
        owner_notes = ${ownerNotes},
        updated_at = now()
      where id = ${session.id}
    `;
    return { ok: true };
  });
