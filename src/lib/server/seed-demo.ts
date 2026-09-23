import { randomUUID } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import { getSql } from "@/lib/db";
import { CATALOG } from "@/lib/catalog";
import { seedProgressForDog } from "./progress-seed";
import { QA_ADMIN } from "@/lib/qa-admin";

const DEMO_PASS = "PortalDemo1";
const DEMO_DOMAIN = "demo.local";
const HOUSEHOLDS: any[] = [
	{
		owner: {
			name: "Jordan Hale",
			email: `jordan.hale@${DEMO_DOMAIN}`,
			phone: "(713) 555-2214"
		},
		dog: {
			name: "Maple",
			breed: "Lab mix",
			age: "2 years",
			weight: "48 lbs",
			address: "1218 Oxford St, Houston, TX 77008",
			goals: [
				"reactivity",
				"leash",
				"doorway-manners"
			],
			goalsOther: "The doorbell is a full-body event. Walks are a tow.",
			dislikes: "The vacuum, sudden hats, the neighbor’s beagle",
			past: "Two group classes at 5 months. Sat nicely there; fell apart at home.",
			limits: "Mild hip tightness on long downs — keep them short on hardwood.",
			household: "Jordan and a roommate. Work from home three days a week.",
			otherPets: "None",
			kids: "Nieces on weekends, 6 and 9",
			vet: "Heights Veterinary — Dr. Patel",
			days: "Tue / Thu after 4, Saturday mornings",
			referral: "A friend from the Academy",
			status: "active",
			credits: 4,
			privateNotes: "Doorbell is the real job. Don’t start with tricks if the walk was a mess."
		},
		progress: {
			sit: {
				rating: 5,
				comment: "Clean in the kitchen. Softens when the door is in play."
			},
			down: {
				rating: 4,
				comment: "Fading the lure. Hardwood makes her hover — use the rug."
			},
			place: {
				rating: 3,
				comment: "Gets there. Duration dies when Amazon knocks."
			},
			stay: {
				rating: 3,
				comment: "Five seconds with me in sight."
			},
			"name-retention": {
				rating: 5,
				comment: "Name works in the house. Sidewalk is 50/50."
			},
			recall: {
				rating: 3,
				comment: "Yard is decent. Front-yard squirrels still win."
			},
			"impulse-control": {
				rating: 2,
				comment: "Doorbell. That’s the whole sentence."
			},
			"threshold-manners": {
				rating: 2,
				comment: "Still a rugby scrum. Hand on the chest, not the collar."
			},
			"leash-manners": {
				rating: 3,
				comment: "One block of slack, then she remembers she’s a lab."
			},
			"handler-focus": {
				rating: 4,
				comment: "Checking in on the quiet streets. Heights Blvd is loud."
			},
			settling: {
				rating: 3,
				comment: "Place after the walk is the reset. Don’t skip it."
			},
			"greeting-manners": {
				rating: 2,
				comment: "Four on the floor lasts one breath."
			},
			"doorway-manners": {
				rating: 2,
				comment: "Wait is installed. Release is a stampede."
			},
			"pattern-games": {
				rating: 4,
				comment: "Up-down on the stoop dropped the doorbell spike."
			}
		},
		sessions: [
			{
				type: "consult",
				daysAgo: 28,
				hour: 10,
				status: "completed",
				minutes: 30,
				recap: "Maple is a sweet, under-employed lab. The doorbell is the house’s emergency. Walks are exercise without a job.",
				homework: "Name game in the kitchen, 10 easy reps. Hand on the chest at the door — no opening until she finds the floor.",
				ownerNotes: "Please help with the door. Guests have stopped coming over."
			},
			{
				type: "hour",
				daysAgo: 21,
				hour: 16,
				status: "completed",
				minutes: 60,
				recap: "Installed place on the living-room cot. Practiced wait at the interior gate. Maple can do this when the world is quiet.",
				homework: "Place during one meal. Release with ‘free’. If she leaves, reset — don’t lure her back.",
				ownerNotes: ""
			},
			{
				type: "hour",
				daysAgo: 10,
				hour: 16,
				status: "completed",
				minutes: 60,
				recap: "Leash in the Heights. Slack for a block, then the squirrel. Pattern game at the corner bought us a check-in.",
				homework: "Two 12-minute walks. Stop at every driveway. Name, then move. If she tows, plant and wait.",
				ownerNotes: "Saturday farmers market was a disaster."
			},
			{
				type: "hour",
				daysAgo: -4,
				hour: 16,
				status: "confirmed",
				minutes: 60,
				recap: "",
				homework: "",
				ownerNotes: "Can we work the actual front door this time?"
			}
		],
		checkins: [{
			hoursAgo: 20,
			status: "practiced",
			note: "Place during dinner worked. Doorbell still a 10. We paused the walk when she towed, like you said."
		}]
	},
	{
		owner: {
			name: "Priya Shah",
			email: `priya.shah@${DEMO_DOMAIN}`,
			phone: "(832) 555-0190"
		},
		dog: {
			name: "Bean",
			breed: "Goldendoodle",
			age: "14 weeks",
			weight: "12 lbs",
			address: "409 Westheimer Rd, Houston, TX 77006",
			goals: [
				"puppy-basics",
				"name-retention",
				"crate-comfort",
				"bite-inhibition"
			],
			goalsOther: "Mouthy with guests. Naps are a negotiation.",
			dislikes: "Being picked up from behind, the hair dryer",
			past: "Two weeks home from a Cypress breeder. No classes yet.",
			limits: "None known. Vaccines on schedule.",
			household: "Priya and Sam. Apartment, third floor.",
			otherPets: "None",
			kids: "No",
			vet: "Montrose Vet Clinic",
			days: "Weekday mornings before 11, Sunday afternoons",
			referral: "Instagram",
			status: "active",
			credits: 2,
			privateNotes: "Puppy. Protect naps. Don’t pile on cues. Mouthing is tired, not dominant."
		},
		progress: {
			sit: {
				rating: 3,
				comment: "Easy in the kitchen with a cookie. Duration is a rumor."
			},
			"name-retention": {
				rating: 2,
				comment: "Name is starting to mean ‘look’. Keep it cheap and happy."
			},
			"crate-comfort": {
				rating: 2,
				comment: "Goes in for meals. Naps still happen under the coffee table."
			},
			"impulse-control": {
				rating: 1,
				comment: "Intro only. She’s 14 weeks. We’re not in a hurry."
			},
			settling: {
				rating: 1,
				comment: "Needs a pen and a frozen Kong more than a down-stay."
			},
			"food-manners": {
				rating: 2,
				comment: "Hand-feeding is going well. Bowl wait is next."
			},
			"handling-comfort": {
				rating: 2,
				comment: "Collar on/off without a wrestle. Nails later."
			},
			"enrichment-engagement": {
				rating: 3,
				comment: "Snuffle mat is her favorite job."
			}
		},
		sessions: [{
			type: "consult",
			daysAgo: 8,
			hour: 9,
			status: "completed",
			minutes: 30,
			recap: "Bean is a normal mouthy doodle puppy in a small apartment. The job is sleep, name, and a crate that isn’t a jail.",
			homework: "Name game, 8 treats, twice a day. Crate meal. Enforce a nap after 60 minutes of being a tornado.",
			ownerNotes: "He bites our clothes. Is that aggression?"
		}, {
			type: "hour",
			daysAgo: -2,
			hour: 10,
			status: "requested",
			minutes: 60,
			recap: "",
			homework: "",
			ownerNotes: "Crate is still a fight at night. Help."
		}],
		checkins: [{
			hoursAgo: 6,
			status: "stuck",
			note: "Night crate is a howl-a-thon after 20 minutes. We don’t want to skip it, but we’re sleeping in the living room."
		}]
	},
	{
		owner: {
			name: "Luis Ortega",
			email: `luis.ortega@${DEMO_DOMAIN}`,
			phone: "(281) 555-7741"
		},
		dog: {
			name: "Gus",
			breed: "Hound mix",
			age: "5 years",
			weight: "42 lbs",
			address: "731 W 34th St, Houston, TX 77018",
			goals: [
				"enrichment",
				"recall",
				"leash",
				"settling"
			],
			goalsOther: "He’s bored. Destroys shoes when we WFH without a job for him.",
			dislikes: "Nail clippers, skateboards",
			past: "Rescue at 2. Knew sit and paw. Never had a job.",
			limits: "None. Built like a tank.",
			household: "Luis and Elena. House with a small yard.",
			otherPets: "A cat, Miso, who is unimpressed",
			kids: "No",
			vet: "Garden Oaks Animal Hospital",
			referral: "Neighbor on 34th",
			days: "Mon / Wed evenings, Saturday",
			status: "active",
			credits: 6,
			privateNotes: "Nose work first, obedience second. This dog is unemployed, not untrained."
		},
		progress: {
			sit: {
				rating: 6,
				comment: "Solid. Proofing around the cat."
			},
			down: {
				rating: 5,
				comment: "Good. Use it as the start of settling, not a trick."
			},
			place: {
				rating: 4,
				comment: "Cot holds through cooking. Laptop Zoom is still spicy."
			},
			recall: {
				rating: 4,
				comment: "Yard is honest. Front-yard scent cone still wins a few."
			},
			"leash-manners": {
				rating: 4,
				comment: "Sniffy walks on a long line. Don’t make him heel the whole block."
			},
			settling: {
				rating: 3,
				comment: "Place after a scatter feed is the reset."
			},
			"enrichment-engagement": {
				rating: 5,
				comment: "Box searches and towel rolls. This is his language."
			},
			"handler-focus": {
				rating: 4,
				comment: "Checks in when the work is interesting."
			},
			retrieve: {
				rating: 3,
				comment: "Brings it halfway. Delivery to hand is the next piece."
			},
			"alone-time": {
				rating: 3,
				comment: "Forty minutes with a stuffed Kong is uneventful."
			}
		},
		sessions: [
			{
				type: "consult",
				daysAgo: 40,
				hour: 17,
				status: "completed",
				minutes: 30,
				recap: "Gus is a hound with no job. Destruction is unemployment, not spite.",
				homework: "One scatter feed a day in the grass. Sit is already there — don’t drill it.",
				ownerNotes: "Chewed two remote controls this month."
			},
			{
				type: "two_hour",
				daysAgo: 18,
				hour: 16,
				status: "completed",
				minutes: 120,
				recap: "Built a search pattern in the yard and a place reset before WFH. Recall on a long line around the block.",
				homework: "Three box searches this week. Place when Elena starts a call. Long-line recall in the park, easy mode.",
				ownerNotes: ""
			},
			{
				type: "hour",
				daysAgo: -6,
				hour: 17,
				status: "confirmed",
				minutes: 60,
				recap: "",
				homework: "",
				ownerNotes: "Can we add a retrieve? He loves a tennis ball."
			}
		],
		checkins: [{
			hoursAgo: 30,
			status: "skipped",
			note: "Work ran late and it rained. Box search didn’t happen. He found a shoe instead."
		}]
	}
];
function atHoursAgo(hours: number) {
	return (new Date(Date.now() - hours * 60 * 60 * 1e3)).toISOString();
}
function atDays(daysAgo: number, hour: number) {
	const d = new Date();
	d.setDate(d.getDate() - daysAgo);
	d.setHours(hour, 0, 0, 0);
	return d.toISOString();
}
async function ensureUser(name: string, email: string, password: string) {
	const sql = await getSql();
	const existing = await sql<{ id: string }>`select id from "user" where email = ${email}`;
	if (existing[0]) return existing[0].id;
	const id = randomUUID();
	const now = (new Date()).toISOString();
	const hash = await hashPassword(password);
	await sql`
    insert into "user" (id, name, email, "emailVerified", image, "createdAt", "updatedAt")
    values (${id}, ${name}, ${email}, true, null, ${now}, ${now})
  `;
	await sql`
    insert into "account" (
      id, "accountId", "providerId", "userId", password, "createdAt", "updatedAt"
    ) values (
      ${randomUUID()}, ${id}, 'credential', ${id}, ${hash}, ${now}, ${now}
    )
  `;
	return id;
}

/** Always restore the QA studio login so testing does not depend on who claimed TEDDY. */
export async function ensureQaAdmin() {
	const sql = await getSql();
	const hash = await hashPassword(QA_ADMIN.password);
	const now = new Date().toISOString();
	const existing = await sql<{ id: string }>`select id from "user" where email = ${QA_ADMIN.email}`;
	let userId = existing[0]?.id;
	if (!userId) {
		userId = await ensureUser(QA_ADMIN.name, QA_ADMIN.email, QA_ADMIN.password);
	} else {
		await sql`update "user" set name = ${QA_ADMIN.name}, "emailVerified" = true, "updatedAt" = ${now} where id = ${userId}`;
		const acct = await sql<{ id: string }>`
      select id from "account" where "userId" = ${userId} and "providerId" = 'credential'
    `;
		if (acct[0]) {
			await sql`update "account" set password = ${hash}, "updatedAt" = ${now} where id = ${acct[0].id}`;
		} else {
			await sql`
        insert into "account" (
          id, "accountId", "providerId", "userId", password, "createdAt", "updatedAt"
        ) values (
          ${randomUUID()}, ${userId}, 'credential', ${userId}, ${hash}, ${now}, ${now}
        )
      `;
		}
	}
	await sql`
    update studio
    set owner_user_id = ${userId}, trainer_pin = 'TEDDY', updated_at = now()
    where id = 1
  `;
	return { ok: true as const };
}

export async function ensureDemoSeed() {
	const sql = await getSql();
	if (((await sql<{ n: number }>`
    select count(*)::int as n from dogs where owner_email like ${"%@demo.local"}
  `)[0]?.n ?? 0) > 0) return { seeded: false };
	const pending = {
		owner_name: "Maya Chen",
		owner_email: "maya.chen@example.com",
		owner_phone: "(713) 555-8830",
		address: "2402 South Blvd, Houston, TX 77098",
		name: "Olive",
		breed: "Cattle dog mix",
		age_text: "11 months",
		weight_text: "32 lbs",
		allergies: "Chicken",
		sex: "Female",
		spayed_neutered: "Spayed",
		goals_json: JSON.stringify([
			"leash",
			"reactivity",
			"confidence-building"
		]),
		goals_other: "Barks at scooters. We just moved from Austin.",
		dislikes: "Skateboards, the vet lobby",
		past_experiences: "No formal training.",
		physical_limitations: "",
		household: "Maya, partner, one-bedroom in West U.",
		other_pets: "None",
		kids_in_home: "No",
		vet_info: "Rice Village Veterinary",
		preferred_days: "Evenings after 6",
		referral_source: "Google",
		status: "pending",
		credits: 0,
		trainer_private_notes: "Intake only. Confirm consult before scoring anything."
	};
	await sql`
    insert into dogs (
      owner_name, owner_email, owner_phone, address, name, breed, age_text, weight_text,
      allergies, sex, spayed_neutered, goals_json, goals_other, dislikes, past_experiences,
      physical_limitations, household, other_pets, kids_in_home, vet_info, preferred_days,
      referral_source, status, credits, trainer_private_notes
    ) values (
      ${pending.owner_name}, ${pending.owner_email}, ${pending.owner_phone}, ${pending.address},
      ${pending.name}, ${pending.breed}, ${pending.age_text}, ${pending.weight_text},
      ${pending.allergies}, ${pending.sex}, ${pending.spayed_neutered}, ${pending.goals_json},
      ${pending.goals_other}, ${pending.dislikes}, ${pending.past_experiences},
      ${pending.physical_limitations}, ${pending.household}, ${pending.other_pets},
      ${pending.kids_in_home}, ${pending.vet_info}, ${pending.preferred_days},
      ${pending.referral_source}, ${pending.status}, ${pending.credits}, ${pending.trainer_private_notes}
    )
  `;
	await sql`
    insert into inquiries (name, email, phone, dog_name, message)
    values
      (
        'Chris Nguyen',
        'chris.nguyen@example.com',
        '(832) 555-4410',
        'Rio',
        'We have a 9-month-old shepherd mix in EaDo who lunges at other dogs on the lead. Do you take reactivity cases in apartments?'
      ),
      (
        'Avery Brooks',
        'avery.brooks@example.com',
        '(713) 555-1022',
        'Mabel',
        'Looking for a consult for our senior beagle in Bellaire. Mostly enrichment and settling — she is not a trick dog.'
      )
  `;
	for (const h of HOUSEHOLDS) {
		const userId = await ensureUser(h.owner.name, h.owner.email, DEMO_PASS);
		const dogId = (await sql<{ id: number }>`
      insert into dogs (
        owner_user_id, owner_name, owner_email, owner_phone, address, name, breed,
        age_text, weight_text, allergies, sex, spayed_neutered, goals_json, goals_other,
        dislikes, past_experiences, physical_limitations, household, other_pets,
        kids_in_home, vet_info, preferred_days, referral_source, status, credits,
        trainer_private_notes
      ) values (
        ${userId}, ${h.owner.name}, ${h.owner.email}, ${h.owner.phone}, ${h.dog.address},
        ${h.dog.name}, ${h.dog.breed}, ${h.dog.age}, ${h.dog.weight}, '', '—', '—',
        ${JSON.stringify(h.dog.goals)}, ${h.dog.goalsOther}, ${h.dog.dislikes},
        ${h.dog.past}, ${h.dog.limits}, ${h.dog.household}, ${h.dog.otherPets},
        ${h.dog.kids}, ${h.dog.vet}, ${h.dog.days}, ${h.dog.referral},
        ${h.dog.status}, ${h.dog.credits}, ${h.dog.privateNotes}
      )
      returning id
    `)[0].id;
		await seedProgressForDog(dogId);
		for (const item of CATALOG) {
			const p = h.progress[item.key];
			if (!p) continue;
			await sql`
        update progress
        set rating = ${p.rating}, comment = ${p.comment}, updated_at = now()
        where dog_id = ${dogId} and skill_key = ${item.key}
      `;
			await sql`
        insert into progress_log (dog_id, skill_key, rating, comment)
        values (${dogId}, ${item.key}, ${p.rating}, ${p.comment})
      `;
		}
		for (const s of h.sessions) await sql`
        insert into sessions (
          dog_id, owner_user_id, session_type, scheduled_at, duration_min, status,
          location, owner_notes, recap, homework
        ) values (
          ${dogId}, ${userId}, ${s.type}, ${atDays(s.daysAgo, s.hour)}, ${s.minutes},
          ${s.status}, ${h.dog.address}, ${s.ownerNotes}, ${s.recap}, ${s.homework}
        )
      `;
		for (const c of h.checkins) {
			const when = atHoursAgo(c.hoursAgo);
			await sql`
        insert into checkins (dog_id, owner_user_id, status, note, created_at, updated_at)
        values (${dogId}, ${userId}, ${c.status}, ${c.note}, ${when}, ${when})
      `;
		}
	}
	return { seeded: true };
}