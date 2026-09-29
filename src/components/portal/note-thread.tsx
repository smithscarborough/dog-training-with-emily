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
}: {
  messages: MessageRow[];
  viewer: "client" | "trainer";
  clientName?: string;
}) {
  const dogId = messages[0]?.dog_id ?? 0;
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
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
  const older = messages.slice(0, Math.max(0, messages.length - recent));
  const buriedReply =
    viewer === "client" && older.some((message) => message.author === "trainer" && !message.read_by_client);
  const shown = open || buriedReply ? messages : messages.slice(-recent);
  const hidden = messages.length - shown.length;

  return (
    <div>
      {hidden > 0 ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mb-3 w-full rounded-lg px-3 py-2.5 text-sm font-medium text-accent-deep hairline transition-colors hover:bg-pearl"
        >
          Show {hidden} earlier {hidden === 1 ? "note" : "notes"}
        </button>
      ) : null}
      {open && messages.length > recent ? (
        <button
          type="button"
          onClick={() => setOpen(false)}
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
