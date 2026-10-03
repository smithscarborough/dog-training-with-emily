import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql, type Sql } from "@/lib/db";
import type { DogRow } from "@/lib/types";
import { requireTrainer } from "./helpers";

export type ReferralGift = { referred_name: string; created_at: string };

export function referralCodeBase(name: string) {
  const first = name.trim().split(/\s+/)[0] ?? "";
  const base = first
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z]/g, "")
    .toUpperCase();
  return (base || "FRIEND").slice(0, 12);
}

export function normalizeReferralCode(value: string) {
  return value.trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12);
}

export async function assignReferralCode(sql: Sql, dogId: number, ownerName: string) {
  const base = referralCodeBase(ownerName);
  for (let n = 0; n < 30; n++) {
    const code = n === 0 ? base : `${base.slice(0, 10)}${n + 1}`;
    const taken = await sql<{ id: number }>`select id from dogs where referral_code = ${code} limit 1`;
    if (taken.length) continue;
    const updated = await sql<{ referral_code: string }>`
      update dogs set referral_code = ${code}
      where id = ${dogId} and referral_code = ''
      returning referral_code
    `;
    if (updated[0]) return updated[0].referral_code;
    const current = await sql<{ referral_code: string }>`select referral_code from dogs where id = ${dogId}`;
    if (current[0]?.referral_code) return current[0].referral_code;
  }
  return "";
}

export async function ensureReferralCodes(sql: Sql, dogs: DogRow[]) {
  for (const dog of dogs) {
    if (dog.referral_code) continue;
    dog.referral_code = await assignReferralCode(sql, dog.id, dog.owner_name);
  }
}

/** One free hour for the referrer, once the referred consult is actually completed. */
export async function grantReferralHour(sql: Sql, referredDogId: number): Promise<string | null> {
  const rows = await sql<{ referred_by_code: string; owner_name: string }>`
    select referred_by_code, owner_name from dogs where id = ${referredDogId}
  `;
  const dog = rows[0];
  const code = normalizeReferralCode(dog?.referred_by_code ?? "");
  if (!code) return null;
  const existing = await sql<{ id: number }>`
    select id from referral_gifts where referred_dog_id = ${referredDogId} limit 1
  `;
  if (existing.length) return null;
  const referrers = await sql<{ id: number; referral_code: string }>`
    select id, referral_code from dogs
    where referral_code = ${code} and id <> ${referredDogId}
    limit 1
  `;
  const referrer = referrers[0];
  if (!referrer) return null;
  await sql`update dogs set credits = credits + 1, updated_at = now() where id = ${referrer.id}`;
  await sql`
    insert into referral_gifts (referrer_dog_id, referred_dog_id, referred_name)
    values (${referrer.id}, ${referredDogId}, ${dog.owner_name})
  `;
  return referrer.referral_code;
}

export async function revokeReferralHour(sql: Sql, referredDogId: number) {
  const gifts = await sql<{ id: number; referrer_dog_id: number }>`
    select id, referrer_dog_id from referral_gifts where referred_dog_id = ${referredDogId} limit 1
  `;
  const gift = gifts[0];
  if (!gift) return;
  await sql`update dogs set credits = greatest(credits - 1, 0), updated_at = now() where id = ${gift.referrer_dog_id}`;
  await sql`delete from referral_gifts where id = ${gift.id}`;
}

export async function attachReferrals(sql: Sql, dogs: DogRow[]) {
  await ensureReferralCodes(sql, dogs);
  if (!dogs.length) return dogs;
  const gifts = await sql<{
    referrer_dog_id: number;
    referred_dog_id: number | null;
    referred_name: string;
    created_at: string;
    referrer_code: string;
  }>`
    select g.referrer_dog_id, g.referred_dog_id, g.referred_name, g.created_at, d.referral_code as referrer_code
    from referral_gifts g
    join dogs d on d.id = g.referrer_dog_id
    order by g.created_at desc
  `;
  for (const dog of dogs) {
    dog.referral_gifts = gifts
      .filter((gift) => gift.referrer_dog_id === dog.id)
      .map((gift) => ({ referred_name: gift.referred_name, created_at: gift.created_at }));
    dog.thanked_referrer_code =
      gifts.find((gift) => gift.referred_dog_id === dog.id)?.referrer_code ?? "";
  }
  return dogs;
}

export const giveThankYouHour = createServerFn({ method: "POST" })
  .validator((data: { dogId: number; name: string }) => data)
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    await requireTrainer(context.userId);
    const name = data.name.trim().replace(/\s+/g, " ").slice(0, 80);
    if (!name) throw new Error("Add the person’s name.");
    const sql = await getSql();
    const dogs = await sql<{ id: number }>`select id from dogs where id = ${data.dogId}`;
    if (!dogs[0]) throw new Error("Not found");
    await sql`update dogs set credits = credits + 1, updated_at = now() where id = ${data.dogId}`;
    await sql`
      insert into referral_gifts (referrer_dog_id, referred_dog_id, referred_name)
      values (${data.dogId}, null, ${name})
    `;
    return { ok: true };
  });

export const setReferredByCode = createServerFn({ method: "POST" })
  .validator((data: { dogId: number; code: string }) => data)
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    await requireTrainer(context.userId);
    const code = normalizeReferralCode(data.code);
    const sql = await getSql();
    const dogs = await sql<{ id: number }>`select id from dogs where id = ${data.dogId}`;
    if (!dogs[0]) throw new Error("Not found");
    await sql`update dogs set referred_by_code = ${code}, updated_at = now() where id = ${data.dogId}`;
    const consults = await sql<{ id: number }>`
      select id from sessions
      where dog_id = ${data.dogId} and session_type = 'consult' and status = 'completed'
      limit 1
    `;
    const thanked = consults.length ? await grantReferralHour(sql, data.dogId) : null;
    return { thanked };
  });
