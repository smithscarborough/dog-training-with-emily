import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { formatWhen } from "@/lib/format";
import { replyAsTrainer } from "@/lib/server/messages";
import type { MessageRow } from "@/lib/types";
import { cn } from "@/lib/utils";

export function NoteThread({
  messages,
  viewer,
  clientName,
  onDelete,
}: {
  messages: MessageRow[];
  viewer: "client" | "trainer";
  clientName?: string;
  onDelete?: (messageId: number) => void;
}) {
  const dogId = messages[0]?.dog_id ?? 0;
  const [extra, setExtra] = useState(0);
  const [confirmId, setConfirmId] = useState<number | null>(null);

  useEffect(() => {
    setExtra(0);
  }, [dogId]);

  if (!messages.length) {
    return (
      <p className="text-sm leading-relaxed text-muted">
        {viewer === "client"
          ? "A note with your check-in is emailed to Emily. Her reply shows up here."
          : "No notes from this household yet."}
      </p>
    );
  }

  const recent = 4;
  const step = 8;
  const unreadAt = messages.findIndex(
    (message) => message.author === "trainer" && !message.read_by_client,
  );
  const unreadFromEnd = unreadAt >= 0 ? messages.length - unreadAt : 0;
  const shownCount = Math.min(
    messages.length,
    Math.max(recent + extra, viewer === "client" ? unreadFromEnd : 0),
  );
  const shown = messages.slice(-shownCount);
  const hidden = messages.length - shown.length;
  const next = Math.min(step, hidden);

  return (
    <div>
      {hidden > 0 ? (
        <button
          type="button"
          onClick={() => setExtra(shownCount - recent + next)}
          className="mb-3 w-full rounded-lg px-3 py-2.5 text-sm font-medium text-accent-deep hairline transition-colors hover:bg-pearl"
        >
          Show {next} earlier {next === 1 ? "note" : "notes"}
        </button>
      ) : null}
      {shownCount > recent ? (
        <button
          type="button"
          onClick={() => setExtra(0)}
          className="mb-3 w-full rounded-lg px-3 py-2.5 text-sm font-medium text-muted hairline transition-colors hover:bg-pearl hover:text-ink"
        >
          Hide earlier notes
        </button>
      ) : null}
      <ol className="space-y-3">
        {shown.map((message) => {
        const fromEmily = message.author === "trainer";
        return (
          <li
            key={message.id}
            className={cn(
              "rounded-lg px-3.5 py-3",
              fromEmily ? "border-l-2 border-accent bg-accent-soft/35" : "bg-pearl",
            )}
          >
            <p className="text-xs text-muted">
              <span className={cn("font-semibold", fromEmily ? "text-accent-deep" : "text-ink")}>
                {fromEmily ? "Emily" : viewer === "client" ? "You" : clientName || message.owner_name || "Client"}
              </span>
              <span className="text-faint"> · </span>
              {formatWhen(message.created_at)}
              {viewer === "client" && fromEmily && !message.read_by_client ? (
                <span className="ml-2 font-semibold text-accent-deep">New</span>
              ) : null}
            </p>
            <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-ink">{message.body}</p>
            {viewer === "client" && !fromEmily && onDelete ? (
              confirmId === message.id ? (
                <p className="mt-2 text-xs text-muted">
                  Remove this note?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setConfirmId(null);
                      onDelete(message.id);
                    }}
                    className="font-semibold text-ink underline decoration-ink/40 underline-offset-2 hover:decoration-ink"
                  >
                    Yes, remove it
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmId(null)}
                    className="ml-3 text-faint hover:text-ink"
                  >
                    Keep it
                  </button>
                </p>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmId(message.id)}
                  className="mt-2 text-xs font-medium text-faint underline-offset-4 hover:text-muted hover:underline"
                >
                  Delete
                </button>
              )
            ) : null}
          </li>
        );
      })}
      </ol>
    </div>
  );
}

export function TrainerReply({
  dogId,
  onSent,
}: {
  dogId: number;
  onSent: () => void;
}) {
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (!body.trim() || busy) return;
        setBusy(true);
        void replyAsTrainer({ data: { dogId, body } })
          .then(() => {
            setBody("");
            toast.success("Reply sent. They’ll see it in their portal.");
            onSent();
          })
          .catch((err: unknown) =>
            toast.error(err instanceof Error ? err.message : "Could not send."),
          )
          .finally(() => setBusy(false));
      }}
    >
      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Reply to this household…"
        aria-label="Reply to this household"
      />
      <Button type="submit" disabled={busy || !body.trim()}>
        {busy ? "Sending…" : "Send reply"}
      </Button>
    </form>
  );
}
