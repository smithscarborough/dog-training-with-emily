import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Wordmark } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { formatWhen } from "@/lib/format";
import { getReplyPrompt, replyFromEmail } from "@/lib/server/messages";

export const Route = createFileRoute("/reply/$token")({
  component: ReplyPage,
});

function ReplyPage() {
  const { token } = Route.useParams();
  const [prompt, setPrompt] = useState<Awaited<ReturnType<typeof getReplyPrompt>> | undefined>(undefined);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [sentTo, setSentTo] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let live = true;
    void getReplyPrompt({ data: { token } })
      .then((row) => {
        if (live) setPrompt(row);
      })
      .catch(() => {
        if (live) setPrompt(null);
      });
    return () => {
      live = false;
    };
  }, [token]);

  return (
    <main className="min-h-dvh bg-bg px-5 py-10">
      <div className="mx-auto w-full max-w-lg">
        <Link to="/" className="inline-block">
          <Wordmark className="!h-16 sm:!h-20" />
        </Link>
        {prompt === undefined ? (
          <p className="mt-10 text-sm text-muted">Loading the note…</p>
        ) : prompt === null ? (
          <div className="mt-10 rounded-lg bg-surface px-5 py-6 hairline">
            <h1 className="font-display text-3xl tracking-tight">This link doesn’t work.</h1>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Open the studio if you’re already signed in, and reply from the client’s page.
            </p>
            <Link to="/studio" className="mt-4 inline-block text-sm font-semibold text-accent-deep">
              Open studio
            </Link>
          </div>
        ) : sentTo ? (
          <div className="mt-10 rounded-lg bg-surface px-5 py-6 hairline">
            <h1 className="font-display text-3xl tracking-tight">Sent.</h1>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              {sentTo}’s person will see this in their portal.
            </p>
          </div>
        ) : (
          <form
            className="mt-8 rounded-lg bg-surface px-5 py-6 hairline"
            onSubmit={(e) => {
              e.preventDefault();
              if (!body.trim() || busy) return;
              setBusy(true);
              setError("");
              void replyFromEmail({ data: { token, body } })
                .then((res) => setSentTo(res.dogName))
                .catch((err: unknown) =>
                  setError(err instanceof Error ? err.message : "Could not send."),
                )
                .finally(() => setBusy(false));
            }}
          >
            <p className="text-sm font-semibold text-accent-deep">Reply</p>
            <h1 className="mt-1 font-display text-3xl tracking-tight">
              {prompt.ownerName || "This household"}
              {prompt.dogName ? ` · ${prompt.dogName}` : ""}
            </h1>
            <p className="mt-2 text-xs text-muted">{formatWhen(prompt.createdAt)}</p>
            <blockquote className="mt-4 rounded-lg bg-pearl px-3.5 py-3 text-sm leading-relaxed text-ink">
              {prompt.body}
            </blockquote>
            <label className="mt-5 block text-sm font-semibold text-ink" htmlFor="emily-reply">
              Your reply
            </label>
            <Textarea
              id="emily-reply"
              className="mt-2"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="What you want them to know before the next session…"
              required
            />
            {error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}
            <Button className="mt-4" type="submit" disabled={busy || !body.trim()}>
              {busy ? "Sending…" : "Send to their portal"}
            </Button>
            <p className="mt-3 text-xs leading-relaxed text-muted">
              This posts in their portal. It does not send a separate email to them.
            </p>
          </form>
        )}
      </div>
    </main>
  );
}
