import { useLayoutEffect, useState, type FormEvent } from "react";
import { createFileRoute, Link, useRouterState } from "@tanstack/react-router";
import { toast } from "sonner";
import { ContactMethods, SocialLinks } from "@/components/brand/social-links";
import { TeddyPortrait } from "@/components/brand/teddy-portrait";
import { SiteFooter } from "@/components/layout/site-footer";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/label";
import { Input, Textarea } from "@/components/ui/input";
import { HOUSTON_AREAS, SESSION_TYPES, dollars } from "@/lib/catalog";
import { createInquiry } from "@/lib/server/inquiries";
import { notifyStudioInbox } from "@/lib/notify-studio";
import { formatUsPhone } from "@/lib/phone";
import { scrollToSection, allowHomePin, scrollAppTo } from "@/lib/scroll-to-section";

export const Route = createFileRoute("/")({ component: HomePage });

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

const SESSION_IMAGES: Record<string, { src: string; alt: string }> = {
  consult: { src: "/images/walk.jpg", alt: "A trainer walking a dog on a quiet street" },
  hour: { src: "/images/hero.jpg", alt: "A dog focused on a training session" },
  two_hour: { src: "/images/enrichment.jpg", alt: "A dog working an enrichment puzzle" },
};

function HomePage() {
  const leaving = useRouterState({
    select: (s) => s.isLoading && s.location.pathname !== "/",
  });

  useLayoutEffect(() => {
    if (leaving) return;
    const id = window.location.hash.replace(/^#/, "");
    if (id === "about" || id === "services" || id === "contact") {
      const t = window.setTimeout(() => scrollToSection(id), 50);
      return () => window.clearTimeout(t);
    }
    const pin = () => {
      if (!allowHomePin) return;
      scrollAppTo(0);
      window.scrollTo(0, 0);
    };
    pin();
    window.addEventListener("pageshow", pin);
    window.addEventListener("load", pin);
    const stop = window.setTimeout(() => {
      window.removeEventListener("pageshow", pin);
      window.removeEventListener("load", pin);
    }, 1200);
    return () => {
      window.clearTimeout(stop);
      window.removeEventListener("pageshow", pin);
      window.removeEventListener("load", pin);
    };
  }, [leaving]);

  if (leaving) return null;

  return (
    <div>
      <Hero />
      <Philosophy />
      <About />
      <Services />
      <HowItWorks />
      <Area />
      <Faq />
      <Contact />
      <SiteFooter />
    </div>
  );
}

function Hero() {
  return (
    <section className="overflow-hidden bg-bg">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-6 py-12 sm:py-16 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,22rem)] lg:gap-16 lg:py-16">
        <div className="flex flex-col items-center text-center lg:items-start lg:self-center lg:text-left lg:-translate-y-8">
          <p className="text-base font-semibold uppercase tracking-wide text-accent-deep">Greater Houston · in-home</p>
          <h1 className="mt-6 font-display text-4xl leading-[1.12] tracking-tight sm:mt-8 sm:text-5xl">
            Hi, I’m Emily.
          </h1>
          <p className="mt-6 max-w-lg text-base leading-relaxed text-muted sm:mt-8 sm:text-lg">
            I spent years helping dogs thrive with structure and enrichment. Now
            I come to you: we work in your home, address your dog’s specific
            needs, and leave with you knowing exactly what they need from you.
          </p>
          <div className="mt-6">
            <Button size="lg" asChild className="book-cta">
              <Link to="/intake">Book a consult</Link>
            </Button>
          </div>
        </div>
        <TeddyPortrait className="mx-auto max-w-[14rem] sm:max-w-[16rem] lg:max-w-none" />
      </div>
    </section>
  );
}

function Philosophy() {
  return (
    <section id="philosophy" className="band bg-ink text-bg">
      <div className="mx-auto max-w-3xl px-6 pt-12 pb-20 text-center sm:pt-24 sm:pb-28">
        <p className="font-display text-3xl font-semibold italic leading-snug text-tiffany sm:text-4xl">
          A fulfilled dog is a trained dog.
        </p>
        <p className="mt-10 text-base leading-relaxed text-bg/75 sm:mt-12 sm:text-lg">
          When a dog struggles, it usually means we haven’t given them a clear
          picture of the world yet. That isn’t a scolding — it’s the work. They
          need more than food, water, and a roof. They need a job, a plan, and a
          person willing to follow through.
        </p>
      </div>
    </section>
  );
}

function About() {
  return (
    <section id="about" className="band bg-bg">
      <div className="mx-auto max-w-3xl px-6 pt-12 pb-20 text-center sm:pt-24 sm:pb-28">
        <p data-section-title className="text-xl font-bold uppercase tracking-wide text-accent-deep sm:text-2xl">About</p>
        <h2 className="mt-8 font-display text-3xl tracking-tight sm:mt-10">
          I grew up here. Teddy made the rest obvious.
        </h2>
        <div className="mt-10 space-y-5 text-base leading-relaxed text-muted sm:mt-12 sm:space-y-6 sm:text-lg">
          <p>
            I found this work the way a lot of honest trainers do — by stumbling
            into my first dog. Teddy, whom I adopted, made it clear that love is
            not a training plan. He needed a job, a picture of the world he could
            trust, and a person willing to be the missing piece.
          </p>
          <p>
            For three and a half years I’ve worked at a Houston doggy daycare
            and boarding facility. I became a trainer in the facility’s Academy —
            an enrichment-based program, not a trick mill — and within two years
            I was asked to lead it. I’ve run it for the past year.
          </p>
          <p>
            Taking on private clients is the next step: in-home, one dog at a
            time, tailored to the household in front of me. I’m on the path to
            certification, with a focus on behavior modification.
          </p>
          <p>
            I’m enough of a dog person that I refuse to watch films where
            something bad happens to the dog — even if they walk out fine at the
            end. That isn’t a professional credential. It is a temperament check,
            and I will not pretend otherwise.
          </p>
        </div>
      </div>
    </section>
  );
}

function Services() {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <section id="services" className="band bg-bg-warm">
      <div className="mx-auto max-w-6xl px-6 pt-12 pb-20 text-center sm:pt-24 sm:pb-28 lg:pb-40">
        <p data-section-title className="text-xl font-bold uppercase tracking-wide text-accent-deep sm:text-2xl">Sessions</p>
        <h2 className="mx-auto mt-8 max-w-xl font-display text-3xl tracking-tight sm:mt-10">
          We start with ten minutes on how the week went. We end with homework.
        </h2>
        <p className="mx-auto mt-8 max-w-2xl text-base leading-relaxed text-muted sm:mt-10 sm:text-lg">
          Every visit is in your home, across the Greater Houston area. The last
          fifteen minutes are a debrief: what we worked on, and what will make
          the next six days count.
        </p>
        <div className="mt-12 grid items-start gap-5 text-left md:grid-cols-3">
          {SESSION_TYPES.map((s) => {
            const img = SESSION_IMAGES[s.id];
            const isOpen = open === s.id;
            return (
              <article
                key={s.id}
                className="shell-card overflow-hidden rounded-lg"
              >
                <button
                  type="button"
                  className="w-full cursor-pointer text-left"
                  aria-expanded={isOpen}
                  aria-controls={`session-${s.id}`}
                  onClick={() => setOpen(isOpen ? null : s.id)}
                >
                  {img ? (
                    <div className="h-44 overflow-hidden">
                      <img
                        src={img.src}
                        alt=""
                        className="h-full w-full object-cover object-center"
                      />
                    </div>
                  ) : null}
                  <div className="p-5">
                    <div className="flex items-baseline justify-between gap-3">
                      <h3 className="font-display text-2xl text-ink">{s.name}</h3>
                      <p className="font-display text-2xl tabular-nums text-ink">
                        {dollars(s.price)}
                      </p>
                    </div>
                    <p className="mt-2 text-base leading-relaxed text-ink">
                      {s.minutes} minutes · {s.for}
                    </p>
                    <span className="mt-3 inline-flex items-center gap-1.5 text-base font-semibold text-accent-deep">
                      {isOpen ? "Close" : "More details"}
                      <svg
                        viewBox="0 0 16 16"
                        className={`size-3.5 transition-transform duration-300 ease-out ${isOpen ? "rotate-180" : ""}`}
                        aria-hidden="true"
                      >
                        <path
                          d="M3 6l5 5 5-5"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                  </div>
                </button>
                <div
                  id={`session-${s.id}`}
                  className={isOpen ? "fold is-open" : "fold"}
                >
                  <div>
                    <div className="space-y-3 px-5 pb-5 pt-3">
                      <p className="text-base leading-relaxed text-ink">
                        {s.blurb}
                      </p>
                      <ul className="space-y-2 text-base leading-relaxed text-ink">
                        {s.includes.map((line) => (
                          <li key={line} className="pl-3.5 relative">
                            <span className="absolute left-0 top-[0.55em] size-1.5 rounded-full bg-accent-soft" />
                            {line}
                          </li>
                        ))}
                      </ul>
                      <Link
                        to="/intake"
                        className="inline-flex pt-1 text-base font-semibold text-accent-deep underline-offset-4 hover:underline"
                      >
                        Book a consult
                      </Link>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      title: "Consult",
      body: "Thirty minutes in your house. I meet the dog, the people, and the problems that actually show up at home. You leave knowing what’s going on — not with a sales pitch.",
      img: "/images/teddy-step-1.png",
      alt: "Cartoon Teddy waving hello",
    },
    {
      title: "A plan",
      body: "We pick the skills that change daily life: leash, doorbell, structure, a job for the dog. Not a generic curriculum.",
      img: "/images/teddy-step-2.png?v=2",
      alt: "Cartoon Teddy with a training plan",
    },
    {
      title: "Session, then homework",
      body: "We train together in your home. Before I leave, you get written homework you can actually keep. Progress is scored 1–7 so you can see every phase.",
      img: "/images/teddy-step-3.png?v=2",
      alt: "Cartoon Teddy holding homework with a gold star",
    },
  ];
  return (
    <section className="band bg-bg">
      <div className="mx-auto max-w-6xl px-6 pt-12 pb-20 text-center sm:px-6 sm:pt-24 sm:pb-28 lg:pb-40">
        <h2 className="font-display text-3xl font-bold uppercase tracking-wide">How it works</h2>
        <ol className="mt-16 grid gap-10 sm:mt-20 lg:mt-24 md:grid-cols-3">
          {steps.map((s, i) => (
            <li key={s.title} className="mx-auto max-w-xs text-center">
              <div className="mx-auto flex h-44 items-end justify-center">
                <img
                  src={s.img}
                  alt={s.alt}
                  className="frame-none h-44 w-auto object-contain"
                />
              </div>
              <span className="mt-2 inline-flex size-10 items-center justify-center rounded-full bg-ink font-logo text-lg font-extrabold text-bg">
                {i + 1}
              </span>
              <h3 className="mt-3 font-display text-xl">{s.title}</h3>
              <p className="mt-2 text-base leading-relaxed text-muted sm:text-lg">{s.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function Area() {
  return (
    <section className="band bg-bg-warm">
      <div className="mx-auto max-w-3xl px-6 pt-12 pb-20 text-center sm:pt-24 sm:pb-28">
        <p className="text-base font-semibold uppercase tracking-wide text-accent-deep">
          Greater Houston Area
        </p>
        <h2 className="mt-8 font-display text-3xl tracking-tight sm:mt-10">I come to you.</h2>
        <p className="mt-8 text-base leading-relaxed text-muted sm:mt-10 sm:text-lg">
          If you can get a leash on and open the door, the classroom is already
          built. Neighborhoods I drive regularly:
        </p>
        <ul className="mt-10 flex flex-wrap justify-center gap-2">
          {HOUSTON_AREAS.map((a) => (
            <li
              key={a}
              className="rounded-full bg-accent-soft px-3 py-1.5 text-sm text-ink ring-1 ring-ink/25"
            >
              {a}
            </li>
          ))}
        </ul>
        <p className="mt-12 text-sm text-muted sm:mt-14">Other neighborhoods by request.</p>
      </div>
    </section>
  );
}

function Faq() {
  const items = [
    {
      q: "Do I need to come to a facility?",
      a: "No. All sessions are private and in-home.",
    },
    {
      q: "What if my dog isn’t ‘obedient’ yet?",
      a: "That’s the point of the consult. We start where the dog is.",
    },
    {
      q: "How do I cancel?",
      a: "Please give 24 hours’ notice. Cancel from the portal or text me.",
    },
    {
      q: "Can I gift sessions?",
      a: "Yes. Credits can be added to a client’s account after a series is purchased.",
    },
  ];
  return (
    <section className="band bg-bg">
      <div className="mx-auto max-w-6xl px-6 pt-12 pb-20 sm:pt-24 sm:pb-28">
        <div className="lg:grid lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] lg:items-center lg:gap-20">
          <div className="text-center lg:text-left">
            <h2 className="font-display text-4xl tracking-tight">Questions</h2>
          </div>
          <dl className="mt-10 divide-y divide-ink/20 text-center sm:mt-12 lg:mt-0 lg:text-left">
            {items.map((item) => (
              <div key={item.q} className="py-5 first:pt-0 last:pb-0">
                <dt className="text-lg font-bold text-ink">{item.q}</dt>
                <dd className="mt-1.5 text-base leading-relaxed text-muted">{item.a}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}

function Contact() {
  const [name, setName] = useState("");
  const [dogName, setDogName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [paws, setPaws] = useState(0);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await createInquiry({ data: { name, email, phone, dogName, message } });
      const mail = await notifyStudioInbox({ name, email, phone, dogName, message });
      if (mail === "confirm") {
        toast.message("Saved. Check Gmail for a one-time “confirm this form” email, then submit once more.");
      } else if (mail === "failed") {
        toast.success("Saved in Studio. Email to Gmail didn’t go through this time.");
      } else {
        toast.success("Message received. I’ll write back shortly.");
      }
      setName("");
      setDogName("");
      setEmail("");
      setPhone("");
      setMessage("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section id="contact" className="band bg-accent-soft">
      <div className="mx-auto max-w-lg px-6 pt-12 pb-20 text-center sm:pt-24 sm:pb-28">
        <p data-section-title className="text-xl font-bold uppercase tracking-wide text-ink sm:text-2xl">Contact</p>
        <h2 className="mt-8 font-display text-3xl tracking-tight text-ink sm:mt-10">
          How can I help?
        </h2>
        <ContactMethods className="mt-8 inline-flex flex-col items-center" />
        <SocialLinks className="mt-4 justify-center" />
        <form className="shell-card mt-8 space-y-5 rounded-lg p-6 text-left sm:p-8" onSubmit={(e) => void onSubmit(e)}>
          <Field label="Your name">
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </Field>
          <Field label="Your dog’s name">
            <Input value={dogName} onChange={(e) => setDogName(e.target.value)} required />
          </Field>
          <Field label="Email">
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </Field>
          <Field label="Phone">
            <Input
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(formatUsPhone(e.target.value))}
              placeholder="713-555-0148"
            />
          </Field>
          <Field label="What’s going on at home?">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Leash pulling, doorbell barking, extra energy…"
              required
            />
          </Field>
          <div className="relative flex justify-center">
            <Button type="submit" className="book-cta" disabled={busy} onClick={() => setPaws((n) => n + 1)}>
              {busy ? "Sending…" : "Submit"}
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
      </div>
    </section>
  );
}
