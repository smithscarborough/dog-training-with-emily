import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import type { DogRow } from "@/lib/types";
import { assertDogAccess, requireTrainer, stripPrivate } from "./helpers";
import { seedProgressForDog } from "./progress-seed";

export type IntakeInput = {
  owner_name: string;
  owner_email: string;
  owner_phone: string;
  address: string;
  name: string;
  breed: string;
  age_text: string;
  weight_text: string;
  allergies: string;
  sex: string;
  spayed_neutered: string;
  goals: string[];
  goals_other: string;
  dislikes: string;
  past_experiences: string;
  physical_limitations: string;
  household: string;
  other_pets: string;
  kids_in_home: string;
  vet_info: string;
  preferred_days: string;
  referral_source: string;
  photo_url: string | null;
};

function cleanIntake(data: IntakeInput): IntakeInput {
  const trim = (s: string) => s.trim();
  if (!trim(data.owner_name)) throw new Error("Owner name is required.");
  if (!trim(data.owner_email)) throw new Error("Email is required.");
  if (!trim(data.owner_phone)) throw new Error("Phone is required.");
  if (!trim(data.name)) throw new Error("Dog name is required.");
  return {
    ...data,
    owner_name: trim(data.owner_name),
    owner_email: trim(data.owner_email),
    owner_phone: trim(data.owner_phone),
    address: trim(data.address),
    name: trim(data.name),
    breed: trim(data.breed),
    age_text: trim(data.age_text),
    weight_text: trim(data.weight_text),
    allergies: trim(data.allergies),
    sex: trim(data.sex),
    spayed_neutered: trim(data.spayed_neutered),
    goals: data.goals.map((g) => g.trim()).filter(Boolean),
    goals_other: trim(data.goals_other),
    dislikes: trim(data.dislikes),
    past_experiences: trim(data.past_experiences),
    physical_limitations: trim(data.physical_limitations),
    household: trim(data.household),
    other_pets: trim(data.other_pets),
    kids_in_home: trim(data.kids_in_home),
    vet_info: trim(data.vet_info),
    preferred_days: trim(data.preferred_days),
    referral_source: trim(data.referral_source),
    photo_url: data.photo_url?.trim() ? data.photo_url.trim() : null,
  };
}

export const submitPublicIntake = createServerFn({ method: "POST" })
  .validator((data: IntakeInput) => cleanIntake(data))
  .handler(async ({ data }) => {
    const sql = await getSql();
    let ownerId: string | null = null;
    try {
      const { getSessionUser } = await import("@/lib/auth/verify.server");
      const user = await getSessionUser();
      ownerId = user?.id ?? null;
    } catch {
      ownerId = null;
    }
    const inserted = await sql<{ id: number }>`
      insert into dogs (
        owner_user_id, owner_name, owner_email, owner_phone, address,
        name, breed, age_text, weight_text, allergies, sex, spayed_neutered,
        goals_json, goals_other, dislikes, past_experiences, physical_limitations,
        household, other_pets, kids_in_home, vet_info, preferred_days, referral_source,
        photo_url, status
      ) values (
        ${ownerId}, ${data.owner_name}, ${data.owner_email}, ${data.owner_phone}, ${data.address},
        ${data.name}, ${data.breed}, ${data.age_text}, ${data.weight_text}, ${data.allergies},
        ${data.sex}, ${data.spayed_neutered},
        ${JSON.stringify(data.goals)}, ${data.goals_other}, ${data.dislikes}, ${data.past_experiences},
        ${data.physical_limitations}, ${data.household}, ${data.other_pets}, ${data.kids_in_home},
        ${data.vet_info}, ${data.preferred_days}, ${data.referral_source},
        ${data.photo_url}, 'pending'
      ) returning id
    `;
    const id = inserted[0]?.id;
    if (!id) throw new Error("Could not save intake.");
    await seedProgressForDog(id);
    return { id };
  });

export const trainerCreateClient = createServerFn({ method: "POST" })
  .validator((data: IntakeInput) => cleanIntake(data))
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    await requireTrainer(context.userId);
    const sql = await getSql();
    const inserted = await sql<{ id: number }>`
      insert into dogs (
        owner_user_id, owner_name, owner_email, owner_phone, address,
        name, breed, age_text, weight_text, allergies, sex, spayed_neutered,
        goals_json, goals_other, dislikes, past_experiences, physical_limitations,
        household, other_pets, kids_in_home, vet_info, preferred_days, referral_source,
        photo_url, status
      ) values (
        null, ${data.owner_name}, ${data.owner_email}, ${data.owner_phone}, ${data.address},
        ${data.name}, ${data.breed}, ${data.age_text}, ${data.weight_text}, ${data.allergies},
        ${data.sex}, ${data.spayed_neutered},
        ${JSON.stringify(data.goals)}, ${data.goals_other}, ${data.dislikes}, ${data.past_experiences},
        ${data.physical_limitations}, ${data.household}, ${data.other_pets}, ${data.kids_in_home},
        ${data.vet_info}, ${data.preferred_days}, ${data.referral_source},
        ${data.photo_url}, 'active'
      ) returning id
    `;
    const id = inserted[0]?.id;
    if (!id) throw new Error("Could not create client.");
    await seedProgressForDog(id);
    return { id };
  });

export const getDog = createServerFn({ method: "GET" })
  .validator((data: { dogId: number }) => data)
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const dog = await assertDogAccess(context.userId, data.dogId);
    const { loadStudio } = await import("./helpers");
    const studio = await loadStudio();
    return stripPrivate(dog, studio.owner_user_id === context.userId);
  });

export const setDogStatus = createServerFn({ method: "POST" })
  .validator((data: { dogId: number; status: DogRow["status"] }) => data)
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    await requireTrainer(context.userId);
    const sql = await getSql();
    await sql`update dogs set status = ${data.status}, updated_at = now() where id = ${data.dogId}`;
    return { ok: true };
  });

export const setDogCredits = createServerFn({ method: "POST" })
  .validator((data: { dogId: number; credits: number }) => data)
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    await requireTrainer(context.userId);
    const credits = Math.max(0, Math.round(data.credits));
    const sql = await getSql();
    await sql`update dogs set credits = ${credits}, updated_at = now() where id = ${data.dogId}`;
    return { ok: true };
  });

export const saveTrainerNotes = createServerFn({ method: "POST" })
  .validator((data: { dogId: number; notes: string }) => data)
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    await requireTrainer(context.userId);
    const sql = await getSql();
    await sql`update dogs set trainer_private_notes = ${data.notes}, updated_at = now() where id = ${data.dogId}`;
    return { ok: true };
  });

export const updateDogPhoto = createServerFn({ method: "POST" })
  .validator((data: { dogId: number; photo_url: string | null }) => data)
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const dog = await assertDogAccess(context.userId, data.dogId);
    const sql = await getSql();
    await sql`update dogs set photo_url = ${data.photo_url}, updated_at = now() where id = ${dog.id}`;
    return { ok: true };
  });
