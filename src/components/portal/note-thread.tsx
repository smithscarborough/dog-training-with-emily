import { useState } from "react";
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
  if (!messages.length) {
    return (
      <p className="text-sm leading-relaxed text-muted">
        {viewer === "client"
          ? "A note with your check-in is emailed to Emily. Her reply shows up here."
          : "No notes from this household yet."}
      </p>
    );
  }
  return (
    <ol className="space-y-3">
      {messages.map((message) => {
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
