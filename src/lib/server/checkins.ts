import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import { CHECKINS, type CheckinStatus } from "@/lib/catalog";
import type { CheckinRow } from "@/lib/types";
import { assertDogAccess, loadStudio } from "./helpers";

const STATUSES = new Set(CHECKINS.map((c) => c.id));

function asStatus(value: string): CheckinStatus {
  if (!STATUSES.has(value as CheckinStatus)) {
    throw new Error("Pick practiced, skipped, or stuck.");
  }
  return value as CheckinStatus;
}

export const listCheckins = createServerFn({ method: "GET" })
  .validator((data: { dogId?: number; limit?: number } | undefined) => data ?? {})
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const studio = await loadStudio();
    const isTrainer = studio.owner_user_id === context.userId;
    const sql = await getSql();
    const limit = Math.min(Math.max(data.limit ?? 12, 1), 40);
    let rows: CheckinRow[];
    if (isTrainer) {
      rows = data.dogId
        ? await sql<CheckinRow>`
            select c.*, d.name as dog_name, d.owner_name
            from checkins c join dogs d on d.id = c.dog_id
            where c.dog_id = ${data.dogId}
            order by c.created_at desc
            limit ${limit}
          `
        : await sql<CheckinRow>`
            select c.*, d.name as dog_name, d.owner_name
            from checkins c join dogs d on d.id = c.dog_id
            order by c.created_at desc
            limit ${limit}
          `;
    } else {
      rows = data.dogId
        ? await sql<CheckinRow>`
            select c.*, d.name as dog_name, d.owner_name
            from checkins c join dogs d on d.id = c.dog_id
            where c.dog_id = ${data.dogId} and d.owner_user_id = ${context.userId}
            order by c.created_at desc
            limit ${limit}
          `
        : await sql<CheckinRow>`
            select c.*, d.name as dog_name, d.owner_name
            from checkins c join dogs d on d.id = c.dog_id
            where d.owner_user_id = ${context.userId}
            order by c.created_at desc
            limit ${limit}
          `;
    }
    return rows;
  });

export const submitCheckin = createServerFn({ method: "POST" })
  .validator((data: { dogId: number; status: string; note: string }) => data)
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const studio = await loadStudio();
    if (studio.owner_user_id === context.userId) {
      throw new Error("Check-ins come from the household.");
    }
    const dog = await assertDogAccess(context.userId, data.dogId);
    const status = asStatus(data.status);
    const note = data.note.trim().slice(0, 600);
    const sql = await getSql();
    const recent = await sql<CheckinRow>`
      select * from checkins
      where dog_id = ${dog.id}
      order by created_at desc
      limit 1
    `;
    const last = recent[0];
    const eighteenHours = 18 * 60 * 60 * 1000;
    if (last && Date.now() - new Date(last.created_at).getTime() < eighteenHours) {
      const updated = await sql<CheckinRow>`
        update checkins
        set status = ${status}, note = ${note}, updated_at = now()
        where id = ${last.id}
        returning *
      `;
      return updated[0]!;
    }
    const inserted = await sql<CheckinRow>`
      insert into checkins (dog_id, owner_user_id, status, note)
      values (${dog.id}, ${context.userId}, ${status}, ${note})
      returning *
    `;
    return inserted[0]!;
  });
