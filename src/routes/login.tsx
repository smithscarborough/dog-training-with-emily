import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { EspressoBanner } from "@/components/layout/espresso-banner";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Field } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { GROK_PROVIDERS, authClient, authEnabled, signIn } from "@/lib/auth/client";
import { SignInGate } from "@/lib/auth/gates";
import { becomeTrainer } from "@/lib/server/me";
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
  useEffect(() => {
    void seedDemoIfNeeded().catch(() => undefined);
  }, []);
  return (
    <div className="min-h-dvh">
      <EspressoBanner kicker="Emily — studio">
        No email code. Create an account with a password, then enter studio code{" "}
        <span className="font-semibold text-accent-soft">TEDDY</span>. You can
        change that code once you’re inside.
      </EspressoBanner>
      <main className="mx-auto w-full max-w-lg px-5 py-12 text-center sm:px-6 lg:py-16">
        <p className="text-sm text-muted">Login</p>
        <h1 className="mt-2 font-display text-4xl tracking-tight">Sign in.</h1>
        <p className="mx-auto mt-4 max-w-md text-muted leading-relaxed">
          Clients and Emily use the same page. Sign in with the email from
          your intake, or continue with Google or X.
        </p>
        <p className="mx-auto mt-4 max-w-md text-muted leading-relaxed">
          New here?{" "}
          <Link to="/intake" className="text-ink underline underline-offset-4">
            Book a consult
          </Link>{" "}
          first. You can create a login later.
        </p>
        <p className="mx-auto mt-6 max-w-md rounded-lg bg-bg px-4 py-3 text-sm leading-relaxed text-muted">
          Sample clients for QA — password{" "}
          <span className="font-semibold text-ink">PortalDemo1</span>
          <br />
          <span className="text-ink">jordan.hale@demo.local</span> · Maple
          <br />
          <span className="text-ink">priya.shah@demo.local</span> · Bean
          <br />
          <span className="text-ink">luis.ortega@demo.local</span> · Gus
          <br />
          Emily: create an account, then studio code{" "}
          <span className="font-semibold text-ink">TEDDY</span>.
        </p>
        <div className="mx-auto mt-10 w-full max-w-md text-left">
          <SignInGate fallback={<AuthCard preferStudio={as === "trainer"} />}>
            <AlreadyIn preferStudio={as === "trainer"} />
          </SignInGate>
        </div>
      </main>
    </div>
  );
}

function AlreadyIn({ preferStudio }: { preferStudio: boolean }) {
  return (
    <Card>
      <CardBody className="space-y-4">
        <h2 className="font-display text-2xl">You’re signed in.</h2>
        <p className="text-sm text-muted">
          Open your portal, or the studio if you train here.
        </p>
        <div className="flex flex-wrap gap-2">
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

function AuthCard({ preferStudio }: { preferStudio: boolean }) {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pin, setPin] = useState(preferStudio ? "TEDDY" : "");
  const [busy, setBusy] = useState(false);
  const [paws, setPaws] = useState(0);
  const navigate = useNavigate();

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!authEnabled) return;
    setBusy(true);
    try {
      if (mode === "up") {
        const { error } = await authClient.signUp.email({
          email: email.trim(),
          password,
          name: name.trim() || email.split("@")[0]!,
        });
        if (error) throw new Error(error.message ?? "Could not create account.");
      } else {
        const { error } = await authClient.signIn.email({
          email: email.trim(),
          password,
        });
        if (error) throw new Error(error.message ?? "Could not sign in.");
      }
      const code = pin.trim();
      if (code) {
        try {
          await becomeTrainer({ data: { pin: code } });
          toast.success("Studio is yours.");
          await navigate({ to: "/studio" });
          return;
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "Studio code didn’t match.");
          await navigate({ to: "/studio" });
          return;
        }
      }
      toast.success(mode === "up" ? "Account created." : "Welcome back.");
      await navigate({ to: "/portal" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sign-in failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="bg-white">
      <CardBody className="space-y-5">
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
                <Field label="Your name">
                  <Input value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" />
                </Field>
              ) : null}
              <Field label="Email">
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </Field>
              <Field label="Password" hint={mode === "up" ? "At least 8 characters. No email code is sent." : undefined}>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete={mode === "up" ? "new-password" : "current-password"}
                />
              </Field>
              <Field label="Studio code (Emily only)" hint="Leave blank if you’re a client.">
                <Input
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  autoComplete="off"
                  placeholder="TEDDY"
                />
              </Field>
              <div className="relative">
                <Button
                  type="submit"
                  className="book-cta w-full"
                  disabled={busy}
                  onClick={() => setPaws((n) => n + 1)}
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
                      callbackURL: pin.trim() ? "/studio" : "/portal",
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
