import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/label";
import { Input, Textarea } from "@/components/ui/input";
import { GOALS } from "@/lib/catalog";
import type { IntakeInput } from "@/lib/server/dogs";
import { formatUsPhone } from "@/lib/phone";
import { cn } from "@/lib/utils";
import { WhenPicker } from "@/components/portal/when-picker";
import type { HoursDay } from "@/lib/hours";

const empty: IntakeInput = {
  owner_name: "",
  owner_email: "",
  owner_phone: "",
  address: "",
  name: "",
  breed: "",
  age_text: "",
  birthday: "",
  weight_text: "",
  allergies: "",
  sex: "",
  spayed_neutered: "",
  goals: [],
  goals_other: "",
  dislikes: "",
  past_experiences: "",
  physical_limitations: "",
  household: "",
  other_pets: "",
  kids_in_home: "",
  vet_info: "",
  preferred_days: "",
  referral_source: "",
  preferred_at: "",
  photo_url: null,
};

const REFERRALS = [
  "A friend or neighbor",
  "Instagram",
  "Facebook",
  "X",
  "Google",
  "Nextdoor",
] as const;

function referralChoice(value: string) {
  const trimmed = value.trim();
  if ((REFERRALS as readonly string[]).includes(trimmed)) return { choice: trimmed, other: "" };
  if (!trimmed) return { choice: "", other: "" };
  return { choice: "Other", other: trimmed };
}

const heading =
  "font-display text-2xl text-ink after:mt-2 after:block after:h-0.5 after:w-8 after:bg-accent after:content-['']";

function ChoiceGroup({
  label,
  value,
  options,
  onChange,
  className,
}: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (next: string) => void;
  className?: string;
}) {
  return (
    <fieldset className={className}>
      <legend className="text-base font-bold text-[#1a0e0a]">{label}</legend>
      <div role="radiogroup" aria-label={label} className="mt-2 flex flex-wrap gap-2">
        {options.map((option) => {
          const on = value === option;
          return (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => onChange(on ? "" : option)}
              className={cn("chip-3d rounded-full px-3 py-2 text-sm", on && "is-on")}
            >
              {option}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

function localToday() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function PawPrint() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <ellipse cx="6.2" cy="8.2" rx="2.1" ry="2.6" />
      <ellipse cx="12" cy="5.4" rx="2.15" ry="2.7" />
      <ellipse cx="17.8" cy="8.2" rx="2.1" ry="2.6" />
      <ellipse cx="8.6" cy="10" rx="1.7" ry="2.1" />
      <path d="M7.2 14.2c.2-2.2 2.4-3.4 4.8-3.4s4.6 1.2 4.8 3.4c.2 2.4-2 4.8-4.8 4.8s-5-2.4-4.8-4.8z" />
    </svg>
  );
}

export function IntakeForm({
  initial,
  submitLabel,
  onSubmit,
  hours,
}: {
  initial?: Partial<IntakeInput>;
  submitLabel: string;
  onSubmit: (data: IntakeInput) => Promise<void>;
  hours?: HoursDay[];
}) {
  const [form, setForm] = useState<IntakeInput>({ ...empty, ...initial });
  const startingReferral = referralChoice(initial?.referral_source ?? "");
  const [heard, setHeard] = useState(startingReferral.choice);
  const [heardOther, setHeardOther] = useState(startingReferral.other);
  const [busy, setBusy] = useState(false);
  const [paws, setPaws] = useState(0);

  function set<K extends keyof IntakeInput>(key: K, value: IntakeInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function pickReferral(next: string) {
    setHeard(next);
    if (next === "Other") set("referral_source", heardOther.trim());
    else set("referral_source", next);
  }

  async function handle(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await onSubmit(form);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      className="intake-form space-y-10 [&_label>span:first-child]:text-base [&_input]:h-12 [&_input]:text-base [&_textarea]:min-h-20 [&_textarea]:text-base"
      onSubmit={(e) => void handle(e)}
    >
      <p className="text-sm text-muted">
        Only the starred fields are required. Everything else can wait.
      </p>
      <section className="space-y-5">
        <h2 className={heading}>You</h2>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Owner name" required>
            <Input
              autoComplete="name"
              value={form.owner_name}
              onChange={(e) => set("owner_name", e.target.value)}
              required
            />
          </Field>
          <Field label="Email" required>
            <Input
              type="email"
              autoComplete="email"
              value={form.owner_email}
              onChange={(e) => set("owner_email", e.target.value)}
              required
            />
          </Field>
          <Field label="Phone" required className="sm:col-span-2">
            <Input
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={form.owner_phone}
              onChange={(e) => set("owner_phone", formatUsPhone(e.target.value))}
              placeholder="713-555-0148"
              required
            />
          </Field>
          <Field label="Home address" required className="sm:col-span-2">
            <Input
              autoComplete="street-address"
              value={form.address}
              onChange={(e) => set("address", e.target.value)}
              placeholder="1234 Westheimer Rd, Houston, TX 77006"
              required
            />
          </Field>
        </div>
      </section>

      <section className="space-y-5">
        <h2 className={heading}>Your dog</h2>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Dog's name" required>
            <Input value={form.name} onChange={(e) => set("name", e.target.value)} required />
          </Field>
          <Field label="Breed">
            <Input
              value={form.breed}
              onChange={(e) => set("breed", e.target.value)}
              placeholder="Lab mix"
            />
          </Field>
          <ChoiceGroup
            label="Sex"
            value={form.sex}
            options={["Female", "Male"]}
            onChange={(value) => set("sex", value)}
          />
          <ChoiceGroup
            label="Spayed or neutered"
            value={form.spayed_neutered}
            options={["Yes", "No", "Not yet"]}
            onChange={(value) => set("spayed_neutered", value)}
          />
          <Field label="Age">
            <Input
              value={form.age_text}
              onChange={(e) => set("age_text", e.target.value)}
              placeholder="14 weeks, 3 years…"
            />
          </Field>
          <Field label="Weight">
            <Input
              value={form.weight_text}
              onChange={(e) => set("weight_text", e.target.value)}
              placeholder="42 lbs"
            />
          </Field>
          <Field label="Birthday" hint="Optional. I’ll reach out on the day.">
            <Input
              type="date"
              value={form.birthday}
              max={localToday()}
              onChange={(e) => set("birthday", e.target.value)}
            />
          </Field>
          <Field label="Allergies or dietary restrictions">
            <Input
              value={form.allergies}
              onChange={(e) => set("allergies", e.target.value)}
              placeholder="None, or chicken…"
            />
          </Field>
        </div>
      </section>

      <section className="space-y-5">
        <h2 className={heading}>What should change</h2>
        <p className="text-sm text-muted">Tap everything that fits.</p>
        <div className="flex flex-wrap gap-2">
          {GOALS.map((g) => {
            const on = form.goals.includes(g.id);
            return (
              <button
                key={g.id}
                type="button"
                aria-pressed={on}
                onClick={() =>
                  set("goals", on ? form.goals.filter((id) => id !== g.id) : [...form.goals, g.id])
                }
                className={cn("chip-3d rounded-full px-3 py-2 text-sm", on ? "is-on" : "")}
              >
                {g.label}
              </button>
            );
          })}
        </div>
        <Field label="Anything else — in your words">
          <Textarea
            value={form.goals_other}
            onChange={(e) => set("goals_other", e.target.value)}
            placeholder="Leash pulling, doorbell barking…"
          />
        </Field>
      </section>

      <section className="space-y-5">
        <h2 className={heading}>When I should come</h2>
        <div className="grid gap-5 sm:grid-cols-2">
          {hours ? (
            <Field label="A time for the consult" hint="Optional. Only open hours are listed." className="sm:col-span-2">
              <WhenPicker
                value={form.preferred_at}
                onChange={(value) => set("preferred_at", value)}
                hours={hours}
                durationMin={30}
              />
              {form.preferred_at ? (
                <button
                  type="button"
                  className="self-start text-xs text-muted underline underline-offset-4"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    set("preferred_at", "");
                  }}
                >
                  Clear time
                </button>
              ) : null}
            </Field>
          ) : null}
          <Field label="Days that usually work" hint="Optional. For visits after the consult." className="sm:col-span-2">
            <Input
              value={form.preferred_days}
              onChange={(e) => set("preferred_days", e.target.value)}
              placeholder="Tue / Thu after 4, weekend morning"
            />
          </Field>
        </div>
      </section>

      <section className="space-y-5">
        <h2 className={heading}>What I need before I walk in</h2>
        <p className="text-sm text-muted">Optional. Skip anything that doesn’t apply.</p>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Household">
            <Input
              value={form.household}
              onChange={(e) => set("household", e.target.value)}
              placeholder="Two adults"
            />
          </Field>
          <Field label="Other pets">
            <Input
              value={form.other_pets}
              onChange={(e) => set("other_pets", e.target.value)}
              placeholder="One cat"
            />
          </Field>
          <Field label="Kids in the home">
            <Input
              value={form.kids_in_home}
              onChange={(e) => set("kids_in_home", e.target.value)}
              placeholder="None, or ages 4 and 7"
            />
          </Field>
          <Field label="Veterinarian">
            <Input
              value={form.vet_info}
              onChange={(e) => set("vet_info", e.target.value)}
              placeholder="Clinic name"
            />
          </Field>
        </div>
        <Field label="Things this dog does not like">
          <Textarea
            value={form.dislikes}
            onChange={(e) => set("dislikes", e.target.value)}
            placeholder="Hats, nail clippers, skateboards…"
          />
        </Field>
        <Field label="Past bad experiences">
          <Textarea
            value={form.past_experiences}
            onChange={(e) => set("past_experiences", e.target.value)}
            placeholder="A scare at the vet, a dog fight…"
          />
        </Field>
        <Field label="Physical limitations">
          <Textarea
            value={form.physical_limitations}
            onChange={(e) => set("physical_limitations", e.target.value)}
            placeholder="Hip dysplasia, recovering from surgery…"
          />
        </Field>
      </section>

      <section className="space-y-5">
        <h2 className={heading}>How you found me</h2>
        <fieldset>
          <legend className="sr-only">How did you hear about Dog Training with Emily?</legend>
          <div role="radiogroup" aria-label="How did you hear about Dog Training with Emily?" className="flex flex-wrap gap-2">
            {[...REFERRALS, "Other"].map((option) => {
              const on = heard === option;
              return (
                <button
                  key={option}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => pickReferral(option)}
                  className={cn("chip-3d rounded-full px-3 py-2 text-sm", on && "is-on")}
                >
                  {option}
                </button>
              );
            })}
          </div>
          {heard === "Other" ? (
            <Input
              className="mt-3"
              value={heardOther}
              onChange={(e) => {
                setHeardOther(e.target.value);
                set("referral_source", e.target.value);
              }}
              placeholder="Where did you hear about us?"
              aria-label="Other way you heard about us"
            />
          ) : null}
        </fieldset>
      </section>

      <div className="relative flex justify-center">
        <Button
          type="submit"
          disabled={busy}
          className="book-cta sm:w-auto"
          onClick={() => setPaws((n) => n + 1)}
        >
          {busy ? "Saving…" : submitLabel}
        </Button>
        {paws > 0 ? (
          <span key={paws} className="paw-burst" aria-hidden="true">
            <PawPrint />
            <PawPrint />
            <PawPrint />
          </span>
        ) : null}
      </div>
    </form>
  );
}
