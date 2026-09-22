import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import { sessionTypeById } from "@/lib/catalog";
import type { SessionRow } from "@/lib/types";
import { assertDogAccess, loadStudio, requireTrainer, stripPrivate } from "./helpers";

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
    const sql = await getSql();
    const studio = await loadStudio();
    const isTrainer = studio.owner_user_id === context.userId;
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
    if (data.status === "completed" && session.status !== "completed") {
      await sql`update dogs set credits = greatest(credits - 1, 0), updated_at = now() where id = ${session.dog_id}`;
    }
    await sql`update sessions set status = ${data.status}, updated_at = now() where id = ${data.sessionId}`;
    return { ok: true };
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
      select s.* from sessions s
      join dogs d on d.id = s.dog_id
      where s.id = ${data.sessionId} and d.owner_user_id = ${context.userId}
    `;
    const session = rows[0];
    if (!session) throw new Error("Not found");
    if (session.status === "completed") throw new Error("Completed sessions cannot be cancelled.");
    await sql`update sessions set status = 'cancelled', updated_at = now() where id = ${session.id}`;
    return { ok: true };
  });
