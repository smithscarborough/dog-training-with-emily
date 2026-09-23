import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import type { DogRow, MePayload } from "@/lib/types";
import { linkDogsByEmail, loadStudio, stripPrivate, userEmail } from "./helpers";
import { ensureDemoSeed } from "./seed-demo";
import { normalizeUsPhone } from "@/lib/phone";

export const getMe = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<MePayload> => {
    await ensureDemoSeed();
    const studio = await loadStudio();
    const email = await userEmail(context.userId);
    await linkDogsByEmail(context.userId, email);
    const isTrainer = studio.owner_user_id === context.userId;
    const sql = await getSql();
    const dogs = isTrainer
      ? await sql<DogRow>`select * from dogs order by created_at desc`
      : await sql<DogRow>`select * from dogs where owner_user_id = ${context.userId} order by created_at desc`;
    return {
      userId: context.userId,
      email,
      isTrainer,
      studioClaimed: Boolean(studio.owner_user_id),
      studio,
      dogs: dogs.map((d) => stripPrivate(d, isTrainer)),
    };
  });

function normalizePin(pin: string) {
  return pin.trim().toUpperCase();
}

export const becomeTrainer = createServerFn({ method: "POST" })
  .validator((data: { pin: string }) => data)
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const pin = normalizePin(data.pin);
    if (pin.length < 4) throw new Error("Enter the trainer code.");
    const sql = await getSql();
    const rows = await sql<{ trainer_pin: string | null; owner_user_id: string | null }>`
      select trainer_pin, owner_user_id from studio where id = 1
    `;
    const row = rows[0];
    if (!row) throw new Error("Studio is not initialized");
    const expected = normalizePin(row.trainer_pin ?? "TEDDY");
    if (pin !== expected) throw new Error("That trainer code doesn't match.");
    await sql`update studio set owner_user_id = ${context.userId}, updated_at = now() where id = 1`;
    return { ok: true };
  });

export const updateTrainerPin = createServerFn({ method: "POST" })
  .validator((data: { pin: string }) => data)
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const { requireTrainer } = await import("./helpers");
    await requireTrainer(context.userId);
    const pin = normalizePin(data.pin);
    if (pin.length < 4 || pin.length > 24) {
      throw new Error("Choose a code between 4 and 24 characters.");
    }
    const sql = await getSql();
    await sql`update studio set trainer_pin = ${pin}, updated_at = now() where id = 1`;
    return { ok: true };
  });

export const releaseStudio = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { requireTrainer } = await import("./helpers");
    await requireTrainer(context.userId);
    const sql = await getSql();
    await sql`update studio set owner_user_id = null, updated_at = now() where id = 1`;
    return { ok: true };
  });

export const updateStudioContact = createServerFn({ method: "POST" })
  .validator((data: { email: string; phone: string; instagram: string; facebook: string; x_url: string }) => data)
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const { requireTrainer } = await import("./helpers");
    await requireTrainer(context.userId);
    const sql = await getSql();
    await sql`
      update studio set
        email = ${data.email.trim()},
        phone = ${normalizeUsPhone(data.phone, false)},
        instagram = ${data.instagram.trim()},
        facebook = ${data.facebook.trim()},
        x_url = ${data.x_url.trim()},
        updated_at = now()
      where id = 1
    `;
    return { ok: true };
  });
