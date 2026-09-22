import { getSql } from "@/lib/db";
import type { DogRow, StudioRow } from "@/lib/types";

export async function loadStudio(): Promise<StudioRow> {
  const sql = await getSql();
  const rows = await sql<StudioRow>`select id, owner_user_id, name, email, phone, instagram, facebook, x_url from studio where id = 1`;
  const row = rows[0];
  if (!row) {
    throw new Error("Studio is not initialized");
  }
  return row;
}

export async function requireTrainer(userId: string): Promise<StudioRow> {
  const studio = await loadStudio();
  if (!studio.owner_user_id || studio.owner_user_id !== userId) {
    throw new Error("Forbidden");
  }
  return studio;
}

export async function userEmail(userId: string): Promise<string | null> {
  const sql = await getSql();
  const rows = await sql<{ email: string | null }>`select email from "user" where id = ${userId}`;
  return rows[0]?.email ?? null;
}

export async function linkDogsByEmail(userId: string, email: string | null) {
  if (!email) return;
  const studio = await loadStudio();
  if (studio.owner_user_id === userId) return;
  const sql = await getSql();
  await sql`
    update dogs
    set owner_user_id = ${userId}, updated_at = now()
    where lower(owner_email) = lower(${email})
      and (owner_user_id is null or owner_user_id = ${userId})
  `;
}

export async function assertDogAccess(userId: string, dogId: number): Promise<DogRow> {
  const sql = await getSql();
  const studio = await loadStudio();
  const rows = await sql<DogRow>`select * from dogs where id = ${dogId}`;
  const dog = rows[0];
  if (!dog) throw new Error("Not found");
  const isTrainer = studio.owner_user_id === userId;
  const isOwner = dog.owner_user_id === userId;
  if (!isTrainer && !isOwner) throw new Error("Forbidden");
  if (isOwner && !isTrainer) {
    dog.trainer_private_notes = "";
  }
  return dog;
}

export function stripPrivate<T extends { trainer_private_notes?: string }>(
  row: T,
  isTrainer: boolean,
): T {
  if (isTrainer) return row;
  return { ...row, trainer_private_notes: "" };
}
