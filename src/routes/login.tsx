import { useEffect, useLayoutEffect, useRef, useState, type FormEvent } from "react";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Field } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { GROK_PROVIDERS, authClient, authEnabled, signIn } from "@/lib/auth/client";
import { QA_ADMIN } from "@/lib/qa-admin";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { freezeSignedOutHeader } from "@/lib/auth/header-hold";
import { getMe } from "@/lib/server/me";
import { checkClientSignup } from "@/lib/server/dogs";
import { primeMe } from "@/lib/use-me";
import { seedDemoIfNeeded } from "@/lib/server/seed-demo-fn";

export const Route = createFileRoute("/login")({
  component: LoginPage,
  validateSearch: (search: Record<string, unknown>): { as?: "trainer" } =>
    search.as === "trainer" ? { as: "trainer" } : {},
});

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

function LoginPage() {
  const { as } = Route.useSearch();
  const [handoff, setHandoff] = useState(false);
  useEffect(() => {
    void seedDemoIfNeeded().catch(() => undefined);
  }, []);
  return (
    <div data-login-root className="min-h-dvh">
      <main className="mx-auto w-full max-w-lg px-5 py-10 text-center sm:px-6 lg:py-14">
        <h1 className="font-display text-4xl tracking-tight">Sign in.</h1>
        <p className="mx-auto mt-4 max-w-sm text-muted leading-relaxed">
          Welcome back. Use the email from your consult.
        </p>
        <p className="mx-auto mt-3 max-w-sm text-muted leading-relaxed">
          New here?{" "}
          <Link
            to="/intake"
            className="text-ink underline underline-offset-4 transition-colors duration-200 hover:text-accent-deep"
          >
            Book a consult
          </Link>
          . You don’t need an account yet.
        </p>
        <div className="mx-auto mt-8 w-full max-w-md text-left">
          <LoginAuth preferStudio={as === "trainer"} handoff={handoff} setHandoff={setHandoff} />
        </div>
      </main>
    </div>
  );
}

function LoginAuth({
  preferStudio,
  handoff,
  setHandoff,
}: {
  preferStudio: boolean;
  handoff: boolean;
  setHandoff: (hold: boolean) => void;
}) {
  const { user, isPending } = useCurrentUserState();
  const shown = useRef<"in" | "out" | null>(null);
  if (!isPending) shown.current = user ? "in" : "out";
  const state = isPending ? shown.current : user ? "in" : "out";

  if (state === "in" && !handoff) return <AlreadyIn preferStudio={preferStudio} setHandoff={setHandoff} />;
  if (state === "out" || handoff) return <AuthCard setHandoff={setHandoff} />;
  return null;
}

function AlreadyIn({
  preferStudio,
  setHandoff,
}: {
  preferStudio: boolean;
  setHandoff: (hold: boolean) => void;
}) {
  useLayoutEffect(() => {
    const scroller = document.getElementById("app-scroll");
    const card = document.getElementById("signed-in-card");
    if (!scroller || !card) return;
    const headerH = document.querySelector("header")?.getBoundingClientRect().height ?? 0;
    const top =
      card.getBoundingClientRect().top -
      scroller.getBoundingClientRect().top +
      scroller.scrollTop -
      headerH -
      24;
    scroller.scrollTop = Math.max(0, top);
  }, []);

  return (
    <Card id="signed-in-card">
      <CardBody className="space-y-4">
        <h2 className="font-display text-2xl">You’re signed in.</h2>
        <p className="text-sm text-muted">
          Open your portal, or the studio if you train here.
        </p>
        <div className="flex flex-wrap gap-2">
          <QaEmilyButton setHandoff={setHandoff} />
          <Button asChild>
            <Link to={preferStudio ? "/studio" : "/portal"}>
              {preferStudio ? "Open trainer studio" : "Open portal"}
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to={preferStudio ? "/portal" : "/studio"}>
              {preferStudio ? "Client portal" : "Trainer studio"}
            </Link>
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}

function QaEmilyButton({ setHandoff }: { setHandoff: (hold: boolean) => void }) {
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function go() {
    if (!authEnabled) return;
    setBusy(true);
    setHandoff(true);
    freezeSignedOutHeader(true);
    try {
      await seedDemoIfNeeded();
      await authClient.signOut().catch(() => undefined);
      const { data, error } = await authClient.signIn.email({
        email: QA_ADMIN.email,
        password: QA_ADMIN.password,
      });
      if (error || !data?.user) throw new Error(error?.message ?? "Could not sign in.");
      primeMe(data.user.id, await getMe());
      await openSignedIn(router, "/studio");
    } catch (err) {
      freezeSignedOutHeader(false);
      setHandoff(false);
      toast.error(err instanceof Error ? err.message : "Could not open the studio.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button type="button" className="book-cta w-full" disabled={busy || !authEnabled} onClick={() => void go()}>
      {busy ? "Opening studio…" : "Sign in as Emily"}
    </Button>
  );
}

function openSignedIn(router: ReturnType<typeof useRouter>, to: "/studio" | "/portal") {
  const page = document.querySelector("[data-login-root]");
  if (page instanceof HTMLElement) page.style.visibility = "hidden";
  const scroller = document.getElementById("app-scroll");
  if (scroller) scroller.scrollTop = 0;
  freezeSignedOutHeader(false);
  return router.navigate({ to });
}

function AuthCard({
  setHandoff,
}: {
  setHandoff: (hold: boolean) => void;
}) {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [paws, setPaws] = useState(0);
  const [signupNote, setSignupNote] = useState<null | "unknown" | "exists" | "invalid">(null);
  const [noteFlash, setNoteFlash] = useState(0);
  const router = useRouter();

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!authEnabled) return;
    setBusy(true);
    let signedInId = "";
    try {
      if (mode === "up") {
        const gate = await checkClientSignup({ data: { email: email.trim() } });
        if (gate.status !== "ok") {
          setSignupNote(gate.status);
          setNoteFlash((n) => n + 1);
          return;
        }
        setSignupNote(null);
        setPaws((n) => n + 1);
        setHandoff(true);
        freezeSignedOutHeader(true);
        const { data, error } = await authClient.signUp.email({
          email: email.trim(),
          password,
          name: name.trim() || email.split("@")[0]!,
        });
        if (error || !data?.user) throw new Error(error?.message ?? "Could not create account.");
        signedInId = data.user.id;
      } else {
        setSignupNote(null);
        setPaws((n) => n + 1);
        setHandoff(true);
        freezeSignedOutHeader(true);
        const { data, error } = await authClient.signIn.email({
          email: email.trim(),
          password,
        });
        if (error || !data?.user) throw new Error(error?.message ?? "Could not sign in.");
        signedInId = data.user.id;
      }
      primeMe(signedInId, await getMe());
      await openSignedIn(router, "/portal");
    } catch (err) {
      freezeSignedOutHeader(false);
      setHandoff(false);
      toast.error(err instanceof Error ? err.message : "Sign-in failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="bg-white">
      <CardBody className="space-y-5">
        <QaEmilyButton setHandoff={setHandoff} />
        <div className="flex rounded-md bg-ink p-1">
          {(["in", "up"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`h-10 flex-1 rounded-md text-sm font-medium transition-colors duration-150 ${
                mode === m ? "bg-white text-ink" : "text-bg/80 hover:text-bg"
              }`}
            >
              {m === "in" ? "Sign in" : "Create account"}
            </button>
          ))}
        </div>

        {authEnabled ? (
          <>
            <form className="space-y-5 [&_label>span:first-child]:text-base [&_input]:h-12 [&_input]:text-base" onSubmit={(e) => void onSubmit(e)}>
              {mode === "up" ? (
                <p className="text-sm leading-relaxed text-muted">Use the email from your consult.</p>
              ) : null}
              {mode === "up" ? (
                <Field label="Your name">
                  <Input value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" />
                </Field>
              ) : null}
              <Field label="Email">
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setSignupNote(null);
                  }}
                  required
                  autoComplete="email"
                />
              </Field>
              <Field label="Password" hint={mode === "up" ? "At least 8 characters." : undefined}>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete={mode === "up" ? "new-password" : "current-password"}
                />
              </Field>
              {signupNote === "unknown" ? (
                <p key={noteFlash} role="alert" className="visit-focus is-on rounded-lg border border-line bg-bg px-4 py-3 text-center text-sm leading-relaxed text-ink">
                  Looks like we don’t have this email yet.
                  <span className="mt-1 block">
                    Please{" "}
                    <Link to="/intake" className="font-semibold underline underline-offset-4 transition-colors duration-200 hover:text-accent-deep">
                      book a consult
                    </Link>
                    , then come back to create your login.
                  </span>
                </p>
              ) : null}
              {signupNote === "exists" ? (
                <p key={noteFlash} role="alert" className="visit-focus is-on rounded-lg border border-line bg-bg px-4 py-3 text-center text-sm leading-relaxed text-ink">
                  You already have a login.{" "}
                  <button
                    type="button"
                    className="font-semibold underline underline-offset-4"
                    onClick={() => {
                      setMode("in");
                      setSignupNote(null);
                    }}
                  >
                    Sign in
                  </button>{" "}
                  instead.
                </p>
              ) : null}
              {signupNote === "invalid" ? (
                <p role="alert" className="text-center text-sm text-ink">
                  Enter the email from your consult.
                </p>
              ) : null}
              <div className="relative">
                <Button
                  type="submit"
                  className="book-cta w-full"
                  disabled={busy}
                >
                  {busy ? "Please wait…" : mode === "up" ? "Create account" : "Sign in"}
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
            <p className="text-center text-xs text-muted">
              <Link to="/forgot-password" className="underline underline-offset-4">
                Forgot my password
              </Link>
            </p>
            <div className="relative py-1 text-center text-xs text-faint">
              <span className="absolute inset-x-0 top-1/2 h-px bg-line" />
              <span className="relative z-10 bg-white px-2">or continue with</span>
            </div>
            <div className="grid gap-2">
              {GROK_PROVIDERS.map((p) => (
                <Button
                  key={p.providerId}
                  type="button"
                  variant="outline"
                  onClick={() =>
                    signIn(p.providerId, {
                      callbackURL: "/portal",
                    })
                  }
                >
                  Continue with {p.label}
                </Button>
              ))}
            </div>
          </>
        ) : (
          <p className="text-sm text-muted">Sign-in is disabled.</p>
        )}
      </CardBody>
    </Card>
  );
}
