import { useLayoutEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { IntakeForm } from "@/components/intake/form";
import { SiteFooter } from "@/components/layout/site-footer";
import { Button } from "@/components/ui/button";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { submitPublicIntake } from "@/lib/server/dogs";
import { getPublicStudio } from "@/lib/server/public";
import { defaultHours, parseHours, type HoursDay } from "@/lib/hours";
import { cancelScrollAnim, scrollAppTo } from "@/lib/scroll-to-section";
import { useMe } from "@/lib/use-me";

export const Route = createFileRoute("/intake")({ component: IntakePage });

function IntakePage() {
  const { user } = useCurrentUserState();
  const { me } = useMe();
  const [done, setDone] = useState(false);
  const [code, setCode] = useState("");
  const [hours, setHours] = useState<HoursDay[]>(defaultHours);

  useLayoutEffect(() => {
    cancelScrollAnim();
    const scroller = document.getElementById("app-scroll");
    if (scroller) scroller.scrollTop = 0;
    window.scrollTo(0, 0);
    void getPublicStudio()
      .then((studio) => setHours(parseHours(studio.hours_json)))
      .catch(() => setHours(defaultHours()));
  }, []);

  return (
    <div className="min-h-dvh">
      <main>
        {done ? (
          <div className="mx-auto max-w-3xl px-5 py-12 text-center sm:px-6">
            <p className="text-sm font-semibold uppercase tracking-wide text-accent-deep">Request received</p>
            <h1 className="mt-2 font-display text-4xl tracking-tight">
              I’ll read this before we meet.
            </h1>
            <p className="mx-auto mt-4 max-w-md text-muted leading-relaxed">
              I’ll write you at the email you left to set a time. The consult is
              $40, in your home.
            </p>
            {code ? (
              <div className="mx-auto mt-8 max-w-md rounded-2xl border border-line bg-surface px-6 py-6">
                <p className="text-sm font-semibold text-ink">Your referral code</p>
                <p className="mt-1 font-display text-4xl tracking-wide text-ink">{code}</p>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  A friend enters this code when booking a consult. After that consult, one free hour is added to your account. The same code is in your portal once you log in.
                </p>
                <button
                  type="button"
                  className="mt-3 text-sm font-semibold text-accent-deep underline-offset-4 hover:underline"
                  onClick={() => {
                    void navigator.clipboard?.writeText(code).then(
                      () => toast.success("Referral code copied."),
                      () => toast.error("Could not copy."),
                    );
                  }}
                >
                  Copy referral code
                </button>
              </div>
            ) : null}
            <div className="mt-8 flex flex-wrap justify-center gap-2">
              <Button asChild>
                <Link to="/">Back home</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/login">Client login</Link>
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="mx-auto max-w-3xl px-5 pt-12 pb-8 text-center sm:px-6">
              <p className="text-sm font-semibold uppercase tracking-wide text-accent-deep">
                Book a consult · $40
              </p>
              <h1 className="mt-2 font-display text-4xl tracking-tight">
                Tell me about the household.
              </h1>
              <p className="mx-auto mt-3 max-w-xl text-muted leading-relaxed">
                Thirty minutes in your home. Tell me about the dog, the household,
                and what you want to change. I’ll read this before we meet so we
                can spend the consult on the real work.
              </p>
              {me?.dogs.length ? (
                <p className="mt-4 text-sm text-muted">
                  Already on file?{" "}
                  <Link to="/portal" className="font-semibold text-accent-deep underline-offset-4 hover:underline">
                    Open your portal
                  </Link>
                  .
                </p>
              ) : null}
            </div>
            <div className="mx-auto max-w-3xl px-5 pb-16 sm:px-6 sm:pb-24">
              <IntakeForm
                initial={{
                  owner_name: user?.displayName ?? "",
                  owner_email: user?.primaryEmail ?? "",
                }}
                hours={hours}
                submitLabel="Submit"
                onSubmit={async (data) => {
                  try {
                    const result = await submitPublicIntake({
                      data: {
                        ...data,
                        preferred_at: data.preferred_at ? new Date(data.preferred_at).toISOString() : "",
                      },
                    });
                    setCode(result.referralCode || "");
                    toast.success("Intake received. I’ll write you shortly.");
                    setDone(true);
                    scrollAppTo(0, "smooth");
                  } catch (err) {
                    toast.error(err instanceof Error ? err.message : "Could not save intake.");
                    throw err;
                  }
                }}
              />
            </div>
          </>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
