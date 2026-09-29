import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import { CATALOG } from "@/lib/catalog";
import type { DogRow } from "@/lib/types";
import { assertDogAccess, loadStudio, requireTrainer, stripPrivate } from "./helpers";
import { seedProgressForDog } from "./progress-seed";
import { normalizeUsPhone } from "@/lib/phone";
import { formatUsAddress } from "@/lib/address";
import { formatEmail, formatProperName, formatSentenceStart } from "@/lib/text";
import { isWithinHours, parseHours } from "@/lib/hours";

export type IntakeInput = {
  owner_name: string;
  owner_email: string;
  owner_phone: string;
  address: string;
  name: string;
  breed: string;
  age_text: string;
  birthday: string;
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
  preferred_at: string;
  photo_url: string | null;
};

function cleanBirthday(value: string): string {
  const raw = value.trim();
  if (!raw) return "";
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
  if (!match) throw new Error("Birthday should be a real date.");
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    throw new Error("Birthday should be a real date.");
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (date > today) throw new Error("Birthday can’t be in the future.");
  if (year < 1980) throw new Error("Check the birth year.");
  return raw;
}

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
    owner_phone: normalizeUsPhone(data.owner_phone, true),
    address: trim(data.address),
    name: trim(data.name),
    breed: trim(data.breed),
    age_text: trim(data.age_text),
    birthday: cleanBirthday(data.birthday ?? ""),
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
    preferred_at: data.preferred_at?.trim() ?? "",
    photo_url: data.photo_url?.trim() ? data.photo_url.trim() : null,
  };
}

async function assertPreferred(preferredAt: string) {
  if (!preferredAt) return;
  const when = new Date(preferredAt);
  if (Number.isNaN(when.getTime()) || when.getTime() < Date.now() - 60_000) {
    throw new Error("Pick a time that’s still ahead.");
  }
  const studio = await loadStudio();
  if (!isWithinHours(when, parseHours(studio.hours_json), 30)) {
    throw new Error("That time isn’t open. Pick another.");
  }
}

export const submitPublicIntake = createServerFn({ method: "POST" })
  .validator((data: IntakeInput) => cleanIntake(data))
  .handler(async ({ data }) => {
    const sql = await getSql();
    await assertPreferred(data.preferred_at);
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
        name, breed, age_text, birthday, weight_text, allergies, sex, spayed_neutered,
        goals_json, goals_other, dislikes, past_experiences, physical_limitations,
        household, other_pets, kids_in_home, vet_info, preferred_days, referral_source,
        preferred_at, photo_url, status
      ) values (
        ${ownerId}, ${data.owner_name}, ${data.owner_email}, ${data.owner_phone}, ${data.address},
        ${data.name}, ${data.breed}, ${data.age_text}, ${data.birthday}, ${data.weight_text}, ${data.allergies},
        ${data.sex}, ${data.spayed_neutered},
        ${JSON.stringify(data.goals)}, ${data.goals_other}, ${data.dislikes}, ${data.past_experiences},
        ${data.physical_limitations}, ${data.household}, ${data.other_pets}, ${data.kids_in_home},
        ${data.vet_info}, ${data.preferred_days}, ${data.referral_source},
        ${data.preferred_at}, ${data.photo_url}, 'pending'
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
    await assertPreferred(data.preferred_at);
    const sql = await getSql();
    const inserted = await sql<{ id: number }>`
      insert into dogs (
        owner_user_id, owner_name, owner_email, owner_phone, address,
        name, breed, age_text, birthday, weight_text, allergies, sex, spayed_neutered,
        goals_json, goals_other, dislikes, past_experiences, physical_limitations,
        household, other_pets, kids_in_home, vet_info, preferred_days, referral_source,
        preferred_at, photo_url, status
      ) values (
        null, ${data.owner_name}, ${data.owner_email}, ${data.owner_phone}, ${data.address},
        ${data.name}, ${data.breed}, ${data.age_text}, ${data.birthday}, ${data.weight_text}, ${data.allergies},
        ${data.sex}, ${data.spayed_neutered},
        ${JSON.stringify(data.goals)}, ${data.goals_other}, ${data.dislikes}, ${data.past_experiences},
        ${data.physical_limitations}, ${data.household}, ${data.other_pets}, ${data.kids_in_home},
        ${data.vet_info}, ${data.preferred_days}, ${data.referral_source},
        ${data.preferred_at}, ${data.photo_url}, 'active'
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

export const setDogBirthday = createServerFn({ method: "POST" })
  .validator((data: { dogId: number; birthday: string }) => ({
    dogId: data.dogId,
    birthday: cleanBirthday(data.birthday ?? ""),
  }))
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    await requireTrainer(context.userId);
    const sql = await getSql();
    await sql`update dogs set birthday = ${data.birthday}, updated_at = now() where id = ${data.dogId}`;
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

export const setVisibleSkills = createServerFn({ method: "POST" })
  .validator((data: { dogId: number; keys: string[] }) => data)
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    await requireTrainer(context.userId);
    const allowed = new Set(CATALOG.map((item) => item.key));
    const keys = [...new Set(data.keys.filter((key) => allowed.has(key)))];
    const sql = await getSql();
    await sql`
      update dogs
      set visible_skills_json = ${JSON.stringify(keys)}, updated_at = now()
      where id = ${data.dogId}
    `;
    return { keys };
  });

const SEX = new Set(["", "Female", "Male"]);
const ALTERED = new Set(["", "Yes", "No", "Not yet"]);

function clip(value: string, max: number) {
  return value.trim().slice(0, max);
}

export type ProfileInput = {
  dogId: number;
  owner_name: string;
  owner_email: string;
  owner_phone: string;
  address: string;
  name: string;
  breed: string;
  age_text: string;
  birthday: string;
  weight_text: string;
  allergies: string;
  sex: string;
  spayed_neutered: string;
  dislikes: string;
  past_experiences: string;
  physical_limitations: string;
  household: string;
  other_pets: string;
  kids_in_home: string;
  vet_info: string;
  preferred_days: string;
};

function emptyMark(value: string) {
  const v = (value ?? "").trim();
  if (v === "—" || v === "–" || v === "-" || v === "---") return "";
  return v;
}

function cleanProfile(data: ProfileInput): ProfileInput {
  const owner_name = formatProperName(clip(data.owner_name ?? "", 80));
  const name = formatProperName(clip(data.name ?? "", 80));
  const owner_email = formatEmail(clip(data.owner_email ?? "", 120));
  const address = formatUsAddress(clip(data.address ?? "", 200));
  if (!owner_name) throw new Error("Your name is required.");
  if (!name) throw new Error("Your dog’s name is required.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(owner_email)) throw new Error("Enter a real email.");
  if (!address) throw new Error("Home address is required.");
  const sex = emptyMark(clip(data.sex ?? "", 20));
  const spayedRaw = emptyMark(clip(data.spayed_neutered ?? "", 20));
  const spayed = spayedRaw === "Spayed" || spayedRaw === "Neutered" ? "Yes" : spayedRaw;
  if (!SEX.has(sex) || !ALTERED.has(spayed)) throw new Error("Check the sex and spay choices.");
  return {
    dogId: data.dogId,
    owner_name,
    owner_email,
    owner_phone: normalizeUsPhone(data.owner_phone ?? "", true),
    address,
    name,
    breed: formatProperName(clip(data.breed ?? "", 80)),
    age_text: formatSentenceStart(clip(data.age_text ?? "", 80)),
    birthday: cleanBirthday(data.birthday ?? ""),
    weight_text: clip(data.weight_text ?? "", 40),
    allergies: formatSentenceStart(clip(data.allergies ?? "", 400)),
    sex,
    spayed_neutered: spayed,
    dislikes: formatSentenceStart(clip(data.dislikes ?? "", 2000)),
    past_experiences: formatSentenceStart(clip(data.past_experiences ?? "", 2000)),
    physical_limitations: formatSentenceStart(clip(data.physical_limitations ?? "", 2000)),
    household: formatSentenceStart(clip(data.household ?? "", 200)),
    other_pets: formatSentenceStart(clip(data.other_pets ?? "", 200)),
    kids_in_home: formatSentenceStart(clip(data.kids_in_home ?? "", 200)),
    vet_info: formatProperName(clip(data.vet_info ?? "", 200)),
    preferred_days: formatSentenceStart(clip(data.preferred_days ?? "", 200)),
  };
}

export const updateOwnProfile = createServerFn({ method: "POST" })
  .validator((data: ProfileInput) => cleanProfile(data))
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const dog = await assertDogAccess(context.userId, data.dogId);
    if (dog.owner_user_id !== context.userId) throw new Error("Only the household can update this.");
    const sql = await getSql();
    await sql`
      update dogs set
        owner_name = ${data.owner_name},
        owner_email = ${data.owner_email},
        owner_phone = ${data.owner_phone},
        address = ${data.address},
        name = ${data.name},
        breed = ${data.breed},
        age_text = ${data.age_text},
        birthday = ${data.birthday},
        weight_text = ${data.weight_text},
        allergies = ${data.allergies},
        sex = ${data.sex},
        spayed_neutered = ${data.spayed_neutered},
        dislikes = ${data.dislikes},
        past_experiences = ${data.past_experiences},
        physical_limitations = ${data.physical_limitations},
        household = ${data.household},
        other_pets = ${data.other_pets},
        kids_in_home = ${data.kids_in_home},
        vet_info = ${data.vet_info},
        preferred_days = ${data.preferred_days},
        updated_at = now()
      where id = ${dog.id}
    `;
    return { ok: true };
  });

export const updateDogPhoto = createServerFn({ method: "POST" })
  .validator((data: { dogId: number; photo_url: string | null }) => data)
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const dog = await assertDogAccess(context.userId, data.dogId);
    const sql = await getSql();
    const photo = data.photo_url?.trim() ? data.photo_url.trim() : null;
    if (photo && (!photo.startsWith("data:image/jpeg;base64,") || photo.length > 1_500_000)) {
      throw new Error("That photo couldn’t be saved. Try a JPG or PNG.");
    }
    await sql`update dogs set photo_url = ${photo}, updated_at = now() where id = ${dog.id}`;
    return { ok: true };
  });
