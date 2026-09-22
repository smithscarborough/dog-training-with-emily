import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { PLACEHOLDER_EMAIL } from "@/lib/catalog";

export const Route = createFileRoute("/forgot-password")({
  component: ForgotPage,
});

function ForgotPage() {
  return (
    <div className="min-h-dvh">
      <main className="mx-auto max-w-lg px-4 py-16 sm:px-6">
        <p className="text-sm text-muted">Account help</p>
        <h1 className="mt-2 font-display text-4xl tracking-tight">Forgot my password</h1>
        <Card className="mt-8">
          <CardBody className="space-y-4 text-sm leading-relaxed text-muted">
            <p>
              If you created an email-and-password login, send a note from that
              same address and we'll get you back into the portal. If you
              originally used Google or X, return to sign-in and choose that
              button — there is no password to recover.
            </p>
            <p>
              Phone numbers are on file for session logistics, not as a login
              method.
            </p>
            <a
              className="inline-flex font-semibold text-accent-deep underline-offset-4 hover:underline"
              href={`mailto:${PLACEHOLDER_EMAIL}?subject=Password%20help`}
            >
              {PLACEHOLDER_EMAIL}
            </a>
            <div className="pt-2">
              <Button variant="outline" asChild>
                <Link to="/login">Back to sign in</Link>
              </Button>
            </div>
          </CardBody>
        </Card>
      </main>
    </div>
  );
}
