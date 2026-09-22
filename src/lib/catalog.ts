export const STUDIO_NAME = "Dog Training with Emily";
export const STUDIO_TAGLINE = "In-home enrichment training in Houston";
export const STUDIO_CITY = "Houston, Texas";

export const PLACEHOLDER_EMAIL = "emily@dogtrainingwithemily.com";
export const PLACEHOLDER_PHONE = "(713) 555-0148";
export const PLACEHOLDER_INSTAGRAM = "https://instagram.com/dogtrainingwithemily";
export const PLACEHOLDER_FACEBOOK = "https://facebook.com/dogtrainingwithemily";
export const PLACEHOLDER_X = "https://x.com/dogtrainingwithemily";

export const PHASES = [
  { rating: 1, label: "Intro", blurb: "The dog has met the idea. Lure, capture, or shape the first reps." },
  { rating: 2, label: "Needing Guidance", blurb: "They understand the picture with your help. Stay close and coach." },
  { rating: 3, label: "Easy Repetition", blurb: "Clean reps in a quiet space. Rhythm is building." },
  { rating: 4, label: "Fading Lure", blurb: "The food or toy leaves the picture. The cue starts to carry the work." },
  { rating: 5, label: "Increasing Difficulty", blurb: "Distance, duration, and duration-under-mild-motion get harder on purpose." },
  { rating: 6, label: "Intro to Distractions", blurb: "Real life starts leaking in: doorbells, other dogs, sidewalk noise." },
  { rating: 7, label: "Extra Stimulus & Greater Difficulty", blurb: "Proofed enough to trust in the situations that used to fall apart." },
] as const;

export type PhaseRating = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

export function phaseFor(rating: number) {
  if (rating <= 0) return { rating: 0 as const, label: "Not started", blurb: "Not yet on the plan." };
  return PHASES.find((p) => p.rating === rating) ?? PHASES[0];
}

export type SkillKind = "trick" | "skill";

export type CatalogItem = {
  key: string;
  name: string;
  kind: SkillKind;
  summary: string;
};

export const TRICKS: CatalogItem[] = [
  { key: "sit", name: "Sit", kind: "trick", summary: "Hindquarters down, weight even, waiting for the next piece of information." },
  { key: "down", name: "Down", kind: "trick", summary: "A full settle on the floor — the foundation for rest, duration, and emergency stops." },
  { key: "stand", name: "Stand", kind: "trick", summary: "Four on the floor, still. Useful for grooming, vet handling, and polite greetings." },
  { key: "stay", name: "Stay", kind: "trick", summary: "Hold the picture until released. Distance and duration come later." },
  { key: "free", name: "Free", kind: "trick", summary: "The release. Marks the end of work so stay and place actually mean something." },
  { key: "place", name: "Place", kind: "trick", summary: "Go to a defined bed or cot, land, and stay until released — the house's reset button." },
  { key: "heel", name: "Heel", kind: "trick", summary: "Moving with you, at your side, with slack in the leash and attention available." },
  { key: "touch", name: "Touch", kind: "trick", summary: "Nose to hand or target. A redirect, a recall helper, and a confidence builder." },
  { key: "paw", name: "Paw", kind: "trick", summary: "Offer a paw on cue. Handling practice dressed as a trick." },
  { key: "hi-five", name: "Hi-five", kind: "trick", summary: "A lifted paw to a vertical hand — a brighter sibling of paw." },
  { key: "spin", name: "Spin", kind: "trick", summary: "A tight turn on cue. Great for engagement, body awareness, and a pattern interrupt." },
  { key: "roll-over", name: "Roll over", kind: "trick", summary: "Through the back, onto the other side. Only when the body is willing." },
  { key: "crawl", name: "Crawl", kind: "trick", summary: "Forward motion in a down. Builds core, control, and a little mischief." },
  { key: "drop-it", name: "Drop it", kind: "trick", summary: "Spit it out. The difference between a game and a swallowed sock." },
  { key: "leave-it", name: "Leave it", kind: "trick", summary: "Don't pick it up in the first place. Impulse control you can take on a walk." },
  { key: "wait", name: "Wait", kind: "trick", summary: "A pause at thresholds, bowls, and car doors — shorter than a stay, just as serious." },
  { key: "chin-rest", name: "Chin rest", kind: "trick", summary: "Chin on a lap or target. Cooperative care starts here." },
  { key: "middle", name: "Middle", kind: "trick", summary: "Come through and park between your legs. A reset on busy sidewalks." },
  { key: "back-up", name: "Back up", kind: "trick", summary: "Rear up, step back. Makes space at doors and builds rear-end awareness." },
  { key: "bow", name: "Bow", kind: "trick", summary: "Stretch forward, hips up. A party trick that also checks the body." },
  { key: "find-it", name: "Find it", kind: "trick", summary: "Search for food or a toy on cue. Nose work that drains the battery kindly." },
  { key: "watch-me", name: "Watch me", kind: "trick", summary: "Soft eye contact on cue. Handler focus without staring contests." },
];

export const SKILLS: CatalogItem[] = [
  { key: "name-retention", name: "Name retention", kind: "skill", summary: "Their name means 'orient to me' — not background noise." },
  { key: "recall", name: "Recall", kind: "skill", summary: "Come when called, even when the world is more interesting than you." },
  { key: "impulse-control", name: "Impulse control", kind: "skill", summary: "The pause before the leap, the bark, the counter, the door." },
  { key: "threshold-manners", name: "Threshold manners", kind: "skill", summary: "Doors, gates, crates, and cars without the rugby scrum." },
  { key: "settling", name: "Settling", kind: "skill", summary: "Being able to rest in the house while life happens around them." },
  { key: "confidence-building", name: "Confidence building", kind: "skill", summary: "New floors, new sounds, new people — approached at their pace." },
  { key: "noise-desensitization", name: "Noise desensitization", kind: "skill", summary: "Doorbells, thunder, fireworks, and the garbage truck, made ordinary." },
  { key: "leash-manners", name: "Leash manners", kind: "skill", summary: "A walk that is a walk, not a tow. Slack is the goal." },
  { key: "handler-focus", name: "Handler focus", kind: "skill", summary: "Checking in with you as the default, not the exception." },
  { key: "retrieve", name: "Retrieve", kind: "skill", summary: "Pick it up, bring it back, deliver to hand. Play with a job attached." },
  { key: "crate-comfort", name: "Crate comfort", kind: "skill", summary: "The crate as a den, not a timeout. Voluntary rest inside." },
  { key: "greeting-manners", name: "Greeting manners", kind: "skill", summary: "Four on the floor when people arrive. Excitement without body-slams." },
  { key: "doorway-manners", name: "Doorway manners", kind: "skill", summary: "Wait, then walk through when invited. The doorbell starts here." },
  { key: "alone-time", name: "Alone time", kind: "skill", summary: "Short absences that stay uneventful. Independence, not abandonment." },
  { key: "food-manners", name: "Food manners", kind: "skill", summary: "Wait for the bowl, take treats gently, leave the counters alone." },
  { key: "engagement-walk", name: "Engagement on a walk", kind: "skill", summary: "Sniffing, checking in, and moving together — not just surviving the block." },
  { key: "pattern-games", name: "Pattern games", kind: "skill", summary: "Predictable games that lower arousal when the environment gets loud." },
  { key: "enrichment-engagement", name: "Enrichment engagement", kind: "skill", summary: "Using their nose, brain, and body so the house isn't their only job." },
  { key: "place-duration", name: "Place duration", kind: "skill", summary: "Staying on the cot through cooking, guests, and the Amazon driver." },
  { key: "emergency-down", name: "Emergency down", kind: "skill", summary: "Drop and stay when it actually matters — a dropped leash, a busy street." },
  { key: "handling-comfort", name: "Handling comfort", kind: "skill", summary: "Collar, harness, nails, ears, and vet handling without a wrestling match." },
  { key: "resource-sharing", name: "Resource sharing", kind: "skill", summary: "People can approach bowls, toys, and rest spots without a freeze." },
];

export const CATALOG: CatalogItem[] = [...TRICKS, ...SKILLS];

export const CATALOG_BY_KEY = Object.fromEntries(CATALOG.map((item) => [item.key, item]));

export const SESSION_TYPES = [
  {
    id: "consult" as const,
    name: "Initial Consultation",
    minutes: 30,
    price: 40,
    blurb: "A 30-minute in-home meet. We map the household, the dog, and what “better” actually looks like — before we write a training plan.",
    for: "First visit. Required before a training series.",
    includes: [
      "I meet the dog in the house they actually live in — not a lobby.",
      "We walk through the week as it really is: doors, walks, guests, the stuff that falls apart.",
      "You leave with a read and a recommended next session — not a pitch.",
    ],
  },
  {
    id: "hour" as const,
    name: "1 Hour Session",
    minutes: 60,
    price: 70,
    blurb: "Obedience, tricks, and skills — the foundation work. Each visit is tailored, not templated.",
    for: "Foundation work: sit, down, place, leash, name, manners.",
    includes: [
      "Sit, down, place, name, leash, and the door manners that make the house livable.",
      "Ten minutes at the start on how the week actually went.",
      "Written homework in your portal before I drive away.",
    ],
  },
  {
    id: "two_hour" as const,
    name: "2 Hour Session",
    minutes: 120,
    price: 140,
    blurb: "Behavior modification and enrichment. We slow down, go into the hard parts, and leave you with a week of homework that actually fits your house.",
    for: "Reactivity, anxiety, enrichment plans, stubborn patterns.",
    includes: [
      "Room to work the hard parts: reactivity, anxiety, enrichment, stubborn patterns.",
      "We go slower on purpose so the dog can actually learn, not just perform.",
      "A week of homework that fits your house — scored 1–7 so you can see the phase.",
    ],
  },
];

export type SessionTypeId = (typeof SESSION_TYPES)[number]["id"];

export function sessionTypeById(id: string) {
  return SESSION_TYPES.find((s) => s.id === id) ?? SESSION_TYPES[0];
}

export const GOALS = [
  { id: "obedience", label: "Obedience" },
  { id: "puppy-basics", label: "Puppy basics" },
  { id: "breed-fulfillment", label: "Breed fulfillment" },
  { id: "proofing", label: "Proofing" },
  { id: "leash", label: "Leash manners" },
  { id: "reactivity", label: "Barking / reactivity" },
  { id: "house-manners", label: "House manners" },
  { id: "enrichment", label: "Enrichment" },
  { id: "other", label: "Other" },
] as const;

export const CHECKINS = [
  { id: "practiced", label: "We practiced", hint: "You gave the homework a real try. Emily will plan the next session from here." },
  { id: "skipped", label: "We skipped", hint: "No judgment. Emily will read this before the next session and plan around it." },
  { id: "stuck", label: "We’re stuck", hint: "You tried, and it isn’t working. A short note helps Emily adjust before she comes back." },
] as const;

export type CheckinStatus = (typeof CHECKINS)[number]["id"];

export function checkinById(id: string) {
  return CHECKINS.find((c) => c.id === id) ?? CHECKINS[0];
}

export const HOUSTON_AREAS = [
  "The Heights",
  "Rice Military",
  "Montrose",
  "Rice Village",
  "West University",
  "Bellaire",
  "Memorial",
  "Garden Oaks",
  "Oak Forest",
  "EaDo",
  "Midtown",
  "River Oaks",
  "Timbergrove",
];

export function dollars(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}
