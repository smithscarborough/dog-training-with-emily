import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import type { MessageRow } from "@/lib/types";
import { assertDogAccess, loadStudio, requireTrainer } from "./helpers";

function token() {
  const bytes = new Uint8Array(18);
  crypto.getRandomValues(bytes);
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function clip(value: string) {
  const body = value.trim().slice(0, 800);
  if (!body) throw new Error("Write a note first.");
  return body;
}

export const listMessages = createServerFn({ method: "GET" })
  .validator((data: { dogId: number }) => data)
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    await assertDogAccess(context.userId, data.dogId);
    const sql = await getSql();
    return sql<MessageRow>`
      select * from messages
      where dog_id = ${data.dogId}
      order by created_at asc, id asc
    `;
  });

export const recordHouseholdNote = createServerFn({ method: "POST" })
  .validator((data: { dogId: number; body: string }) => data)
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const dog = await assertDogAccess(context.userId, data.dogId);
    const studio = await loadStudio();
    if (studio.owner_user_id === context.userId) {
      throw new Error("Notes come from the household.");
    }
    const body = data.body.trim().slice(0, 800);
    if (!body) return { posted: false as const, token: null, dogName: dog.name, ownerName: dog.owner_name };
    const sql = await getSql();
    const last = await sql<MessageRow>`
      select * from messages
      where dog_id = ${dog.id} and author = 'client'
      order by id desc
      limit 1
    `;
    if (last[0]?.body === body) {
      return { posted: false as const, token: last[0].reply_token, dogName: dog.name, ownerName: dog.owner_name };
    }
    const replyToken = token();
    await sql`
      insert into messages (dog_id, author, body, read_by_client, read_by_trainer, reply_token)
      values (${dog.id}, 'client', ${body}, true, false, ${replyToken})
    `;
    return { posted: true as const, token: replyToken, dogName: dog.name, ownerName: dog.owner_name };
  });

export const deleteOwnNote = createServerFn({ method: "POST" })
  .validator((data: { messageId: number }) => data)
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const rows = await sql<MessageRow>`
      select m.* from messages m
      join dogs d on d.id = m.dog_id
      where m.id = ${data.messageId} and d.owner_user_id = ${context.userId}
    `;
    const message = rows[0];
    if (!message) throw new Error("Not found");
    if (message.author !== "client") throw new Error("You can only remove your own notes.");
    await sql`delete from messages where id = ${message.id}`;
    return { ok: true };
  });

export const replyAsTrainer = createServerFn({ method: "POST" })
  .validator((data: { dogId: number; body: string }) => data)
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    await requireTrainer(context.userId);
    await assertDogAccess(context.userId, data.dogId);
    const body = clip(data.body);
    const sql = await getSql();
    await sql`
      update messages
      set read_by_trainer = true
      where dog_id = ${data.dogId} and author = 'client' and read_by_trainer = false
    `;
    const rows = await sql<MessageRow>`
      insert into messages (dog_id, author, body, read_by_trainer, read_by_client)
      values (${data.dogId}, 'trainer', ${body}, true, false)
      returning *
    `;
    return rows[0]!;
  });

export const markClientRead = createServerFn({ method: "POST" })
  .validator((data: { dogId: number }) => data)
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const dog = await assertDogAccess(context.userId, data.dogId);
    if (dog.owner_user_id !== context.userId) return { ok: true };
    const sql = await getSql();
    await sql`
      update messages
      set read_by_client = true
      where dog_id = ${data.dogId} and author = 'trainer' and read_by_client = false
    `;
    return { ok: true };
  });

export const listPendingNotes = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await requireTrainer(context.userId);
    const sql = await getSql();
    return sql<MessageRow>`
      select m.*, d.name as dog_name, d.owner_name
      from messages m
      join dogs d on d.id = m.dog_id
      join (
        select dog_id, max(id) as id
        from messages
        group by dog_id
      ) latest on latest.id = m.id
      where m.author = 'client'
      order by m.created_at desc
    `;
  });

export const getReplyPrompt = createServerFn({ method: "GET" })
  .validator((data: { token: string }) => data)
  .handler(async ({ data }) => {
    const replyToken = data.token.trim();
    if (!/^[a-f0-9]{36}$/.test(replyToken)) return null;
    const sql = await getSql();
    const rows = await sql<MessageRow>`
      select m.body, m.created_at, d.name as dog_name, d.owner_name
      from messages m
      join dogs d on d.id = m.dog_id
      where m.reply_token = ${replyToken} and m.author = 'client'
      limit 1
    `;
    const row = rows[0];
    if (!row) return null;
    return {
      dogName: row.dog_name ?? "",
      ownerName: row.owner_name ?? "",
      body: row.body,
      createdAt: row.created_at,
    };
  });

export const replyFromEmail = createServerFn({ method: "POST" })
  .validator((data: { token: string; body: string }) => data)
  .handler(async ({ data }) => {
    const replyToken = data.token.trim();
    if (!/^[a-f0-9]{36}$/.test(replyToken)) throw new Error("This reply link isn’t valid.");
    const body = clip(data.body);
    const sql = await getSql();
    const rows = await sql<{ dog_id: number; dog_name: string }>`
      select m.dog_id, d.name as dog_name
      from messages m
      join dogs d on d.id = m.dog_id
      where m.reply_token = ${replyToken} and m.author = 'client'
      limit 1
    `;
    const row = rows[0];
    if (!row) throw new Error("This reply link isn’t valid.");
    await sql`
      update messages
      set read_by_trainer = true
      where dog_id = ${row.dog_id} and author = 'client' and read_by_trainer = false
    `;
    await sql`
      insert into messages (dog_id, author, body, read_by_trainer, read_by_client)
      values (${row.dog_id}, 'trainer', ${body}, true, false)
    `;
    return { dogName: row.dog_name };
  });
