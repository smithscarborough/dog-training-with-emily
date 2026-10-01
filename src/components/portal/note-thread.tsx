import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FormattedText, RichTextField } from "@/components/studio/private-note";
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
  onDelete?: (messageId: number) => void | Promise<unknown>;
}) {
  const dogId = messages[0]?.dog_id ?? 0;
  const [extra, setExtra] = useState(0);
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [removingId, setRemovingId] = useState<number | null>(null);

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
            <div className="flex items-center justify-between gap-3">
              <p className="min-w-0 text-xs text-muted">
                <span className={cn("font-semibold", fromEmily ? "text-accent-deep" : "text-ink")}>
                  {fromEmily ? "Emily" : viewer === "client" ? "You" : clientName || message.owner_name || "Client"}
                </span>
                <span className="text-faint"> · </span>
                {formatWhen(message.created_at)}
                {viewer === "client" && fromEmily && !message.read_by_client ? (
                  <span className="ml-2 font-semibold text-accent-deep">New</span>
                ) : null}
              </p>
              {viewer === "client" && !fromEmily && onDelete ? (
                <div className="relative h-8 shrink-0">
                  <button
                    type="button"
                    aria-label="Delete this note"
                    tabIndex={confirmId === message.id ? -1 : 0}
                    aria-hidden={confirmId === message.id}
                    onClick={() => setConfirmId(message.id)}
                    className={cn(
                      "note-remove inline-flex h-8 items-center gap-1 rounded-md px-1.5 text-xs font-semibold text-muted transition-opacity duration-150 ease-out hover:bg-white hover:text-ink motion-reduce:transition-none",
                      confirmId === message.id && "pointer-events-none opacity-0",
                    )}
                  >
                    <svg viewBox="0 0 16 16" className="size-3.5" fill="none" aria-hidden="true">
                      <path d="M3.2 4.2h9.6M6.2 4.1V3.1c0-.4.3-.7.7-.7h2.2c.4 0 .7.3.7.7v1M4.4 4.2l.5 8.1c0 .4.4.7.8.7h4.6c.4 0 .8-.3.8-.7l.5-8.1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Delete
                  </button>
                  <div
                    className={cn(
                      "absolute right-0 top-0 flex h-8 items-center gap-2 whitespace-nowrap transition-opacity duration-150 ease-out motion-reduce:transition-none",
                      confirmId === message.id ? "opacity-100" : "pointer-events-none opacity-0",
                    )}
                    aria-hidden={confirmId !== message.id}
                  >
                    <p className="text-xs font-semibold text-ink">Remove?</p>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="note-cta h-8 border-0 px-3 text-xs font-semibold"
                      disabled={removingId === message.id}
                      tabIndex={confirmId === message.id ? 0 : -1}
                      onClick={() => setConfirmId(null)}
                    >
                      Keep it
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="espresso"
                      className="h-8 px-3 text-xs"
                      disabled={removingId === message.id}
                      tabIndex={confirmId === message.id ? 0 : -1}
                      onClick={() => {
                        if (!onDelete || removingId === message.id) return;
                        setRemovingId(message.id);
                        void Promise.resolve(onDelete(message.id))
                          .catch(() => setRemovingId(null))
                          .then(() => setRemovingId(null));
                      }}
                    >
                      {removingId === message.id ? "Removing…" : "Remove"}
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
            <FormattedText className="mt-1.5" text={message.body} />
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
      <RichTextField
        value={body}
        onChange={setBody}
        placeholder="Write a reply…"
        label="Write a reply"
        fieldClassName="min-h-[9.5rem] max-h-[22rem] overflow-y-auto"
      />
      <Button type="submit" disabled={busy || !body.trim()}>
        {busy ? "Sending…" : "Send reply"}
      </Button>
    </form>
  );
}
