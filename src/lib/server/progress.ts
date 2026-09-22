import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import type { ProgressLogRow, ProgressRow } from "@/lib/types";
import { assertDogAccess, requireTrainer } from "./helpers";
import { seedProgressForDog } from "./progress-seed";

export const getProgress = createServerFn({ method: "GET" })
  .validator((data: { dogId: number }) => data)
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    await assertDogAccess(context.userId, data.dogId);
    await seedProgressForDog(data.dogId);
    const sql = await getSql();
    const current = await sql<ProgressRow>`
      select * from progress where dog_id = ${data.dogId} order by skill_key
    `;
    const log = await sql<ProgressLogRow>`
      select * from progress_log where dog_id = ${data.dogId} order by created_at desc limit 80
    `;
    return { current, log };
  });

export const updateSkillProgress = createServerFn({ method: "POST" })
  .validator((data: { dogId: number; skillKey: string; rating: number; comment: string; sessionId?: number | null }) => data)
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    await requireTrainer(context.userId);
    const rating = Math.min(7, Math.max(0, Math.round(data.rating)));
    const sql = await getSql();
    await sql`
      insert into progress (dog_id, skill_key, rating, comment, updated_by, updated_at)
      values (${data.dogId}, ${data.skillKey}, ${rating}, ${data.comment}, ${context.userId}, now())
      on conflict (dog_id, skill_key) do update set
        rating = excluded.rating,
        comment = excluded.comment,
        updated_by = excluded.updated_by,
        updated_at = now()
    `;
    await sql`
      insert into progress_log (dog_id, session_id, skill_key, rating, comment, created_by)
      values (${data.dogId}, ${data.sessionId ?? null}, ${data.skillKey}, ${rating}, ${data.comment}, ${context.userId})
    `;
    return { ok: true };
  });

export const updateSkillBatch = createServerFn({ method: "POST" })
  .validator(
    (data: {
      dogId: number;
      sessionId?: number | null;
      items: Array<{ skillKey: string; rating: number; comment: string }>;
    }) => data,
  )
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    await requireTrainer(context.userId);
    const sql = await getSql();
    for (const item of data.items) {
      const rating = Math.min(7, Math.max(0, Math.round(item.rating)));
      await sql`
        insert into progress (dog_id, skill_key, rating, comment, updated_by, updated_at)
        values (${data.dogId}, ${item.skillKey}, ${rating}, ${item.comment}, ${context.userId}, now())
        on conflict (dog_id, skill_key) do update set
          rating = excluded.rating,
          comment = excluded.comment,
          updated_by = excluded.updated_by,
          updated_at = now()
      `;
      await sql`
        insert into progress_log (dog_id, session_id, skill_key, rating, comment, created_by)
        values (${data.dogId}, ${data.sessionId ?? null}, ${item.skillKey}, ${rating}, ${item.comment}, ${context.userId})
      `;
    }
    return { ok: true };
  });
